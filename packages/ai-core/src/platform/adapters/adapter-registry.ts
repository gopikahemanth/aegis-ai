/**
 * Adapter Registry
 *
 * Manages technology generation adapters and dispatches the optimal adapter
 * for any resolved architecture contract.
 */

import { TechnologyGenerationAdapter, FrameworkFamily } from "./technology-adapter.interface.js";
import { ReactViteAdapter } from "./react-adapter.js";
import { VueAdapter } from "./vue-adapter.js";
import { SvelteAdapter } from "./svelte-adapter.js";
import { NextJsAdapter } from "./nextjs-adapter.js";
import { VanillaHtmlAdapter } from "./vanilla-html-adapter.js";
import { AngularAdapter } from "./angular-adapter.js";
import { FastApiAdapter } from "./fastapi-adapter.js";
import { NodeExpressAdapter } from "./node-express-adapter.js";
import { ResolvedTechnologyArchitectureContract } from "../stack-selection-intelligence.js";

export class TechnologyAdapterRegistry {
  private static instance: TechnologyAdapterRegistry;
  private adapters: Map<string, TechnologyGenerationAdapter> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): TechnologyAdapterRegistry {
    if (!TechnologyAdapterRegistry.instance) {
      TechnologyAdapterRegistry.instance = new TechnologyAdapterRegistry();
    }
    return TechnologyAdapterRegistry.instance;
  }

  private registerDefaults(): void {
    this.register(new ReactViteAdapter());
    this.register(new VueAdapter());
    this.register(new SvelteAdapter());
    this.register(new NextJsAdapter());
    this.register(new VanillaHtmlAdapter());
    this.register(new AngularAdapter());
    this.register(new FastApiAdapter());
    this.register(new NodeExpressAdapter());
  }

  public register(adapter: TechnologyGenerationAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  public getAdapter(id: string): TechnologyGenerationAdapter | undefined {
    return this.adapters.get(id);
  }

  public getAll(): TechnologyGenerationAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Resolves the most suitable adapter for the given architecture contract.
   * Falls back to ReactViteAdapter if no specialized adapter is matched.
   */
  public resolveAdapter(architecture: ResolvedTechnologyArchitectureContract): TechnologyGenerationAdapter {
    for (const adapter of this.adapters.values()) {
      if (adapter.canHandle(architecture)) {
        return adapter;
      }
    }
    // Fallback default
    return this.adapters.get("react-vite-adapter") || Array.from(this.adapters.values())[0];
  }
}

export const adapterRegistry = TechnologyAdapterRegistry.getInstance();
