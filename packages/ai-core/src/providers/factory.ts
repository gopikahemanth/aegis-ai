import { GroqProvider } from "./groq.js";
import { ProviderRegistry } from "./registry.js";
import { GeminiProvider } from "./gemini.js";
import { OpenRouterProvider } from "./openrouter.js";
import { CerebrasProvider } from "./cerebras.js";
import { GitHubProvider } from "./github.js";
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
    registry.register(new GitHubProvider());
    registry.register(new OllamaProvider());

    return registry;
  }

  static createDefaultProvider(): AIProvider {
    const providers: AIProvider[] = [];
    const preferred = env.AI_PROVIDER;

    // GitHub Models provider
    if (process.env.GITHUB_TOKEN || process.env.GITHUB_API_KEY || env.OPENAI_API_KEY) {
      providers.push(new GitHubProvider());
    }

    // Dynamic Gemini keys (GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3, etc.)
    const envRecord = env as Record<string, string | undefined>;
    if (env.GEMINI_API_KEY) {
      providers.push(new GeminiProvider(env.GEMINI_API_KEY, "gemini"));
    }
    for (let i = 2; i <= 10; i++) {
      const k = envRecord[`GEMINI_API_KEY_${i}`] || process.env[`GEMINI_API_KEY_${i}`];
      if (k) {
        providers.push(new GeminiProvider(k, `gemini-${i}`));
      }
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
