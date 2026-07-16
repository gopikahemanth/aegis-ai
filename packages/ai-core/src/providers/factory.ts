import { GroqProvider } from "./groq.js";
import { ProviderRegistry } from "./registry.js";
import { providerConfig } from "./config.js";
import { GeminiProvider } from "./gemini.js";
export class ProviderFactory {
  static createRegistry() {
    const registry = new ProviderRegistry();

    registry.register(new GroqProvider());
    registry.register(new GeminiProvider());

    return registry;
  }

  static createDefaultProvider() {
    const registry = this.createRegistry();

    console.log(
      "Selected provider:",
      providerConfig.defaultProvider,
    );

    return registry.get(
      providerConfig.defaultProvider,
    );
  }
}
