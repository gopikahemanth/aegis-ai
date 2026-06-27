import type { AIProvider } from "./base.js";

export class ProviderRegistry {
  private readonly providers = new Map<string, AIProvider>();

  register(provider: AIProvider) {
    this.providers.set(provider.name, provider);
  }

  get(name: string): AIProvider {
    const provider = this.providers.get(name);

    if (!provider) {
      throw new Error(`Provider "${name}" is not registered.`);
    }

    return provider;
  }

  list(): string[] {
    return [...this.providers.keys()];
  }
}
