import { join } from "node:path";

import { copyDirectory } from "../utils/copy-directory.js";

import type { FrameworkTemplate } from "./framework.js";

export class ReactViteTemplate
  implements FrameworkTemplate
{
  readonly name = "react-vite";

  async create(
    _projectName: string,
    output: string,
  ) {
    const template = join(
      process.cwd(),
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
