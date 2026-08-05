import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { BuildRunner } from "./build-runner.js";
import { SandboxVerifier } from "./sandbox-verifier.js";
import { SecurityGuard } from "../utils/security.js";
import { RealityCheckerAgent } from "../agents/reality-checker-agent.js";

const execute = promisify(exec);

export class BuildOrchestrator {
  private readonly runner =
    new BuildRunner();

  private readonly sandboxVerifier = new SandboxVerifier();

  private readonly realityChecker = new RealityCheckerAgent();

  async verify(
    projectPath: string,
    projectSummary?: string,
    originalRequest?: string,
  ) {
    // ─── Step 1: TypeScript / Bundler Build ───────────────────────────────────
    const result =
      await this.runner.run(
        projectPath,
      );

    if (!result.success) {
      console.log("✗ Build failed.");
      if (result.stderr) {
        console.error("===== BUILD STDERR =====");
        console.error(result.stderr);
      }
      if (result.stdout) {
        console.log("===== BUILD STDOUT =====");
        console.log(result.stdout);
      }
      return result;
    }

    console.log(
      "✓ Build succeeded.",
    );

    // ─── Step 2: Dynamic Lint Check ───────────────────────────────────────────
    const packageJsonPath = join(projectPath, "package.json");
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
        if (pkg.scripts && pkg.scripts.lint) {
          console.log("Running lint verification...");
          try {
            const sanitizedCmd = SecurityGuard.sanitizeCommand("pnpm lint");
            const validatedPath = SecurityGuard.validateSafePath("./generated/project", projectPath);
            await execute(sanitizedCmd, {
              cwd: validatedPath,
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

    // ─── Step 3: Sandbox & Visual Verification ────────────────────────────────
    const sandboxResult = await this.sandboxVerifier.verify(projectPath);
    if (!sandboxResult.success) {
      console.log("✗ Sandbox runtime verification failed.");
      return {
        success: false,
        stdout: sandboxResult.logs ?? "",
        stderr: `Sandbox Runtime & Browser Verification Failure:\n${sandboxResult.message}`,
      };
    }
    console.log("✓ Sandbox runtime verification passed.");

    // ─── Step 4: Reality Checker — No Mock Data Policy ────────────────────────
    console.log("Running Reality Checker audit...");
    const realityResult = this.realityChecker.audit(projectPath);
    if (!realityResult.passed) {
      console.log("✗ Reality Checker audit failed — mock data / unimplemented features detected.");
      const healingContext = originalRequest && projectSummary
        ? this.realityChecker.buildHealingPrompt(originalRequest, realityResult, projectSummary)
        : realityResult.report;
      return {
        success: false,
        stdout: "",
        stderr: `Reality Checker Audit Failure:\n${healingContext}`,
      };
    }
    console.log("✓ Reality Checker audit passed — all features are real.");

    return result;
  }
}
