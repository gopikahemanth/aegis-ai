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
  private static readonly modelCooldowns = new Map<string, number>();
  private static readonly invalidModels = new Set<string>(["gemini-3.8-flash"]);

  public static resetCooldowns(): void {
    GeminiProvider.modelCooldowns.clear();
  }

  public static getModelCooldowns(): Map<string, number> {
    const map = new Map<string, number>();
    for (const [key, val] of GeminiProvider.modelCooldowns.entries()) {
      map.set(key, val);
      if (key.includes(":")) {
        const [, model] = key.split(":");
        map.set(model, val);
      }
    }
    return map;
  }

  public static getInvalidModels(): Set<string> {
    return new Set(GeminiProvider.invalidModels);
  }

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
              if (text.length > 250000) {
                text = text.slice(0, 250000) + "\n\n...[Context Truncated to Stay Within Token Limits]...";
              }
              return `${m.role.toUpperCase()}:\n${text}`;
            },
          )
          .join("\n\n");

      const geminiFreeModels = [
        options?.model ?? Models.gemini.default,
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemini-3.1-flash-lite",
      ];
      // Deduplicate
      const uniqueModels = [...new Set(geminiFreeModels)];
      const now = Date.now();
      const availableModels = uniqueModels.filter((m) => {
        if (GeminiProvider.invalidModels.has(m)) return false;
        const cooldownKey = `${this.name}:${m}`;
        const cooldownUntil = GeminiProvider.modelCooldowns.get(cooldownKey);
        if (cooldownUntil && cooldownUntil > now) {
          return false;
        }
        return true;
      });

      if (availableModels.length === 0) {
        const remainingCooldowns = uniqueModels
          .map(m => (GeminiProvider.modelCooldowns.get(`${this.name}:${m}`) ?? 0) - now)
          .filter(rem => rem > 0);
        const minRemainingMs = remainingCooldowns.length > 0 ? Math.min(...remainingCooldowns) : 60000;
        const retryAfterSec = Math.ceil(minRemainingMs / 1000);
        console.warn(`[Gemini:${this.name}] ⚡ All models are on cooldown for this key. Fast-skipping provider immediately in 0ms (earliest recovery in ${retryAfterSec}s)...`);
        throw new ProviderError(
          `All models in cooldown for Gemini provider "${this.name}". Retry after ${retryAfterSec}s`,
          retryAfterSec
        );
      }

      const modelsToTry = availableModels;
      let lastGeminiError: any = null;

      for (const targetModel of modelsToTry) {
        let timeoutId: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Gemini request timed out")), 45000);
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
                maxOutputTokens: options?.maxTokens ?? 32768,
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
            const text = response.text ?? "";
            const lastEndIdx = text.lastIndexOf("===END===");
            if (lastEndIdx !== -1) {
              const salvagedText = text.substring(0, lastEndIdx + 9);
              console.warn(`[Gemini:${this.name}] Response hit MAX_TOKENS (${text.length} chars). Salvaging completed files up to last ===END=== (${salvagedText.length} chars)...`);
              return salvagedText;
            }
            if (text.length > 500) {
              console.warn(`[Gemini:${this.name}] Response hit MAX_TOKENS (${text.length} chars). Salvaging partial response...`);
              return text;
            }
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
          const isNotFound = msg.includes("404") || msg.toLowerCase().includes("not_found") || msg.toLowerCase().includes("no longer available") || msg.toLowerCase().includes("does not exist");
          const is503 = msg.includes("503") || msg.toLowerCase().includes("high demand") || msg.toLowerCase().includes("unavailable") || msg.toLowerCase().includes("overloaded");

          if (isRateLimit) {
            let cooldownSeconds = 60;
            const retryDelayMatch = msg.match(/"retryDelay":\s*"(\d+)s?"/i) || msg.match(/retry in ([0-9.]+)\s*s/i);
            if (retryDelayMatch) {
              cooldownSeconds = Math.max(cooldownSeconds, Math.ceil(parseFloat(retryDelayMatch[1])));
            }
            const cooldownKey = `${this.name}:${targetModel}`;
            const expiry = Date.now() + cooldownSeconds * 1000;
            GeminiProvider.modelCooldowns.set(cooldownKey, expiry);
            console.warn(`[Gemini:${this.name}] Rate limit (429) on model "${targetModel}". Model placed on ${cooldownSeconds}s cooldown.`);

            // If account/daily quota exhausted, place all candidate models for this key on cooldown
            const isDaily = msg.toLowerCase().includes("per day") || msg.toLowerCase().includes("daily");
            if (isDaily) {
              for (const m of uniqueModels) {
                GeminiProvider.modelCooldowns.set(`${this.name}:${m}`, Date.now() + 3600 * 1000);
              }
            }
          }

          if (is503) {
            const cooldownKey = `${this.name}:${targetModel}`;
            GeminiProvider.modelCooldowns.set(cooldownKey, Date.now() + 60 * 1000);
            console.warn(`[Gemini:${this.name}] 503 High Demand on model "${targetModel}". Model placed on 60s cooldown.`);
          }

          const isTimeout = msg.includes("timed out");
          if (isTimeout) {
            const cooldownKey = `${this.name}:${targetModel}`;
            GeminiProvider.modelCooldowns.set(cooldownKey, Date.now() + 60 * 1000);
            console.warn(`[Gemini:${this.name}] Request timed out on model "${targetModel}". Model placed on 60s cooldown.`);
          }

          if (isNotFound) {
            GeminiProvider.invalidModels.add(targetModel);
            console.warn(`[Gemini:${this.name}] Model "${targetModel}" returned 404 NOT_FOUND. Marked permanently invalid.`);
          }

          if ((isRateLimit || isNotFound || is503) && targetModel !== modelsToTry[modelsToTry.length - 1]) {
            if (is503) {
              console.warn(`[Gemini:${this.name}] Model "${targetModel}" temporarily under high demand (503). Retrying next Gemini model...`);
            } else if (isNotFound) {
              console.warn(`[Gemini:${this.name}] Skipping to next Gemini model...`);
            } else {
              console.warn(`[Gemini:${this.name}] Falling back to next Gemini model...`);
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
