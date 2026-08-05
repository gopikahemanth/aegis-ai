import {
  existsSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

import { copyDirectory } from "../utils/copy-directory.js";
import { findRepoRoot } from "../utils/repo-root.js";
import type { FrameworkTemplate } from "./framework.js";

export class ReactViteTemplate
  implements FrameworkTemplate
{
  readonly name = "react-vite";

  async create(
    _projectName: string,
    output: string,
  ) {
    if (existsSync(output)) {
      try {
        if (process.platform === "win32") {
          try {
            // Kill any node processes running from generated/project to release Prisma DLL / SQLite locks
            execSync(`wmic process where "ExecutablePath like '%node.exe%' and CommandLine like '%generated%project%'" call terminate`, { stdio: "ignore" });
          } catch { /* ignore if process doesn't exist */ }
        }
        rmSync(output, {
          recursive: true,
          force: true,
          maxRetries: 5,
          retryDelay: 300,
        });
      } catch (err: any) {
        console.warn(`[ProjectBuilder] Warning: Could not completely remove existing target directory: ${err.message}`);
      }
    }

    const repoRoot =
  findRepoRoot(process.cwd());

const template = join(
  repoRoot,
  "packages",
  "project-builder",
  "templates",
  "react-vite",
);

    copyDirectory(
      template,
      output,
    );
  }
}
