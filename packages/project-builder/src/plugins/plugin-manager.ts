import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { FrameworkRouter } from "../frameworks/router.js";

export interface AegisPlugin {
  name: string;
  register(router: FrameworkRouter): void | Promise<void>;
}

export class PluginManager {
  constructor(private readonly workspaceRoot: string) {}

  async loadPlugins(router: FrameworkRouter): Promise<string[]> {
    const pluginsDir = join(this.workspaceRoot, ".aegis", "plugins");
    if (!existsSync(pluginsDir)) {
      return [];
    }

    const loadedPluginNames: string[] = [];
    const entries = readdirSync(pluginsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".mjs"))) {
        const fullPath = resolve(pluginsDir, entry.name);
        try {
          // Use pathToFileURL to format the absolute local path correctly for dynamic import in Node ESM
          const moduleUrl = pathToFileURL(fullPath).toString();
          const pluginModule = await import(moduleUrl);
          
          const plugin: AegisPlugin = pluginModule.default || pluginModule;
          if (plugin && typeof plugin.register === "function") {
            await plugin.register(router);
            loadedPluginNames.push(plugin.name || entry.name);
            console.log(`[PluginManager] ✓ Loaded plugin: ${plugin.name || entry.name}`);
          }
        } catch (err: any) {
          console.error(`[PluginManager] ✗ Failed to load plugin "${entry.name}":`, err.message);
        }
      }
    }

    return loadedPluginNames;
  }
}
