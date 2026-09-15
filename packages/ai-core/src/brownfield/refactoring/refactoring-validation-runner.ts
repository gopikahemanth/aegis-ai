/**
 * RefactoringValidationRunner — Aegis V2.3 Project 2 Phase 6
 *
 * Runs non-destructive pre-flight and post-flight test and compilation validations:
 * - Purely observational: Never modifies working tree, never creates branches
 * - Executes tsc --noEmit and package tests where requested
 * - Produces deterministic validation status reports
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

export interface ValidationRunnerResult {
  testPassed: boolean;
  buildPassed: boolean;
  errors: string[];
}

export class RefactoringValidationRunner {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Runs TypeScript compiler diagnostics non-destructively.
   */
  public runBuildDiagnostics(): { passed: boolean; message?: string } {
    const tsconfig = resolve(this.projectRoot, "tsconfig.json");
    if (!existsSync(tsconfig)) {
      return { passed: true };
    }

    try {
      execSync("npx tsc --noEmit", {
        cwd: this.projectRoot,
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { passed: true };
    } catch (err: any) {
      const output = err.stderr?.toString() || err.stdout?.toString() || err.message;
      return { passed: false, message: output };
    }
  }

  /**
   * Runs targeted tests non-destructively.
   */
  public runTargetedTests(testPattern?: string): { passed: boolean; message?: string } {
    const pkgJson = resolve(this.projectRoot, "package.json");
    if (!existsSync(pkgJson)) {
      return { passed: true };
    }

    try {
      const cmd = testPattern ? `pnpm test ${testPattern}` : `pnpm test`;
      execSync(cmd, {
        cwd: this.projectRoot,
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { passed: true };
    } catch (err: any) {
      const output = err.stderr?.toString() || err.stdout?.toString() || err.message;
      return { passed: false, message: output };
    }
  }
}
