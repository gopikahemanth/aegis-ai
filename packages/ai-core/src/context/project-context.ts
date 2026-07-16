import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export class ProjectContext {
  build(
    projectPath: string,
    files: string[],
  ) {
    let context = "Existing Project\n\n";

    for (const file of files) {
      const fullPath = join(
        projectPath,
        file,
      );

      if (!existsSync(fullPath)) {
        continue;
      }

      const content =
        readFileSync(
          fullPath,
          "utf8",
        );

      context += `
===FILE: ${file}===
${content}

`;
    }

    return context;
  }

}
