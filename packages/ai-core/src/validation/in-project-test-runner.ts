/**
 * InProjectTestRunner
 *
 * Runs the generated project's automated test suite inside its own workspace
 * and extracts structured execution metrics.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface TestExecutionReport {
  status: "PASS" | "FAIL" | "NOT_APPLICABLE" | "SKIPPED";
  framework: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  durationMs: number;
  failedTestNames: string[];
  output: string;
}

export class InProjectTestRunner {
  /**
   * Executes the test command inside the project directory and returns a structured report.
   */
  public static run(projectRoot: string): TestExecutionReport {
    const pkgPath = join(projectRoot, "package.json");
    if (!existsSync(pkgPath)) {
      return {
        status: "NOT_APPLICABLE",
        framework: "none",
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        durationMs: 0,
        failedTestNames: [],
        output: "No package.json found",
      };
    }

    let pkg: any = {};
    try {
      pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    } catch {
      return {
        status: "NOT_APPLICABLE",
        framework: "none",
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        durationMs: 0,
        failedTestNames: [],
        output: "Failed to parse package.json",
      };
    }

    if (!pkg.scripts?.test) {
      return {
        status: "NOT_APPLICABLE",
        framework: "none",
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        durationMs: 0,
        failedTestNames: [],
        output: "No test script declared in package.json",
      };
    }

    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let exitCode = 0;

    const localVitest = resolve(projectRoot, "node_modules", "vitest", "vitest.mjs");
    const runCmd = existsSync(localVitest)
      ? `node "${localVitest}" run`
      : "npm test -- --run";

    console.log(`\n[InProjectTestRunner] 🧪 Running generated project test suite: \`${runCmd}\` in ${projectRoot}...`);

    try {
      stdout = execSync(runCmd, {
        cwd: projectRoot,
        timeout: 30000,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err: any) {
      exitCode = err.status || 1;
      stdout = err.stdout || "";
      stderr = err.stderr || err.message;
    }

    const durationMs = Date.now() - startTime;
    const combinedOutput = `${stdout}\n${stderr}`;

    // Parse Vitest output for counts
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    const failedTestNames: string[] = [];

    // Check pass/fail indicators
    const passedMatch = combinedOutput.match(/(\d+)\s+passed/i);
    if (passedMatch) {
      passedTests = parseInt(passedMatch[1], 10);
    }

    const failedMatch = combinedOutput.match(/(\d+)\s+failed/i);
    if (failedMatch) {
      failedTests = parseInt(failedMatch[1], 10);
    }

    const skippedMatch = combinedOutput.match(/(\d+)\s+skipped/i);
    if (skippedMatch) {
      skippedTests = parseInt(skippedMatch[1], 10);
    }

    totalTests = passedTests + failedTests + skippedTests;

    if (totalTests === 0 && exitCode === 0) {
      // Fallback: If vitest ran and exited 0 with checkmarks
      const checkmarks = (combinedOutput.match(/✓/g) || []).length;
      if (checkmarks > 0) {
        passedTests = checkmarks;
        totalTests = checkmarks;
      }
    }

    const status = (exitCode === 0 && failedTests === 0 && (totalTests > 0 || passedTests > 0)) ? "PASS" : "FAIL";

    console.log(
      `[InProjectTestRunner] Status: ${status} (${passedTests}/${totalTests} passed) in ${durationMs}ms.`
    );

    return {
      status,
      framework: "vitest",
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      durationMs,
      failedTestNames,
      output: combinedOutput,
    };
  }
}
