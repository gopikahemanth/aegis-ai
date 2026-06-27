import Groq from "groq-sdk";
import { env } from "../utils/env.js";
import type {
  AIProvider,
  ChatMessage,
  ChatOptions,
} from "./base.js";

export class GroqProvider implements AIProvider {
  public readonly name = "groq";

  private readonly client: Groq;

  constructor() {
    if (!env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured.");
    }

    this.client = new Groq({
      apiKey: env.GROQ_API_KEY,
    });
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? "llama-3.3-70b-versatile",
      temperature: options?.temperature ?? 0.2,
      max_completion_tokens: options?.maxTokens ?? 4096,
      messages,
    });

    return response.choices[0]?.message?.content ?? "";
  }
}
