import { ProviderError } from "./provider-error.js";
import { Models } from "./models.js";
import type { AIProvider, ChatMessage, ChatOptions } from "./base.js";

export class FailoverProvider implements AIProvider {
  public readonly name = "failover";
  private readonly disabledUntil = new Map<string, number>();

  constructor(
    private readonly providers: AIProvider[],
    private readonly maxRetries = 3,
    private readonly initialDelayMs = 1000,
  ) {
    if (providers.length === 0) {
      throw new Error("FailoverProvider requires at least one provider.");
    }
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<string> {
    let lastError: Error | null = null;

    let targetedClassification: "strong" | "balanced" | "fast" | "default" = "default";
    if (options?.agentType) {
      const type = options.agentType;
      const complexity = options.complexity ?? 0;
      if (type === "planner" || type === "architect" || type === "healer") {
        targetedClassification = "strong";
      } else if (type === "reviewer") {
        targetedClassification = "balanced";
      } else if (type === "coder") {
        if (complexity >= 7) {
          targetedClassification = "strong";
        } else if (complexity >= 4) {
          targetedClassification = "balanced";
        } else {
          targetedClassification = "fast";
        }
      }
    }

    const now = Date.now();
    for (const [pName, expiry] of this.disabledUntil.entries()) {
      if (now >= expiry) {
        this.disabledUntil.delete(pName);
      }
    }

    if (this.disabledUntil.size >= this.providers.length) {
      console.log("[FailoverProvider] All providers were disabled — resetting disabled provider timeouts.");
      this.disabledUntil.clear();
    }

    for (const provider of this.providers) {
      const until = this.disabledUntil.get(provider.name);
      if (until && Date.now() < until) {
        continue;
      }      let providerAttempts = 0;
      let quotaAttempts = 0;
      const maxQuotaAttempts = 12;
      let delay = this.initialDelayMs;

      while (providerAttempts < this.maxRetries) {
        try {
          providerAttempts++;
          let activeOptions = options;
          const providerName = provider.name as keyof typeof Models;

          if (!options?.model && providerName in Models) {
            const resolvedModel = Models[providerName][targetedClassification] || Models[providerName].default;
            console.log(
              `[FailoverProvider] Proactively routed agent "${options?.agentType || "default"}" (complexity: ${options?.complexity ?? "N/A"}) to model "${resolvedModel}" on provider "${provider.name}"`
            );
            activeOptions = {
              ...options,
              model: resolvedModel
            };
          }

          if (activeOptions?.model) {
            const requestedModel = activeOptions.model;
            let isCompatible = false;

            if (providerName in Models) {
              const pConfig = Models[providerName];
              if (
                pConfig.default === requestedModel ||
                pConfig.strong === requestedModel ||
                pConfig.balanced === requestedModel ||
                pConfig.fast === requestedModel
              ) {
                isCompatible = true;
              }
            }

            if (!isCompatible) {
              if (provider.name === "gemini" && requestedModel.toLowerCase().includes("gemini")) {
                isCompatible = true;
              } else if (provider.name === "groq" && (requestedModel.toLowerCase().includes("llama") || requestedModel.toLowerCase().includes("mixtral"))) {
                isCompatible = true;
              } else if (provider.name === "openai" && requestedModel.toLowerCase().includes("gpt")) {
                isCompatible = true;
              } else if (provider.name === "ollama" && requestedModel.toLowerCase().includes("llama")) {
                isCompatible = true;
              } else if (provider.name === "openrouter" && (requestedModel.toLowerCase().includes("deepseek") || requestedModel.includes("/"))) {
                isCompatible = true;
              }
            }

            if (!isCompatible && providerName in Models) {
              console.log(
                `[FailoverProvider] Overriding model "${requestedModel}" to default "${Models[providerName].default}" for provider "${provider.name}"`
              );
              activeOptions = {
                ...activeOptions,
                model: Models[providerName].default
              };
            }
          }

          console.log(
            `[FailoverProvider] Attempting chat with provider: ${provider.name} (attempt ${providerAttempts}/${this.maxRetries})`
          );
          return await provider.chat(messages, activeOptions);
        } catch (error: any) {
          lastError = error;
          console.warn(
            `[FailoverProvider] Provider ${provider.name} failed:`,
            error.message
          );

          let retryAfter = error instanceof ProviderError ? error.retryAfter : undefined;
          if (retryAfter === undefined && error.message) {
            const match = error.message.match(/retry in ([0-9.]+)\s*s/i);
            if (match) {
              retryAfter = Math.ceil(parseFloat(match[1]));
            }
          }
          if (retryAfter === undefined && error.details) {
            try {
              const detailsStr = JSON.stringify(error.details);
              const match = detailsStr.match(/(\d+(\.\d+)?)s/);
              if (match) retryAfter = Math.ceil(parseFloat(match[1]));
            } catch {}
          }

          const isGemini = provider.name === "gemini";
          const is503 = error.message?.includes("503") || error.message?.includes("UNAVAILABLE") || error.message?.includes("high demand");
          const is429 = error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED");

          if (isGemini && is429 && quotaAttempts < maxQuotaAttempts) {
            quotaAttempts++;
            providerAttempts--; // Quota wait is not a failed provider attempt
            const waitSec = (retryAfter !== undefined && retryAfter > 0) ? (retryAfter + 1) : 6;
            const waitMs = waitSec * 1000;
            console.log(
              `[FailoverProvider] 429 Rate Limit / Quota detected on ${provider.name}. Waiting ${waitSec}s for quota refill (quota retry ${quotaAttempts}/${maxQuotaAttempts})...`
            );
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue;
          }

          if (isGemini && is503 && quotaAttempts < maxQuotaAttempts) {
            quotaAttempts++;
            providerAttempts--; // 503 high demand retry
            const waitTime = Math.min(quotaAttempts * 3000, 10000);
            console.log(
              `[FailoverProvider] 503 High Demand detected on ${provider.name}. Waiting ${waitTime / 1000}s (high-demand retry ${quotaAttempts}/${maxQuotaAttempts})...`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }

          if (providerAttempts < this.maxRetries) {
            const nextDelay = Math.min(delay, 5000);
            console.log(
              `[FailoverProvider] Backing off for ${nextDelay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, nextDelay));
            delay = Math.min(delay * 2, 5000);
          }
        }
      }

      console.warn(
        `[FailoverProvider] Provider ${provider.name} exhausted all attempts. Disabling provider for 15s, falling back.`
      );
      this.disabledUntil.set(provider.name, Date.now() + 15000);
    }

    throw new Error(
      `All providers failed. Last error: ${lastError?.message}`
    );
  }
}
