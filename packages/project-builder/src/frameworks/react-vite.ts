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
      rmSync(output, {
        recursive: true,
        force: true,
      });
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
