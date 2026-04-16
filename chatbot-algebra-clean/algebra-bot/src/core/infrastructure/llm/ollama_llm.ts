type OllamaChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class OllamaLLM {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
    this.model = process.env.OLLAMA_MODEL || "phi3:latest";
  }

  async respond(message: string): Promise<string> {
    const system: OllamaChatMessage = {
      role: "system",
      content:
        "Eres un tutor experto en álgebra. Responde en español. " +
        "Resuelve paso a paso y verifica resultados.",
    };

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages: [system, { role: "user", content: message }],
        options: { temperature: 0.2, num_predict: 256 }
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Ollama HTTP ${res.status}: ${txt}`);
    }

    const data = await res.json();
    return data?.message?.content ?? "Ollama no devolvió contenido.";
  }

  getModel() {
    return this.model;
  }
}
