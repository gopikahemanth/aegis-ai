import { createFrameworkRouter } from "./frameworks/default-router.js";

export class ProjectCreator {
  private readonly router =
    createFrameworkRouter();

  async create(
    framework: string,
    projectName: string,
    output: string,
  ) {
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
