import type { FrameworkTemplate } from "./framework.js";

export class FrameworkRouter {
  private readonly templates =
    new Map<string, FrameworkTemplate>();

  register(
    template: FrameworkTemplate,
  ) {
    this.templates.set(
      template.name,
      template,
    );
  }

  get(name: string) {
    const framework =
      this.templates.get(name);

    if (!framework) {
      throw new Error(
        `Framework "${name}" not found.`,
      );
    }

    return framework;
  }

  list() {
    return [...this.templates.keys()];
  }
}
