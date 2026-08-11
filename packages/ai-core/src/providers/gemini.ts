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
  public readonly name: string;
  private readonly client: GoogleGenAI;

  constructor(apiKey?: string, customName: string = "gemini") {
    const key = apiKey || env.GEMINI_API_KEY;
    this.name = customName;

    if (!key) {
      throw new Error(
        "GEMINI_API_KEY is not configured.",
      );
    }

    this.client = new GoogleGenAI({
      apiKey: key,
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

      const geminiFreeModels = [
        options?.model ?? Models.gemini.default,
        "gemini-3.1-flash-lite",
        "gemini-1.5-flash"
      ];
      // Deduplicate
      const uniqueModels = [...new Set(geminiFreeModels)];
      let lastGeminiError: any = null;

      for (const targetModel of uniqueModels) {
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
              model: targetModel,
              contents: contentParts,
              config: {
                maxOutputTokens: options?.maxTokens ?? 8192,
              },
            }),
            timeoutPromise,
          ]);
          if (timeoutId) clearTimeout(timeoutId);

          if (response.usageMetadata) {
            const promptCount = response.usageMetadata.promptTokenCount || 0;
            const completionCount = response.usageMetadata.candidatesTokenCount || 0;
            MetricsTracker.getInstance().logUsage(promptCount, completionCount);
          }

          const finishReason = response.candidates?.[0]?.finishReason;
          if (finishReason === "MAX_TOKENS") {
            throw new ProviderError(
              "Gemini response was truncated (MAX_TOKENS) — output incomplete.",
              2
            );
          }

          return response.text ?? "";
        } catch (err: any) {
          if (timeoutId) clearTimeout(timeoutId);
          lastGeminiError = err;
          const msg = String(err?.message ?? err);
          const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("resource_exhausted");
          const isNotFound = msg.includes("404") || msg.toLowerCase().includes("not_found") || msg.toLowerCase().includes("no longer available");
          if ((isRateLimit || isNotFound) && targetModel !== uniqueModels[uniqueModels.length - 1]) {
            if (isNotFound) {
              console.warn(`[Gemini:${this.name}] Model "${targetModel}" returned 404 NOT_FOUND (deprecated). Skipping to next model...`);
            } else {
              console.warn(`[Gemini:${this.name}] Rate limit on model "${targetModel}". Falling back to next free Gemini model...`);
            }
            continue;
          }
          throw err;
        }
      }
      throw lastGeminiError;
    } catch (error: any) {
      const msg = String(error?.message ?? error ?? "Provider request failed.");
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("resource_exhausted") || msg.toLowerCase().includes("overloaded");
      let retryAfter: number | undefined = undefined;
      if (isRateLimit) {
        // Try to extract retryDelay from error JSON (e.g. "retryDelay":"58s" or "Please retry in 58.4s")
        const retryDelayMatch = msg.match(/"retryDelay":\s*"(\d+)s?"/i) || msg.match(/retry in ([0-9.]+)\s*s/i);
        retryAfter = retryDelayMatch ? Math.ceil(parseFloat(retryDelayMatch[1])) : 15;
      }
      throw new ProviderError(
        msg,
        retryAfter,
        error,
      );
    }
  }
}
