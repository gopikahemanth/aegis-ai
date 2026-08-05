import { GroqProvider } from "./groq.js";
import { ProviderRegistry } from "./registry.js";
import { providerConfig } from "./config.js";
import { GeminiProvider } from "./gemini.js";
import { FailoverProvider } from "./failover.js";
import { OllamaProvider } from "./ollama.js";
import { OpenRouterProvider } from "./openrouter.js";
import { CerebrasProvider } from "./cerebras.js";
import { env } from "../utils/env.js";
import type { AIProvider } from "./base.js";

export class ProviderFactory {
  static createRegistry() {
    const registry = new ProviderRegistry();

    if (env.CEREBRAS_API_KEY) registry.register(new CerebrasProvider());
    registry.register(new GroqProvider());
    registry.register(new GeminiProvider());
    registry.register(new OllamaProvider());
    registry.register(new OpenRouterProvider());

    return registry;
  }

  static createDefaultProvider(): AIProvider {
    const providers: AIProvider[] = [];
    const preferred = env.AI_PROVIDER;

    if (preferred === "cerebras" && env.CEREBRAS_API_KEY) {
      providers.push(new CerebrasProvider());
    } else if (preferred === "gemini" && env.GEMINI_API_KEY) {
      providers.push(new GeminiProvider());
    } else if (preferred === "groq" && env.GROQ_API_KEY) {
      providers.push(new GroqProvider());
    } else if (preferred === "openrouter" && env.OPENROUTER_API_KEY) {
      providers.push(new OpenRouterProvider());
    }

    if (preferred !== "cerebras" && env.CEREBRAS_API_KEY) {
      providers.push(new CerebrasProvider());
    }
    if (preferred !== "gemini" && env.GEMINI_API_KEY) {
      providers.push(new GeminiProvider());
    }
    if (preferred !== "groq" && env.GROQ_API_KEY) {
      providers.push(new GroqProvider());
    }
    if (preferred !== "openrouter" && env.OPENROUTER_API_KEY) {
      providers.push(new OpenRouterProvider());
    }

    // Always append local Ollama provider as the final failsafe fallback
    providers.push(new OllamaProvider());

    if (providers.length === 0) {
      throw new Error("No AI providers configured in env.");
    }

    console.log(
      `Initializing FailoverProvider with active chain: ${providers.map(p => p.name).join(" -> ")}`
    );

    return new FailoverProvider(providers);
  }
}
