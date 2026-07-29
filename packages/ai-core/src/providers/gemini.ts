import { GoogleGenAI } from "@google/genai";

import { env } from "../utils/env.js";
import { ProviderError } from "./provider-error.js";
import { Models } from "./models.js";
import type {
  AIProvider,
  ChatMessage,
  ChatOptions,
} from "./base.js";

export class GeminiProvider implements AIProvider {
  public readonly name = "gemini";

  private readonly client: GoogleGenAI;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is not configured.",
      );
    }

    this.client = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
    });
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<string> {
    try {
      const prompt =
        messages
          .map(
            (m) =>
              `${m.role.toUpperCase()}:\n${m.content}`,
          )
          .join("\n\n");

      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Gemini request timed out")), 90000);
      });

      try {
        const response = await Promise.race([
          this.client.models.generateContent({
            model:
              options?.model ??
              Models.gemini.default,
            contents: prompt,
          }),
          timeoutPromise,
        ]);
        if (timeoutId) clearTimeout(timeoutId);
        return response.text ?? "";
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }
    } catch (error: any) {
      throw new ProviderError(
        error?.message ??
          "Provider request failed.",
        undefined,
        error,
      );
    }
  }
}
