import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { BuildRunner } from "./build-runner.js";

const execute = promisify(exec);

export class BuildOrchestrator {
  private readonly runner =
    new BuildRunner();

  async verify(
    projectPath: string,
  ) {
    const result =
      await this.runner.run(
        projectPath,
      );

    if (!result.success) {
      console.log(
        "✗ Build failed.",
      );
      return result;
    }

    console.log(
      "✓ Build succeeded.",
    );

    // Dynamic Lint Check
    const packageJsonPath = join(projectPath, "package.json");
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
        if (pkg.scripts && pkg.scripts.lint) {
          console.log("Running lint verification...");
          try {
            await execute("pnpm lint", {
              cwd: projectPath,
            });
            console.log("✓ Linting passed.");
          } catch (error: any) {
            console.log("✗ Linting failed.");
            return {
              success: false,
              stdout: error.stdout ?? "",
              stderr: `Linter Validation Failure:\n${error.stderr ?? error.message}`,
            };
          }
        }
      } catch (e) {
        // Ignored: corrupt package.json or other file access issues
      }
    }

    return result;
  }
}
