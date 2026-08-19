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
  private static readonly disabledUntil = new Map<string, number>();
  private static readonly permanentlyDisabled = new Set<string>();
  private static readonly sessionDisabled = new Set<string>();
  private static readonly healthStates = new Map<string, ProviderHealthState>();

  constructor(
    private readonly providers: AIProvider[],
    private readonly maxRetries = 3,
    private readonly initialDelayMs = 1000,
  ) {
    if (providers.length === 0) {
      throw new Error("FailoverProvider requires at least one provider.");
    }
    for (const p of providers) {
      if (!FailoverProvider.healthStates.has(p.name)) {
        FailoverProvider.healthStates.set(p.name, "HEALTHY");
      }
    }
  }

  public getHealthState(providerName: string): ProviderHealthState {
    if (FailoverProvider.permanentlyDisabled.has(providerName) || FailoverProvider.sessionDisabled.has(providerName)) {
      return "QUOTA_EXHAUSTED";
    }
    const expiry = FailoverProvider.disabledUntil.get(providerName);
    if (expiry && Date.now() < expiry) {
      return "COOLDOWN";
    }
    return FailoverProvider.healthStates.get(providerName) || "HEALTHY";
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
    for (const [pName, expiry] of FailoverProvider.disabledUntil.entries()) {
      if (now >= expiry) {
        FailoverProvider.disabledUntil.delete(pName);
        if (!FailoverProvider.sessionDisabled.has(pName) && !FailoverProvider.permanentlyDisabled.has(pName)) {
          FailoverProvider.healthStates.set(pName, "HEALTHY");
        }
      }
    }

    for (const provider of this.providers) {
      if (FailoverProvider.sessionDisabled.has(provider.name) || FailoverProvider.permanentlyDisabled.has(provider.name)) {
        continue;
      }
      const until = FailoverProvider.disabledUntil.get(provider.name);
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
          FailoverProvider.healthStates.set(provider.name, "HEALTHY");
          return result;
        } catch (error: any) {
          lastError = error;
          console.warn(
            `[FailoverProvider] Provider ${provider.name} failed:`,
            error.message
          );

          const is402 = error.message?.includes("402") || error.message?.toLowerCase().includes("payment required");
          const is404 = error.message?.includes("404") || error.message?.includes("NOT_FOUND") || error.message?.toLowerCase().includes("no longer available");
          const isFetchFailed = error.message?.includes("fetch failed") || error.message?.includes("ECONNREFUSED");
          const is429 = error.message?.includes("429") || error.message?.includes("quota") ||
            error.message?.includes("RESOURCE_EXHAUSTED") || error.message?.toLowerCase().includes("rate limit");
          const isUnsupportedModality = options?.image && (
            error.message?.toLowerCase().includes("modality") ||
            error.message?.toLowerCase().includes("image") ||
            error.message?.toLowerCase().includes("vision") ||
            error.message?.toLowerCase().includes("multimodal") ||
            error.message?.toLowerCase().includes("does not support")
          );

          if (isUnsupportedModality) {
            console.warn(`[FailoverProvider] ⚡ Provider "${provider.name}" does not support vision modality for this request. Failing over to vision-capable provider immediately...`);
            FailoverProvider.disabledUntil.set(provider.name, Date.now() + 10000);
            FailoverProvider.healthStates.set(provider.name, "DEGRADED");
            break;
          }

          if (is402) {
            console.warn(`[FailoverProvider] 402 Payment Required on provider "${provider.name}". Session disabled.`);
            FailoverProvider.permanentlyDisabled.add(provider.name);
            FailoverProvider.healthStates.set(provider.name, "AUTH_FAILED");
            break;
          }

          if (is404) {
            console.warn(`[FailoverProvider] 404 Model Not Found on provider "${provider.name}". Session disabling provider for current generation...`);
            FailoverProvider.sessionDisabled.add(provider.name);
            FailoverProvider.healthStates.set(provider.name, "UNAVAILABLE");
            break;
          }

          if (isFetchFailed) {
            console.warn(`[FailoverProvider] Connection failed on provider "${provider.name}". Pausing for 15s before retry...`);
            FailoverProvider.disabledUntil.set(provider.name, Date.now() + 15000);
            FailoverProvider.healthStates.set(provider.name, "DEGRADED");
            if (providerAttempts < this.maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              continue;
            }
            break;
          }

          if (is429) {
            console.warn(`[FailoverProvider] ⚡ 429 Quota Exhausted on provider "${provider.name}". Marking QUOTA_EXHAUSTED for current generation session and failing over immediately...`);
            FailoverProvider.sessionDisabled.add(provider.name);
            FailoverProvider.healthStates.set(provider.name, "QUOTA_EXHAUSTED");
            break;
          }

          if (providerAttempts < this.maxRetries) {
            const nextDelay = Math.min(delay, 5000);
            await new Promise((resolve) => setTimeout(resolve, nextDelay));
            delay = Math.min(delay * 2, 5000);
          }
        }
      }

      FailoverProvider.disabledUntil.set(provider.name, Date.now() + 10000);
      FailoverProvider.healthStates.set(provider.name, "DEGRADED");
    }

    throw new Error(
      `All providers failed. Last error: ${lastError?.message}`
    );
  }
}
