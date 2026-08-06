import { ProviderError } from "./provider-error.js";
import { Models } from "./models.js";
import type { AIProvider, ChatMessage, ChatOptions } from "./base.js";

export class FailoverProvider implements AIProvider {
  public readonly name = "failover";
  private readonly disabledUntil = new Map<string, number>();
  private readonly permanentlyDisabled = new Set<string>(); // 402 payment required

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

    // Count available (non-permanent, non-temporarily-disabled) providers
    const available = this.providers.filter(p =>
      !this.permanentlyDisabled.has(p.name) &&
      !(this.disabledUntil.has(p.name) && Date.now() < (this.disabledUntil.get(p.name) ?? 0))
    );

    if (available.length === 0) {
      // Find soonest expiry among temporary disables (excluding permanent)
      const tempDisables = [...this.disabledUntil.entries()]
        .filter(([name]) => !this.permanentlyDisabled.has(name));
      if (tempDisables.length > 0) {
        const soonest = Math.min(...tempDisables.map(([, exp]) => exp));
        const waitMs = Math.max(soonest - Date.now(), 0);
        if (waitMs > 0) {
          console.log(`[FailoverProvider] All providers temporarily rate-limited. Waiting ${Math.round(waitMs / 1000)}s for soonest provider to recover...`);
          await new Promise(resolve => setTimeout(resolve, waitMs + 500));
        }
        // Clear expired disables
        for (const [pName, expiry] of this.disabledUntil.entries()) {
          if (Date.now() >= expiry) this.disabledUntil.delete(pName);
        }
      } else {
        console.log("[FailoverProvider] All providers permanently disabled — resetting temporary disables.");
        this.disabledUntil.clear();
      }
    }

    for (const provider of this.providers) {
      const until = this.disabledUntil.get(provider.name);
      if (until && Date.now() < until) {
        continue;
      }
      let providerAttempts = 0;
      let quotaAttempts = 0;
      const maxQuotaAttempts = 30;
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
              const match = detailsStr.match(/"retryDelay":\s*"(\d+)s?"/i) || detailsStr.match(/retry\s*in\s*(\d+)s?/i);
              if (match) retryAfter = parseInt(match[1], 10);
            } catch {}
          }

          const is402 = error.message?.includes("402") || error.message?.toLowerCase().includes("payment required");
          const isFetchFailed = error.message?.includes("fetch failed") || error.message?.includes("ECONNREFUSED");
          const is429 = error.message?.includes("429") || error.message?.includes("quota") ||
            error.message?.includes("RESOURCE_EXHAUSTED") || error.message?.toLowerCase().includes("rate limit");

          if (is402) {
            console.warn(`[FailoverProvider] 402 Payment Required on provider "${provider.name}". Permanently disabling for this session.`);
            this.permanentlyDisabled.add(provider.name);
            this.disabledUntil.set(provider.name, Date.now() + 86400000); // 24h
            break;
          }

          if (isFetchFailed) {
            console.warn(`[FailoverProvider] Connection failed on provider "${provider.name}". Disabling for 10 minutes.`);
            this.disabledUntil.set(provider.name, Date.now() + 600000);
            break;
          }

          if (is429) {
            if (retryAfter !== undefined && retryAfter <= 60 && quotaAttempts < maxQuotaAttempts) {
              quotaAttempts++;
              providerAttempts--;
              const sleepSec = Math.max(Math.min(retryAfter, 60), 1);
              console.log(`[FailoverProvider] 429 Rate Limit on provider "${provider.name}". Cooldown ${quotaAttempts}/${maxQuotaAttempts}: Sleeping for ${sleepSec}s as requested by provider...`);
              await new Promise((resolve) => setTimeout(resolve, sleepSec * 1000));
              continue;
            }
            const disableSec = Math.max(retryAfter ?? 15, 15);
            this.disabledUntil.set(provider.name, Date.now() + disableSec * 1000);
            console.warn(
              `[FailoverProvider] 429 Rate Limit on provider "${provider.name}". Disabling for ${disableSec}s and failing over immediately.`
            );
            break;
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
