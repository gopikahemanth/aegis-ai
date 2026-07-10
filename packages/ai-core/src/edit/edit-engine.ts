import { CodebaseIndex } from "../context/codebase-index.js";
import { FileSelector } from "../context/file-selector.js";
import { ContextEngine } from "../context/context-engine.js";
import { Fixer } from "../agent/fixer.js";
import type { AIProvider } from "../providers/base.js";

export class EditEngine {
  private readonly index = new CodebaseIndex();

  private readonly selector = new FileSelector();

  private readonly context = new ContextEngine();

  private readonly fixer: Fixer;

  constructor(provider: AIProvider) {
    this.fixer = new Fixer(provider);
  }

  async edit(
    request: string,
    projectPath: string,
  ) {
    const context =
      this.context.build(
        request,
        projectPath,
      );

    const response =
      await this.fixer.fix(
        request,
        "",
        context,
      );

    return response;
  }
}
