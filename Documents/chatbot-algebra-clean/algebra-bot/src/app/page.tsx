"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
};

export default function Page() {

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesRef = useRef<HTMLDivElement>(null);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId]
  );

  // 🔥 SOLO ESTO CAMBIÓ
  function esAlgebra(text: string) {
    const t = text.toLowerCase();

    if (
      t.includes("quien eres") ||
      t.includes("quién eres") ||
      t.includes("como te llamas") ||
      t.includes("cómo te llamas") ||
      t.includes("que eres") ||
      t.includes("qué eres") ||
      t.includes("hola") ||
      t.includes("gracias")
    ) {
      return true;
    }

    const tieneNumeros = /\d/.test(t);
    const tieneOperaciones = /[\+\-\*\/\^=]/.test(t);

    const palabrasClave = [
      "ecuacion", "resolver", "factorizar", "despejar",
      "polinomio", "algebra", "expresion", "variable"
    ];

    const tienePalabraClave = palabrasClave.some(p => t.includes(p));

    return (tieneNumeros && tieneOperaciones) || tienePalabraClave;
  }

  function cleanText(text: string) {
    return text
      .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, "$1/$2")
      .replace(/\\cdot/g, "×")
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")
      .replace(/\\text\{(.*?)\}/g, "$1")
      .replace(/\\/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/conversations");
      const data = await res.json();

      if (!Array.isArray(data)) return;

      const unique = new Map<string, Conversation>();

      data.forEach((c: any) => {
        if (!unique.has(c.id)) {
          unique.set(c.id, {
            id: c.id,
            title: c.title,
            messages: [],
          });
        }
      });

      const formatted = Array.from(unique.values());

      const newConversation = {
        id: "temp-" + Date.now(),
        title: "Nuevo Chat",
        messages: [],
      };

      setConversations([newConversation, ...formatted]);
      setActiveId(newConversation.id);
    }

    load();
  }, []);

  useEffect(() => {
    async function loadMessages() {

      if (!activeId || activeId.startsWith("temp-")) return;

      const res = await fetch(`/api/conversations/${activeId}`);
      const data = await res.json();

      if (!Array.isArray(data)) return;

      const messages = data.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.createdAt).getTime(),
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages }
            : c
        )
      );
    }

    loadMessages();
  }, [activeId]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop =
        messagesRef.current.scrollHeight;
    }
  }, [active?.messages.length, loading]);

  function newChat() {
    const newConversation = {
      id: "temp-" + Date.now(),
      title: "Nuevo Chat",
      messages: [],
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveId(newConversation.id);
  }

  async function deleteChat(id: string) {
    await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
    });

    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);

    if (id === activeId) {
      setActiveId(updated[0]?.id || "");
    }
  }

  async function sendMessage(text: string) {

    if (!text.trim()) return;

    const userMessage: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      )
    );

   if (!esAlgebra(text)) {
  console.log("Mensaje fuera de álgebra:", text);
}

    setLoading(true);

    const history =
      active?.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })) ?? [];

    const conversationToSend =
      activeId.startsWith("temp-") ? undefined : activeId;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
        conversationId: conversationToSend,
      }),
    });

    const realConversationId = res.headers.get("x-conversation-id");

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let fullText = "";

    const botMessage: Message = {
      id: "assistant-" + Date.now(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, botMessage] }
          : c
      )
    );

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === botMessage.id
                    ? { ...m, content: fullText }
                    : m
                ),
              }
            : c
        )
      );
    }

    if (realConversationId && activeId.startsWith("temp-")) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, id: realConversationId }
            : c
        )
      );

      setActiveId(realConversationId);
    }

    setLoading(false);
  }

  return (

    <div style={{
      display: "flex",
      height: "100vh",
      fontFamily: "Inter, sans-serif",
      background: "#f3f4f6"
    }}>

      {/* SIDEBAR */}
      <div style={{
        width: sidebarOpen ? 260 : 0,
        transition: "0.3s",
        background: "#f3f4f6",
        borderRight: "1px solid #e5e7eb",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>

        <div style={{
          padding: 16,
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#8b1c1c",
          color: "white"
        }}>
          <img src="/garzamath.png" style={{ width: 28, borderRadius: "50%" }} />
          GarzaMath
        </div>

        <div style={{ padding: "10px" }}>
          <input
            placeholder="Buscar"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 10,
              border: "none",
              background: "white"
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {conversations.map(c => (
            <div key={c.id} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
              borderRadius: 10,
              marginBottom: 5,
              background: c.id === activeId ? "#e5e7eb" : "transparent",
              cursor: "pointer"
            }}>
              <span onClick={() => setActiveId(c.id)}>
                {c.title}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(c.id);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>

        <button onClick={newChat} style={{
          margin: 12,
          padding: 10,
          borderRadius: 10,
          background: "#ea580c",
          border: "none",
          color: "white",
          fontWeight: "bold"
        }}>
          + Nuevo Chat
        </button>

      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        <div style={{ padding: 15 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        </div>

        <div ref={messagesRef} style={{
          flex: 1,
          overflowY: "auto",
          padding: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: active?.messages.length === 0 ? "center" : "stretch",
          justifyContent: active?.messages.length === 0 ? "center" : "flex-start"
        }}>

          {active?.messages.length === 0 && (
            <div style={{ textAlign: "center" }}>
              <img src="/garzamath.png" style={{ width: 160, borderRadius: "50%" }} />
              <h1>¡Hola!, soy GarzaMath</h1>
              <p style={{ color: "#ef4444" }}>
                Dime, ¿En qué puedo ayudarte hoy?
              </p>
            </div>
          )}

          {active?.messages.map(m => (
            <div key={m.id} style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#ea580c" : "white",
              padding: 12,
              borderRadius: 12,
              maxWidth: "60%",
              marginBottom: 10
            }}>
              {m.role === "assistant"
                ? (
                  <div style={{ lineHeight: "1.7" }}>
                    <ReactMarkdown>
                      {cleanText(m.content)
                        .replace(/\n?\s*\d+\.\s*\n/g, "\n")
                        .split(/\n+/)
                        .filter(line => line.trim() !== "")
                        .map((line, i) => `${i + 1}. ${line.trim()}`)
                        .join("\n\n")
                        .replace(/\. /g, ".\n\n")}
                    </ReactMarkdown>
                  </div>
                )
                : m.content}
            </div>
          ))}

        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
          setInput("");
        }} style={{ padding: 25 }}>

          <div style={{
            width: "100%",
            maxWidth: 750,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            border: "2px solid #dc2626",
            borderRadius: 22,
            padding: 8,
            background: "#f9fafb"
          }}>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu duda o ejercicio..."
              style={{
                flex: 1,
                padding: 10,
                background: "#e5e7eb",
                borderRadius: 10,
                border: "none",
                outline: "none"
              }}
            />

            <button style={{
              width: 45,
              height: 45,
              borderRadius: "50%",
              background: "#ea580c",
              border: "none",
              color: "white"
            }}>
              ↑
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}