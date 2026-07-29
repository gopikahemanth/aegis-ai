import { ProviderError } from "./provider-error.js";
import type { AIProvider, ChatMessage, ChatOptions } from "./base.js";

export class OllamaProvider implements AIProvider {
  public readonly name = "ollama";

  constructor(
    private readonly host = "http://127.0.0.1:11434",
    private readonly defaultModel = "llama3"
  ) {}

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<string> {
    try {
      const response = await fetch(`${this.host}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: options?.model ?? this.defaultModel,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.2,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama HTTP Error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as {
        message?: { content?: string };
      };
      return data.message?.content ?? "";
    } catch (error: any) {
      throw new ProviderError(
        error?.message ?? "Ollama connection failed.",
        undefined,
        error
      );
    }
  }
}
