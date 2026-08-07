import { ProviderError } from "./provider-error.js";
import type { AIProvider, ChatMessage, ChatOptions } from "./base.js";
import { env } from "../utils/env.js";
import { MetricsTracker } from "./metrics-tracker.js";

export class GitHubProvider implements AIProvider {
  public readonly name = "github";

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<string> {
    const apiKey = process.env.GITHUB_TOKEN || process.env.GITHUB_API_KEY || env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("GITHUB_TOKEN or GITHUB_API_KEY is not defined in env.");
    }

    const modelName = options?.model || "gpt-4o-mini";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

      const response = await fetch(
        "https://models.inference.ai.azure.com/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "User-Agent": "AegisAI/1.0",
          },
          body: JSON.stringify({
            model: modelName,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            temperature: options?.temperature ?? 0.2,
            max_tokens: options?.maxTokens ?? 8192,
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        clearTimeout(timeoutId);
        const errorText = await response.text();
        throw new Error(
          `GitHub Models HTTP Error ${response.status}: ${errorText}`
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
      const msg = String(error?.message ?? error ?? "GitHub Models request failed.");
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota");
      throw new ProviderError(
        msg,
        isRateLimit ? 15 : undefined,
        error,
      );
    }
  }
}
