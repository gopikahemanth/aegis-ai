import { ProviderError } from "./provider-error.js";
import { Models } from "./models.js";
import type { AIProvider, ChatMessage, ChatOptions } from "./base.js";

export class FailoverProvider implements AIProvider {
  public readonly name = "failover";
  private readonly disabledProviders = new Set<string>();

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

    for (const provider of this.providers) {
      if (this.disabledProviders.has(provider.name)) {
        continue;
      }

      let attempts = 0;
      let delay = this.initialDelayMs;

      while (attempts < this.maxRetries) {
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

          if (error instanceof ProviderError && error.retryAfter !== undefined) {
            if (error.retryAfter <= 15) {
              const waitTime = error.retryAfter * 1000;
              console.log(
                `[FailoverProvider] Respecting retry-after. Waiting ${error.retryAfter}s...`
              );
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              continue;
            } else {
              console.log(
                `[FailoverProvider] Retry-after duration too long (${error.retryAfter}s). Bypassing retry to fallback immediately.`
              );
              break;
            }
          }

          if (attempts < this.maxRetries) {
            console.log(
              `[FailoverProvider] Backing off for ${delay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // exponential backoff
          }
        }
      }

      console.warn(
        `[FailoverProvider] Provider ${provider.name} exhausted all attempts. Disabling provider for this lifecycle, falling back.`
      );
      this.disabledProviders.add(provider.name);
    }

    throw new Error(
      `All providers failed. Last error: ${lastError?.message}`
    );
  }
}
