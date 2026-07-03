import { GroqProvider } from "./groq.js";
import { ProviderRegistry } from "./registry.js";
import { providerConfig } from "./config.js";

export class ProviderFactory {
  static createRegistry() {
    const registry = new ProviderRegistry();

    registry.register(new GroqProvider());

    return registry;
  }

  static createDefaultProvider() {
    const registry = this.createRegistry();

    return registry.get(providerConfig.defaultProvider);
  }
}
