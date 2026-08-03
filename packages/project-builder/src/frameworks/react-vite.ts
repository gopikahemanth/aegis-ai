import {
  existsSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";

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
        rmSync(output, {
          recursive: true,
          force: true,
          maxRetries: 3,
          retryDelay: 100,
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
