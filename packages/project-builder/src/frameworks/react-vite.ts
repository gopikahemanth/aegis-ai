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
            // Kill any node/vite processes running from generated/project to release Prisma DLL / SQLite locks
            execSync(`powershell -Command "Get-Process node,vite -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*generated*' } | Stop-Process -Force"`, { stdio: "ignore" });
          } catch { /* ignore if process doesn't exist */ }
        }
        rmSync(output, {
          recursive: true,
          force: true,
          maxRetries: 10,
          retryDelay: 500,
        });
      } catch (err: any) {
        console.warn(`[ProjectBuilder] Warning: Target directory clean non-fatal error: ${err.message}`);
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
