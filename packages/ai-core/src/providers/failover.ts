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
      }

      let attempts = 0;
      let delay = this.initialDelayMs;

      while (true) {
        try {
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
            `[FailoverProvider] Attempting chat with provider: ${provider.name} (attempt ${attempts + 1}/${this.maxRetries})`
          );
          return await provider.chat(messages, activeOptions);
        } catch (error: any) {
          attempts++;
          lastError = error;
          console.warn(
            `[FailoverProvider] Provider ${provider.name} failed:`,
            error.message
          );

          const is503 = error.message?.includes("503") || error.message?.includes("UNAVAILABLE") || error.message?.includes("high demand");
          const maxAllowed = is503 ? 5 : ((error instanceof ProviderError && error.retryAfter !== undefined) ? 6 : this.maxRetries);

          if (is503 && attempts < maxAllowed) {
            const waitTime = attempts * 3000;
            console.log(
              `[FailoverProvider] 503 High Demand detected on ${provider.name}. Waiting ${waitTime / 1000}s (attempt ${attempts}/${maxAllowed})...`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }

          if (error instanceof ProviderError && error.retryAfter !== undefined) {
            if (error.retryAfter <= 35 && attempts < maxAllowed) {
              const waitTime = error.retryAfter * 1000;
              console.log(
                `[FailoverProvider] Respecting Gemini TPM quota retry-after. Waiting ${error.retryAfter}s (attempt ${attempts}/${maxAllowed})...`
              );
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              continue;
            } else if (error.retryAfter > 35) {
              console.log(
                `[FailoverProvider] Retry-after duration too long (${error.retryAfter}s). Bypassing retry to fallback immediately.`
              );
              break;
            }
          }

          if (attempts < maxAllowed) {
            console.log(
              `[FailoverProvider] Backing off for ${delay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // exponential backoff
          } else {
            break;
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
