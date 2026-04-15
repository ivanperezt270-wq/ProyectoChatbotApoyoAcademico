import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
  
    const body = await req.json();
const { message, conversationId } = body;

// 👇 AQUÍ VA LO NUEVO
const lowerMsg = message.toLowerCase();

if (
  lowerMsg.includes("quién eres") ||
  lowerMsg.includes("quien eres") ||
  lowerMsg.includes("qué eres") ||
  lowerMsg.includes("que eres")
) {
  const identityResponse = `Soy GarzaMath, tu tutor de álgebra 🤓

Estoy diseñado para ayudarte a entender matemáticas paso a paso
No solo te doy respuestas, te enseño cómo llegar a ellas.
Cuentame, ¿En que puedo ayudarte?`;

  if (conversationId) {
    await prisma.message.create({
      data: {
        role: "assistant",
        content: identityResponse,
        conversation: {
          connect: { id: conversationId },
        },
      },
    });
  }

  return new Response(identityResponse, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-conversation-id": conversationId || "",
    },
  });
}
    

    if (!message) {
      return NextResponse.json(
        { error: "Mensaje requerido" },
        { status: 400 }
      );
    }

    // 🔥 CREAR CONVERSACIÓN
    let realConversationId = conversationId;

    if (!realConversationId) {
      const newConv = await prisma.conversation.create({
        data: {
          title: message.slice(0, 30),
        },
      });

      realConversationId = newConv.id;
    }

    // 💾 GUARDAR MENSAJE USUARIO
    await prisma.message.create({
      data: {
        role: "user",
        content: message,
        conversation: {
          connect: { id: realConversationId },
        },
      },
    });

    // 💾 MEMORY GLOBAL
    await prisma.memory.create({
      data: {
        userId: "global",
        content: `USER: ${message}`,
      },
    });

    // ⚡ HISTORIAL REAL (CLAVE)
    const conversationHistory = await prisma.message.findMany({
      where: {
        conversationId: realConversationId,
      },
      orderBy: { createdAt: "asc" },
      take: 8, // 🔥 corto = más estable
    });

    const messagesForModel = conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const memories = await prisma.memory.findMany({
  where: { userId: "global" },
  orderBy: { createdAt: "desc" },
  take: 10,
});

const memoryContext = memories
  .filter((m) => m.content.startsWith("USER"))
  .map((m) => m.content)
  .reverse()
  .join("\n");

    // 🧠 PROMPT SIMPLE Y ESTABLE
  const systemPrompt = {
  role: "system",
  content: `
Eres GarzaMath, un tutor experto en álgebra.

🧠 TU MISIÓN:
Ayudar al alumno a ENTENDER el álgebra paso a paso, no solo dar respuestas.

🗣️ FORMA DE HABLAR:
- Usa lenguaje claro y sencillo
- Explica como si el alumno fuera principiante
- Tono amigable pero respetuoso
- Usa emojis moderados (👇 👍 ✏️)

Frases que puedes usar:
- "Vamos paso a paso 👇"
- "No te preocupes, esto es más fácil de lo que parece"
- "Buen intento 👍, vamos a mejorar esto"
- "Piensa en esto…"

📚 FORMA DE ENSEÑAR:

SIEMPRE sigue esta estructura:

1. Detecta qué tipo de problema es (ecuación, simplificación, etc.)
2. Explica brevemente el concepto
3. Resuelve paso a paso
4. Haz una pequeña pregunta al alumno para reforzar

✏️ EJEMPLO DE ESTRUCTURA:

Paso 1: ...
Paso 2: ...
Resultado: ...

❗ EXPLICACIÓN PROGRESIVA:
- Ve de lo simple → a lo más complejo
- No saltes pasos

💡 SI EL USUARIO SE EQUIVOCA:
- Corrige sin juzgar
- Explica el porqué
- Ayuda a entender el error

🎯 REFUERZO POSITIVO:
Siempre motiva al usuario con frases como:
- "¡Vas muy bien!"
- "Eso ya es avance 👏"
- "Casi lo tienes"

🧾 IDENTIDAD (MUY IMPORTANTE):
Si el usuario pregunta quién eres o qué eres, responde EXACTAMENTE:
"Soy GarzaMath, tu tutor de álgebra 🤓

Estoy diseñado para ayudarte a entender matemáticas paso a paso
No solo te doy respuestas, te enseño cómo llegar a ellas."

🧠 MEMORIA DEL USUARIO:
${memoryContext}

REGLAS IMPORTANTES:
- Usa el contexto de la conversación actual
- Usa la memoria solo si ayuda
- NO digas que estás usando memoria
- Responde de forma clara, ordenada y natural
`,
};

    // 🔥 LLAMADA CORRECTA
    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2.5:1.5b",
        stream: true,
        messages: [
          systemPrompt,
          ...messagesForModel, // 🔥 contexto real
        ],
      }),
    });

    const reader = ollamaResponse.body?.getReader();
    const decoder = new TextDecoder("utf-8");

    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter(Boolean);

            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                const content = parsed.message?.content || "";

                if (content) {
                  fullResponse += content;

                  controller.enqueue(
                    new TextEncoder().encode(content)
                  );
                }
              } catch {}
            }
          }

          // 💾 GUARDAR RESPUESTA
          if (fullResponse.trim()) {
            await prisma.message.create({
              data: {
                role: "assistant",
                content: fullResponse,
                conversation: {
                  connect: { id: realConversationId },
                },
              },
            });

            await prisma.memory.create({
              data: {
                userId: "global",
                content: `ASSISTANT: ${fullResponse}`,
              },
            });
          }

        } catch (err) {
          console.error("Error en stream:", err);
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-conversation-id": realConversationId,
      },
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}