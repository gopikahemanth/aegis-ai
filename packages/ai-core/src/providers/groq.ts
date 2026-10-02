import Groq from "groq-sdk";
import { env } from "../utils/env.js";
import { ProviderError } from "./provider-error.js";
import { Models } from "./models.js";
import { MetricsTracker } from "./metrics-tracker.js";
import { RollingTokenRateLimiter } from "./rolling-rate-limiter.js";
import { TokenBudgetManager } from "../context/token-budget.js";

import type {
  AIProvider,
  ChatMessage,
  ChatOptions,
} from "./base.js";

export class GroqProvider implements AIProvider {
  public readonly name = "groq";

  private readonly client: Groq;

  // Shared static rate limiter ensures all agents share the rolling 60s TPM window
  private static rateLimiterInstance: RollingTokenRateLimiter | null = null;

  public static getRateLimiter(): RollingTokenRateLimiter {
    if (!this.rateLimiterInstance) {
      const profile = TokenBudgetManager.getProfile("groq");
      this.rateLimiterInstance = new RollingTokenRateLimiter(profile.tpmLimit);
    }
    return this.rateLimiterInstance;
  }

  public static setRateLimiter(limiter: RollingTokenRateLimiter): void {
    this.rateLimiterInstance = limiter;
  }

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
    const totalPromptText = messages.map(m => m.content).join("\n");
    const estimatedPromptTokens = TokenBudgetManager.estimateTokens(totalPromptText, true);

    // Hard defensive guard: reject prompts that overflow safe context limits
    const MAX_SAFE_PROMPT_TOKENS = 7500;
    if (estimatedPromptTokens > MAX_SAFE_PROMPT_TOKENS) {
      throw new ProviderError(
        `GROQ_PROMPT_OVERFLOW_ERROR: Assembled prompt exceeds safe Groq limit (${estimatedPromptTokens} tokens > ${MAX_SAFE_PROMPT_TOKENS} ceiling). Upstream context must be constrained.`
      );
    }

    const expectedCompletionTokens = options?.maxTokens ?? 3500;
    const estimatedTotalTokens = estimatedPromptTokens + expectedCompletionTokens;

    const rateLimiter = GroqProvider.getRateLimiter();
    const reservationId = await rateLimiter.reserveTokens(estimatedTotalTokens);

    try {
      const response = await this.client.chat.completions.create({
        model: options?.model ?? Models.groq.default,
        temperature: options?.temperature ?? 0.2,
        max_completion_tokens: expectedCompletionTokens,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      // Detect finish_reason: length (truncated output) and treat as hard error
      const finishReason = response.choices[0]?.finish_reason;
      if (finishReason === "length") {
        throw new ProviderError(
          "GROQ_OUTPUT_TRUNCATED: Completion reached max_completion_tokens limit. Output was truncated mid-generation."
        );
      }

      if (response.usage) {
        const promptTokens = response.usage.prompt_tokens || estimatedPromptTokens;
        const completionTokens = response.usage.completion_tokens || 0;
        MetricsTracker.getInstance().logUsage(promptTokens, completionTokens);
        rateLimiter.reconcileUsage(reservationId, promptTokens + completionTokens);
      } else {
        rateLimiter.reconcileUsage(reservationId, estimatedTotalTokens);
      }

      return response.choices[0]?.message?.content ?? "";

    } catch (error: any) {
      // Release reservation on failure, accounting for prompt tokens if they reached Groq
      rateLimiter.releaseReservation(reservationId, estimatedPromptTokens);

      const msg: string = error?.error?.error?.message ?? error?.message ?? "Provider request failed.";

      if (msg.includes("GROQ_PROMPT_OVERFLOW_ERROR") || msg.includes("GROQ_OUTPUT_TRUNCATED")) {
        throw error;
      }

      // Parse retry time from Groq error messages like "try again in 24m3.744s" or "try again in 3.5s"
      let retryAfter: number | undefined = Number(error?.headers?.["retry-after"]) || undefined;
      if (!retryAfter) {
        const minuteMatch = msg.match(/try again in (\d+)m([\d.]+)s/i);
        const secondMatch = msg.match(/try again in ([\d.]+)s/i);
        if (minuteMatch) {
          retryAfter = parseInt(minuteMatch[1]) * 60 + Math.ceil(parseFloat(minuteMatch[2]));
        } else if (secondMatch) {
          retryAfter = Math.ceil(parseFloat(secondMatch[1]));
        }
      }

      throw new ProviderError(
        msg,
        retryAfter,
        error,
      );
    }
  }
}
