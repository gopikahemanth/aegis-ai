import { join } from "node:path";

import { copyDirectory } from "../utils/copy-directory.js";
 import { findRepoRoot } from "../utils/repo-root.js";
import type { FrameworkTemplate } from "./framework.js";

export class HtmlTemplate
  implements FrameworkTemplate
{
  readonly name = "html";

  async create(
    _projectName: string,
    output: string,
  ) {


const repoRoot =
  findRepoRoot(process.cwd());

const template = join(
  repoRoot,
  "packages",
  "project-builder",
  "templates",
  "html",
);
    copyDirectory(
      template,
      output,
    );
  }
}
