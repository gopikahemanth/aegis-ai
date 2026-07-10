import { ContextEngine } from "../context/context-engine.js";
import { Fixer } from "../agent/fixer.js";
import { PatchEngine } from "../healing/patch-engine.js";

import type { AIProvider } from "../providers/base.js";

export class EditEngine {
  private readonly context =
    new ContextEngine();

  private readonly patchEngine =
    new PatchEngine();

  private readonly fixer: Fixer;

  constructor(provider: AIProvider) {
    this.fixer = new Fixer(provider);
  }

  async edit(
    request: string,
    projectPath: string,
  ) {
    const projectContext =
      this.context.build(
        request,
        projectPath,
      );

    const response =
      await this.fixer.fix(
        request,
        "",
        projectContext,
      );

    const filesPatched =
      this.patchEngine.apply(
        response,
        projectPath,
      );

    console.log(
      `Patched ${filesPatched} file(s).`,
    );

    return {
      filesPatched,
    };
  }
}
