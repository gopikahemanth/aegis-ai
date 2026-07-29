import { readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

export class ProjectScanner {
  scan(projectPath: string): string[] {
    if (!existsSync(projectPath)) {
      return [];
    }
    const files: string[] = [];

    const walk = (directory: string) => {
      for (const entry of readdirSync(directory)) {
        const fullPath = join(directory, entry);

        const stats = statSync(fullPath);

        if (stats.isDirectory()) {
          if (
            entry === "node_modules" ||
            entry === ".git" ||
            entry === "dist"
          ) {
            continue;
          }

          walk(fullPath);
        } else {
          files.push(
            relative(projectPath, fullPath).replaceAll("\\", "/"),
          );
        }
      }
    };

    walk(projectPath);

    return files.sort();
  }
}
