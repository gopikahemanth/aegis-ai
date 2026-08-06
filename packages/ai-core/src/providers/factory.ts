import { GroqProvider } from "./groq.js";
import { ProviderRegistry } from "./registry.js";
import { GeminiProvider } from "./gemini.js";
import { FailoverProvider } from "./failover.js";
import { OllamaProvider } from "./ollama.js";
import { env } from "../utils/env.js";
import type { AIProvider } from "./base.js";

export class ProviderFactory {
  static createRegistry() {
    const registry = new ProviderRegistry();

    registry.register(new GroqProvider());
    registry.register(new GeminiProvider());
    registry.register(new OllamaProvider());

    return registry;
  }

  static createDefaultProvider(): AIProvider {
    const providers: AIProvider[] = [];
    const preferred = env.AI_PROVIDER;

    if (preferred === "gemini" && env.GEMINI_API_KEY) {
      providers.push(new GeminiProvider(env.GEMINI_API_KEY, "gemini"));
      if (env.GEMINI_API_KEY_2) {
        providers.push(new GeminiProvider(env.GEMINI_API_KEY_2, "gemini-2"));
      }
    } else if (preferred === "groq" && env.GROQ_API_KEY) {
      providers.push(new GroqProvider());
    }

    if (preferred !== "gemini" && env.GEMINI_API_KEY) {
      providers.push(new GeminiProvider(env.GEMINI_API_KEY, "gemini"));
      if (env.GEMINI_API_KEY_2) {
        providers.push(new GeminiProvider(env.GEMINI_API_KEY_2, "gemini-2"));
      }
    }
    if (preferred !== "groq" && env.GROQ_API_KEY) {
      providers.push(new GroqProvider());
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
