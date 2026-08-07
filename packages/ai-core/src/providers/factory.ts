import { GroqProvider } from "./groq.js";
import { ProviderRegistry } from "./registry.js";
import { GeminiProvider } from "./gemini.js";
import { OpenRouterProvider } from "./openrouter.js";
import { CerebrasProvider } from "./cerebras.js";
import { FailoverProvider } from "./failover.js";
import { OllamaProvider } from "./ollama.js";
import { env } from "../utils/env.js";
import type { AIProvider } from "./base.js";

export class ProviderFactory {
  static createRegistry() {
    const registry = new ProviderRegistry();

    registry.register(new GroqProvider());
    registry.register(new GeminiProvider());
    registry.register(new OpenRouterProvider());
    registry.register(new CerebrasProvider());
    registry.register(new OllamaProvider());

    return registry;
  }

  static createDefaultProvider(): AIProvider {
    const providers: AIProvider[] = [];
    const preferred = env.AI_PROVIDER;

    // Primary Gemini key 1 & key 2
    if (env.GEMINI_API_KEY) {
      providers.push(new GeminiProvider(env.GEMINI_API_KEY, "gemini"));
    }
    if (env.GEMINI_API_KEY_2) {
      providers.push(new GeminiProvider(env.GEMINI_API_KEY_2, "gemini-2"));
    }

    // OpenRouter fallback provider
    if (env.OPENROUTER_API_KEY) {
      providers.push(new OpenRouterProvider());
    }

    // Cerebras fallback provider
    if (env.CEREBRAS_API_KEY) {
      providers.push(new CerebrasProvider());
    }

    // Groq fallback provider
    if (env.GROQ_API_KEY) {
      providers.push(new GroqProvider());
    }

    // If a non-gemini provider is preferred, move it to the front
    if (preferred && preferred !== "gemini") {
      const idx = providers.findIndex(p => p.name === preferred);
      if (idx > 0) {
        const [prefComp] = providers.splice(idx, 1);
        providers.unshift(prefComp);
      }
    }

    // Always append local Ollama provider as final failsafe fallback
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
