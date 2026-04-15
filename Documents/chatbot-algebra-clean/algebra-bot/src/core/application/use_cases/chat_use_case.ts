import { OllamaLLM } from "../../infrastructure/llm/ollama_llm";

export class ChatUseCase {
  private llm: OllamaLLM;

  constructor() {
    this.llm = new OllamaLLM();
  }

  async execute(userMessage: string): Promise<{ text: string; model: string }> {
    const text = await this.llm.respond(userMessage);
    return { text, model: this.llm.getModel() };
  }
}
