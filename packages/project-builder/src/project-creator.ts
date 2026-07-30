import { createFrameworkRouter } from "./frameworks/default-router.js";
import { PluginManager } from "./plugins/plugin-manager.js";

export class ProjectCreator {
  private readonly router =
    createFrameworkRouter();

  private readonly pluginManager =
    new PluginManager(process.cwd());

  private pluginsLoaded = false;

  async create(
    framework: string,
    projectName: string,
    output: string,
  ) {
    if (!this.pluginsLoaded) {
      await this.pluginManager.loadPlugins(this.router);
      this.pluginsLoaded = true;
    }

    const template =
      this.router.get(framework);

    await template.create(
      projectName,
      output,
    );

    return {
      framework,
      output,
    };
  }
}
