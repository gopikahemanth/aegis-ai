import { join } from "node:path";
import { copyDirectory } from "../utils/copy-directory.js";
import { cleanDirectory } from "../utils/clean-directory.js";
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
    cleanDirectory(output);

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
