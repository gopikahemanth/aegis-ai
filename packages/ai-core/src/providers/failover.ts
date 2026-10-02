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
      if (type === "planner" || type === "architect" || type === "healer" || type === "discovery") {
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

      // Groq role filtering: Groq is reserved exclusively for lightweight roles (discovery, classification, content strategy).
      // Heavy context roles (coder, reviewer, healer) are strictly excluded from Groq to eliminate failover latency and dead weight.
      if (provider.name === "groq") {
        const agentType = options?.agentType || "";
        const isHeavyRole = ["coder", "reviewer", "visual-reviewer", "repair-coordinator"].includes(agentType);
        if (isHeavyRole) {
          continue;
        }

        const totalPromptText = messages.map(m => m.content).join("\n");
        if (totalPromptText.length > 50000) { // ~13,000 tokens
          console.log(`[FailoverProvider] ⚡ Prompt context (${totalPromptText.length} chars) exceeds safe limit for "groq". Proactively skipping...`);
          continue;
        }
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

          const isPromptOverflow = error.message?.includes("GROQ_PROMPT_OVERFLOW_ERROR") ||
            error.message?.includes("prompt exceeds safe Groq limit");
          if (isPromptOverflow) {
            console.warn(`[FailoverProvider] ⚡ Prompt exceeds context limit on "${provider.name}". Failing over to large-context provider immediately without retry...`);
            FailoverProvider.disabledUntil.set(provider.name, Date.now() + 10000);
            FailoverProvider.healthStates.set(provider.name, "DEGRADED");
            break;
          }

          const isMaxTokens = error.message?.includes("MAX_TOKENS") || error.message?.includes("truncated (MAX_TOKENS)");
          if (isMaxTokens) {
            console.warn(`[FailoverProvider] ⚡ Provider "${provider.name}" hit MAX_TOKENS output limit. Failing over to next provider immediately...`);
            break;
          }

          const is401 = error.message?.includes("401") || error.message?.toLowerCase().includes("unauthorized") || error.message?.toLowerCase().includes("invalid api key");
          const is402 = error.message?.includes("402") || error.message?.toLowerCase().includes("payment required");
          const is404 = error.message?.includes("404") || error.message?.includes("NOT_FOUND") || error.message?.toLowerCase().includes("no longer available") || error.message?.toLowerCase().includes("does not exist");
          const is503 = error.message?.includes("503") || error.message?.toLowerCase().includes("high demand") || error.message?.includes("UNAVAILABLE") || error.message?.toLowerCase().includes("temporarily unavailable");
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

          const isOllamaOffline = provider.name === "ollama" && (
            error.message?.includes("Ollama is not running") ||
            error.message?.includes("ECONNREFUSED") ||
            error.message?.includes("fetch failed")
          );
          if (isOllamaOffline) {
            console.warn(`[FailoverProvider] Ollama is not running locally. Session disabling provider "ollama"...`);
            FailoverProvider.sessionDisabled.add(provider.name);
            FailoverProvider.healthStates.set(provider.name, "UNAVAILABLE");
            break;
          }

          if (is401) {
            console.warn(`[FailoverProvider] 401 Unauthorized on provider "${provider.name}". Permanently disabled.`);
            FailoverProvider.permanentlyDisabled.add(provider.name);
            FailoverProvider.healthStates.set(provider.name, "AUTH_FAILED");
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

          if (is503) {
            console.warn(`[FailoverProvider] 503 High Demand / Unavailable on provider "${provider.name}". Failing over to next provider/key...`);
            FailoverProvider.disabledUntil.set(provider.name, Date.now() + 15000);
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
            console.warn(`[FailoverProvider] ⚡ 429 Rate Limit on provider "${provider.name}". Setting temporary 15s cooldown...`);
            FailoverProvider.disabledUntil.set(provider.name, Date.now() + 15000);
            FailoverProvider.healthStates.set(provider.name, "DEGRADED");
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

    // Check if cooldown recovery is possible before giving up
    const currentTime = Date.now();
    const cooldownRetries = (options as any)?._cooldownRetries || 0;
    const availableSoon = Array.from(FailoverProvider.disabledUntil.entries())
      .filter(([name, expiry]) => !FailoverProvider.permanentlyDisabled.has(name) && !FailoverProvider.sessionDisabled.has(name) && expiry > currentTime)
      .map(([_, expiry]) => expiry);

    if (availableSoon.length > 0 && cooldownRetries < 3) {
      const earliest = Math.min(...availableSoon);
      const waitMs = Math.max(1000, Math.min(earliest - currentTime + 500, 20000));
      console.log(`[FailoverProvider] All active providers in temporary cooldown. Waiting ${Math.ceil(waitMs / 1000)}s for cooldown recovery (attempt ${cooldownRetries + 1}/3)...`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return this.chat(messages, { ...options, _cooldownRetries: cooldownRetries + 1 } as any);
    }

    throw new Error(
      `All providers failed. Last error: ${lastError?.message}`
    );
  }
}
