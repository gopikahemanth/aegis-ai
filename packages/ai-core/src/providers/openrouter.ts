import { ProviderError } from "./provider-error.js";
import type { AIProvider, ChatMessage, ChatOptions } from "./base.js";
import { env } from "../utils/env.js";
import { MetricsTracker } from "./metrics-tracker.js";

export class OpenRouterProvider implements AIProvider {
  public readonly name = "openrouter";

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<string> {
    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not defined in env.");
    }

    const modelName = env.OPENROUTER_MODEL || "deepseek/deepseek-chat";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://aegis.ai",
            "X-Title": "Aegis AI",
          },
          body: JSON.stringify({
            model: options?.model ?? modelName,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            temperature: options?.temperature ?? 0.2,
            max_tokens: options?.maxTokens ?? 1024,
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        clearTimeout(timeoutId);
        const errorText = await response.text();
        throw new Error(
          `OpenRouter HTTP Error ${response.status}: ${errorText}`
        );
      }

      const data = (await response.json()) as any;
      clearTimeout(timeoutId);

      if (data.usage) {
        const prompt = data.usage.prompt_tokens || 0;
        const completion = data.usage.completion_tokens || 0;
        MetricsTracker.getInstance().logUsage(prompt, completion);
      }

      return data.choices?.[0]?.message?.content ?? "";
    } catch (error: any) {
      throw new ProviderError(
        error?.message ?? "OpenRouter request failed.",
        undefined,
        error
      );
    }
  }
}
