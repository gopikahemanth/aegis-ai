import { ProviderError } from "./provider-error.js";
import type { AIProvider, ChatMessage, ChatOptions } from "./base.js";
import { env } from "../utils/env.js";
import { Models } from "./models.js";
import { MetricsTracker } from "./metrics-tracker.js";

export class CerebrasProvider implements AIProvider {
  public readonly name = "cerebras";

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<string> {
    const apiKey = env.CEREBRAS_API_KEY;
    if (!apiKey) {
      throw new Error("CEREBRAS_API_KEY is not defined in env.");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

      const response = await fetch(
        "https://api.cerebras.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "User-Agent": "AegisAI/1.0",
          },
          body: JSON.stringify({
            model: options?.model ?? Models.cerebras?.default ?? "gpt-oss-120b",
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            temperature: options?.temperature ?? 0.2,
            max_completion_tokens: options?.maxTokens ?? 8192,
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        clearTimeout(timeoutId);
        const errorText = await response.text();
        throw new Error(
          `Cerebras HTTP Error ${response.status}: ${errorText}`
        );
      }

      const data = (await response.json()) as any;
      clearTimeout(timeoutId);

      if (data.usage) {
        const prompt = data.usage.prompt_tokens || 0;
        const completion = data.usage.completion_tokens || 0;
        MetricsTracker.getInstance().logUsage(prompt, completion);
      }

      const finishReason = data.choices?.[0]?.finish_reason;
      if (finishReason === "length" || finishReason === "MAX_TOKENS") {
        throw new ProviderError("Cerebras response was truncated (length) — output incomplete.", 2);
      }

      return data.choices?.[0]?.message?.content ?? "";
    } catch (error: any) {
      const msg = error?.message ?? "Cerebras request failed.";
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests");
      throw new ProviderError(
        msg,
        isRateLimit ? 5 : undefined,
        error
      );
    }
  }
}
