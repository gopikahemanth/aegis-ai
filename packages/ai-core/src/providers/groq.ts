
import Groq from "groq-sdk";
import { env } from "../utils/env.js";
import { ProviderError } from "./provider-error.js";
import { Models } from "./models.js";
import { MetricsTracker } from "./metrics-tracker.js";

import type {
  AIProvider,
  ChatMessage,
  ChatOptions,
} from "./base.js";

export class GroqProvider implements AIProvider {
  public readonly name = "groq";

  private readonly client: Groq;

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
  try {
    const response =
      await this.client.chat.completions.create({
        model:
          options?.model ??
          Models.groq.default,
        temperature:
          options?.temperature ?? 0.2,
        max_completion_tokens:
          options?.maxTokens ?? 4096,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content.length > 12000 ? m.content.slice(0, 12000) + "\n\n...[Truncated]..." : m.content,
        })),
      });

    if (response.usage) {
      const prompt = response.usage.prompt_tokens || 0;
      const completion = response.usage.completion_tokens || 0;
      MetricsTracker.getInstance().logUsage(prompt, completion);
    }

    return (
      response.choices[0]?.message?.content ?? ""
    );

  } catch (error: any) {
    const msg: string = error?.error?.error?.message ?? error?.message ?? "Provider request failed.";

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
