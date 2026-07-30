import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { FrameworkRouter } from "../frameworks/router.js";

export interface AegisPlugin {
  name: string;
  register?(router: FrameworkRouter): void | Promise<void>;
  format?(filePath: string, content: string): string | Promise<string>;
  heal?(filePath: string, error: string, content: string): string | Promise<string>;
  deploy?(outputDir: string): void | Promise<void>;
}

export class PluginManager {
  private readonly registeredPlugins: AegisPlugin[] = [];

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
          const moduleUrl = pathToFileURL(fullPath).toString();
          const pluginModule = await import(moduleUrl);
          
          const plugin: AegisPlugin = pluginModule.default || pluginModule;
          if (plugin) {
            if (typeof plugin.register === "function") {
              await plugin.register(router);
            }
            this.registeredPlugins.push(plugin);
            loadedPluginNames.push(plugin.name || entry.name);
            console.log(`[PluginManager] ✓ Loaded extension: ${plugin.name || entry.name}`);
          }
        } catch (err: any) {
          console.error(`[PluginManager] ✗ Failed to load extension "${entry.name}":`, err.message);
        }
      }
    }

    return loadedPluginNames;
  }

  // 1. Hook for custom formatters
  async runFormatters(filePath: string, content: string): Promise<string> {
    let formattedContent = content;
    for (const plugin of this.registeredPlugins) {
      if (typeof plugin.format === "function") {
        try {
          formattedContent = await plugin.format(filePath, formattedContent);
        } catch (err: any) {
          console.warn(`[PluginManager] Warning: Formatter "${plugin.name}" failed: ${err.message}`);
        }
      }
    }
    return formattedContent;
  }

  // 2. Hook for custom healers
  async runHealers(filePath: string, error: string, content: string): Promise<string | null> {
    for (const plugin of this.registeredPlugins) {
      if (typeof plugin.heal === "function") {
        try {
          console.log(`[PluginManager] Running custom healer extension: "${plugin.name}"`);
          const healed = await plugin.heal(filePath, error, content);
          if (healed && healed !== content) {
            return healed;
          }
        } catch (err: any) {
          console.warn(`[PluginManager] Warning: Healer "${plugin.name}" failed: ${err.message}`);
        }
      }
    }
    return null;
  }

  // 3. Hook for custom host deployments
  async runDeployments(outputDir: string): Promise<void> {
    for (const plugin of this.registeredPlugins) {
      if (typeof plugin.deploy === "function") {
        try {
          console.log(`[PluginManager] Invoking custom deployment extension: "${plugin.name}"`);
          await plugin.deploy(outputDir);
        } catch (err: any) {
          console.error(`[PluginManager] Error: Deployment extension "${plugin.name}" failed: ${err.message}`);
        }
      }
    }
  }
}
