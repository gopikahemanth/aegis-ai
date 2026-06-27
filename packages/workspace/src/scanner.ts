import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { ProjectInfo } from "./project.js";
import { FrameworkDetector } from "./framework.js";
import { PackageManagerDetector } from "./package-manager.js";
import { BuildToolDetector } from "./build-tool.js";
import { MonorepoDetector } from "./monorepo.js";

export class WorkspaceScanner {
  private readonly frameworkDetector = new FrameworkDetector();
  private readonly packageManagerDetector = new PackageManagerDetector();
  private readonly buildToolDetector = new BuildToolDetector();
  private readonly monorepoDetector = new MonorepoDetector();
  scan(root: string): ProjectInfo {
    const packageJsonPath = join(root, "package.json");

    let dependencies: string[] = [];
    let scripts: Record<string, string> = {};

    if (existsSync(packageJsonPath)) {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));

      dependencies = [
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.devDependencies ?? {})
      ];

      scripts = pkg.scripts ?? {};
    }

    return {
      root,
      framework: this.frameworkDetector.detect(dependencies),
      buildTool: this.buildToolDetector.detect(dependencies),
      monorepo: this.monorepoDetector.detect(root),
      language: dependencies.includes("typescript")
        ? "TypeScript"
        : "JavaScript",
      packageManager: this.packageManagerDetector.detect(root),
      dependencies,
      scripts
    };
  }
}
