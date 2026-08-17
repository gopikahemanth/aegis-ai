/**
 * LLMRetryManager
 *
 * Classifies LLM failures (rate limits, timeouts, provider failures, invalid output)
 * and executes targeted retry strategies with backoff, token tracking, and provider fallback.
 */

export type LLMErrorCategory =
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "PROVIDER_ERROR"
  | "INVALID_OUTPUT"
  | "CONTRACT_VIOLATION"
  | "UNKNOWN";

export interface LLMRetryAttempt {
  attemptNumber: number;
  category: LLMErrorCategory;
  errorMessage: string;
  delayMs: number;
  providerUsed: string;
  fallbackTriggered: boolean;
}

export interface LLMRetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  fallbackProvider?: string;
}

export class LLMRetryManager {
  private static readonly DEFAULT_CONFIG: LLMRetryConfig = {
    maxRetries: 3,
    initialDelayMs: 250,
    backoffMultiplier: 2,
  };

  /**
   * Classify error message or exception from an LLM call.
   */
  public static classifyError(error: any): { category: LLMErrorCategory; isRetryable: boolean; reason: string } {
    const msg = (error?.message || String(error || "")).toLowerCase();
    const status = error?.status || error?.statusCode;

    if (msg.includes("rate limit") || msg.includes("429") || status === 429 || msg.includes("quota exceeded") || msg.includes("too many requests")) {
      return { category: "RATE_LIMIT", isRetryable: true, reason: "Provider rate limit reached (429)" };
    }

    if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("econnreset") || status === 504) {
      return { category: "TIMEOUT", isRetryable: true, reason: "Request timed out" };
    }

    if (msg.includes("500") || msg.includes("502") || msg.includes("503") || status === 503 || msg.includes("bad gateway") || msg.includes("service unavailable")) {
      return { category: "PROVIDER_ERROR", isRetryable: true, reason: "AI provider service error" };
    }

    if (msg.includes("invalid json") || msg.includes("json parse") || msg.includes("syntaxerror: unexpected token")) {
      return { category: "INVALID_OUTPUT", isRetryable: true, reason: "Model returned malformed or unparseable output" };
    }

    if (msg.includes("contract violation") || msg.includes("forbidden technology")) {
      return { category: "CONTRACT_VIOLATION", isRetryable: false, reason: "Model output violated locked contract" };
    }

    return { category: "UNKNOWN", isRetryable: true, reason: msg.slice(0, 100) };
  }

  /**
   * Execute an LLM operation with adaptive retry and classification.
   */
  public static async executeWithRetry<T>(
    operation: (attempt: number, provider: string) => Promise<T>,
    primaryProvider: string = "primary",
    config: Partial<LLMRetryConfig> = {}
  ): Promise<{ result: T; attempts: LLMRetryAttempt[]; totalRetries: number }> {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const attempts: LLMRetryAttempt[] = [];
    let currentProvider = primaryProvider;

    for (let attempt = 1; attempt <= fullConfig.maxRetries; attempt++) {
      try {
        const result = await operation(attempt, currentProvider);
        return { result, attempts, totalRetries: attempt - 1 };
      } catch (err: any) {
        const classification = this.classifyError(err);
        const isLastAttempt = attempt === fullConfig.maxRetries;

        let delayMs = fullConfig.initialDelayMs * Math.pow(fullConfig.backoffMultiplier, attempt - 1);
        let fallbackTriggered = false;

        if (classification.category === "PROVIDER_ERROR" && fullConfig.fallbackProvider && currentProvider !== fullConfig.fallbackProvider) {
          console.warn(`[LLMRetry] 🔄 Provider error on "${currentProvider}". Switching to fallback provider "${fullConfig.fallbackProvider}"...`);
          currentProvider = fullConfig.fallbackProvider;
          fallbackTriggered = true;
          delayMs = 100; // fast retry on fallback
        }

        attempts.push({
          attemptNumber: attempt,
          category: classification.category,
          errorMessage: err.message || String(err),
          delayMs,
          providerUsed: currentProvider,
          fallbackTriggered,
        });

        if (isLastAttempt || !classification.isRetryable) {
          throw new Error(`LLM_EXECUTION_FAILED [${classification.category}]: ${classification.reason} (after ${attempt} attempts)`);
        }

        console.warn(`[LLMRetry] Attempt #${attempt} failed with ${classification.category}. Backing off for ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    throw new Error("LLM_EXECUTION_FAILED: Exhausted maximum retry attempts.");
  }
}
