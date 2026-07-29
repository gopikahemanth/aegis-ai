import { ProviderError } from "./provider-error.js";
import { Models } from "./models.js";
import type { AIProvider, ChatMessage, ChatOptions } from "./base.js";

export class FailoverProvider implements AIProvider {
  public readonly name = "failover";

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

    for (const provider of this.providers) {
      let attempts = 0;
      let delay = this.initialDelayMs;

      while (attempts < this.maxRetries) {
        try {
          let activeOptions = options;
          if (options?.model) {
            const requestedModel = options.model;
            let isCompatible = false;
            const providerName = provider.name as keyof typeof Models;

            if (providerName in Models && Models[providerName].default === requestedModel) {
              isCompatible = true;
            } else {
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
                ...options,
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
            const waitTime = error.retryAfter * 1000;
            console.log(
              `[FailoverProvider] Respecting retry-after. Waiting ${error.retryAfter}s...`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
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
        `[FailoverProvider] Provider ${provider.name} exhausted all attempts. Falling back.`
      );
    }

    throw new Error(
      `All providers failed. Last error: ${lastError?.message}`
    );
  }
}
