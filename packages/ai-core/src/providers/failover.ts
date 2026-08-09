import { ProviderError } from "./provider-error.js";
import { Models } from "./models.js";
import type { AIProvider, ChatMessage, ChatOptions } from "./base.js";

export type ProviderHealthState =
  | "HEALTHY"
  | "DEGRADED"
  | "RATE_LIMITED"
  | "QUOTA_EXHAUSTED"
  | "AUTH_FAILED"
  | "UNAVAILABLE"
  | "COOLDOWN";

export class FailoverProvider implements AIProvider {
  public readonly name = "failover";
  private readonly disabledUntil = new Map<string, number>();
  private readonly permanentlyDisabled = new Set<string>();
  private readonly sessionDisabled = new Set<string>();
  private readonly healthStates = new Map<string, ProviderHealthState>();

  constructor(
    private readonly providers: AIProvider[],
    private readonly maxRetries = 3,
    private readonly initialDelayMs = 1000,
  ) {
    if (providers.length === 0) {
      throw new Error("FailoverProvider requires at least one provider.");
    }
    for (const p of providers) {
      this.healthStates.set(p.name, "HEALTHY");
    }
  }

  public getHealthState(providerName: string): ProviderHealthState {
    if (this.permanentlyDisabled.has(providerName) || this.sessionDisabled.has(providerName)) {
      return "QUOTA_EXHAUSTED";
    }
    const expiry = this.disabledUntil.get(providerName);
    if (expiry && Date.now() < expiry) {
      return "COOLDOWN";
    }
    return this.healthStates.get(providerName) || "HEALTHY";
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
        if (!this.sessionDisabled.has(pName) && !this.permanentlyDisabled.has(pName)) {
          this.healthStates.set(pName, "HEALTHY");
        }
      }
    }

    for (const provider of this.providers) {
      if (this.sessionDisabled.has(provider.name) || this.permanentlyDisabled.has(provider.name)) {
        continue;
      }
      const until = this.disabledUntil.get(provider.name);
      if (until && Date.now() < until) {
        continue;
      }
      let providerAttempts = 0;
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

          console.log(
            `[FailoverProvider] Attempting chat with provider: ${provider.name} (attempt ${providerAttempts}/${this.maxRetries})`
          );
          const result = await provider.chat(messages, activeOptions);
          this.healthStates.set(provider.name, "HEALTHY");
          return result;
        } catch (error: any) {
          lastError = error;
          console.warn(
            `[FailoverProvider] Provider ${provider.name} failed:`,
            error.message
          );

          const is402 = error.message?.includes("402") || error.message?.toLowerCase().includes("payment required");
          const isFetchFailed = error.message?.includes("fetch failed") || error.message?.includes("ECONNREFUSED");
          const is429 = error.message?.includes("429") || error.message?.includes("quota") ||
            error.message?.includes("RESOURCE_EXHAUSTED") || error.message?.toLowerCase().includes("rate limit");

          if (is402) {
            console.warn(`[FailoverProvider] 402 Payment Required on provider "${provider.name}". Session disabled.`);
            this.permanentlyDisabled.add(provider.name);
            this.healthStates.set(provider.name, "AUTH_FAILED");
            break;
          }

          if (isFetchFailed) {
            console.warn(`[FailoverProvider] Connection failed on provider "${provider.name}". Disabling for 10 minutes.`);
            this.disabledUntil.set(provider.name, Date.now() + 600000);
            this.healthStates.set(provider.name, "UNAVAILABLE");
            break;
          }

          if (is429) {
            console.warn(`[FailoverProvider] ⚡ 429 Quota Exhausted on provider "${provider.name}". Marking QUOTA_EXHAUSTED for current generation session and failing over immediately...`);
            this.sessionDisabled.add(provider.name);
            this.healthStates.set(provider.name, "QUOTA_EXHAUSTED");
            break;
          }

          if (providerAttempts < this.maxRetries) {
            const nextDelay = Math.min(delay, 5000);
            await new Promise((resolve) => setTimeout(resolve, nextDelay));
            delay = Math.min(delay * 2, 5000);
          }
        }
      }

      this.disabledUntil.set(provider.name, Date.now() + 15000);
      this.healthStates.set(provider.name, "DEGRADED");
    }

    throw new Error(
      `All providers failed. Last error: ${lastError?.message}`
    );
  }
}
