import { GoogleGenAI } from "@google/genai";

import { env } from "../utils/env.js";
import { ProviderError } from "./provider-error.js";
import { Models } from "./models.js";
import { MetricsTracker } from "./metrics-tracker.js";
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
            (m) => {
              let text = m.content;
              if (text.length > 12000) {
                text = text.slice(0, 12000) + "\n\n...[Context Truncated to Stay Within Token Limits]...";
              }
              return `${m.role.toUpperCase()}:\n${text}`;
            },
          )
          .join("\n\n");

      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Gemini request timed out")), 90000);
      });

      try {
        const contentParts: any[] = [prompt];
        if (options?.image) {
          contentParts.push({
            inlineData: {
              mimeType: options.image.mimeType,
              data: options.image.data
            }
          });
        }

        const response = await Promise.race([
          this.client.models.generateContent({
            model:
              options?.model ??
              Models.gemini.default,
            contents: contentParts,
            config: {
              maxOutputTokens: options?.maxTokens ?? 8192,
            },
          }),
          timeoutPromise,
        ]);
        if (timeoutId) clearTimeout(timeoutId);

        if (response.usageMetadata) {
          const prompt = response.usageMetadata.promptTokenCount || 0;
          const completion = response.usageMetadata.candidatesTokenCount || 0;
          MetricsTracker.getInstance().logUsage(prompt, completion);
        }

        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason === "MAX_TOKENS") {
          throw new ProviderError(
            "Gemini response was truncated (MAX_TOKENS) — output incomplete.",
            2
          );
        }

        return response.text ?? "";
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    } catch (error: any) {
      const msg = String(error?.message ?? error ?? "Provider request failed.");
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("resource_exhausted") || msg.toLowerCase().includes("overloaded");
      const retryAfter = isRateLimit ? 5 : undefined;
      throw new ProviderError(
        msg,
        retryAfter,
        error,
      );
    }
  }
}
