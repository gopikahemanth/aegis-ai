import { CodebaseIndex } from "../context/codebase-index.js";
import { FileSelector } from "../context/file-selector.js";
import { ContextEngine } from "../context/context-engine.js";
import { Fixer } from "../agent/fixer.js";
import type { AIProvider } from "../providers/base.js";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

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
    const files = this.walk(projectPath);

    const indexed =
      this.index.build(files);

    const selected =
      this.selector.select(
        request,
        indexed,
      );

    console.log("Selected files:");

    console.table(selected);

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

  private walk(
    directory: string,
  ): string[] {
    const files: string[] = [];

    const visit = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);

        const stats = statSync(full);

        if (stats.isDirectory()) {
          visit(full);
        } else {
          files.push(
            relative(
              directory,
              full,
            ),
          );
        }
      }
    };

    visit(directory);

    return files;
  }
}
