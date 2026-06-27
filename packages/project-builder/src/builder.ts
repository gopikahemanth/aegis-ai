import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { TemplateLibrary } from "./templates.js";

export class ProjectBuilder {
  private readonly templates = new TemplateLibrary();

  buildReactVite(name: string, output: string) {
    const project = this.templates.reactVite(name);

    for (const folder of project.folders) {
      mkdirSync(join(output, folder), {
        recursive: true,
      });
    }

    for (const file of project.files) {
      writeFileSync(
        join(output, file.path),
        file.content,
        "utf8",
      );
    }
  }
}
