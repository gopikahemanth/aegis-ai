/**
 * InProjectTestRunner
 *
 * Runs the generated project's automated test suite inside its own workspace
 * and extracts structured execution metrics.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

export type TestExecutionStatus =
  | "PASS"
  | "FAIL"
  | "NOT_APPLICABLE"
  | "SKIPPED"
  | "ABNORMAL_EXIT"
  | "CRASHED"
  | "TIMED_OUT";

export type TestFailureCategory =
  | "NONE"
  | "ASSERTION_FAILURE"
  | "INFRASTRUCTURE_FAILURE"
  | "ABNORMAL_EXIT"
  | "TIMEOUT"
  | "MALFORMED_OUTPUT"
  | "NO_TESTS_FOUND"
  | "UNHANDLED_ERROR";

export interface TestExecutionReport {
  status: "PASS" | "FAIL" | "NOT_APPLICABLE" | "SKIPPED";
  executionStatus: TestExecutionStatus;
  framework: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  errorCount: number;
  durationMs: number;
  failedTestNames: string[];
  output: string;
  exitCode: number;
  failureCategory: TestFailureCategory;
  failureReason?: string;
}

export class InProjectTestRunner {
  /**
   * Pure deterministic parser for test runner stdout, stderr, and exit codes.
   * Enables exhaustive unit testing without spawning child processes.
   */
  public static parseTestResults(
    stdout: string,
    stderr: string,
    exitCode: number,
    durationMs: number = 0,
    jsonReport?: any
  ): TestExecutionReport {
    const combinedOutput = `${stdout}\n${stderr}`;
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let errorCount = 0;
    const failedTestNames: string[] = [];

    // 1. Structured JSON Report parsing (if available)
    if (jsonReport && typeof jsonReport === "object") {
      totalTests = jsonReport.numTotalTests ?? 0;
      passedTests = jsonReport.numPassedTests ?? 0;
      failedTests = jsonReport.numFailedTests ?? 0;
      skippedTests = (jsonReport.numPendingTests ?? 0) + (jsonReport.numTodoTests ?? 0);

      if (Array.isArray(jsonReport.testResults)) {
        for (const tr of jsonReport.testResults) {
          if (Array.isArray(tr.assertionResults)) {
            for (const ar of tr.assertionResults) {
              if (ar.status === "failed") {
                failedTestNames.push(ar.title || ar.fullName || "unnamed test");
              }
            }
          }
        }
      }
    } else {
      // 2. Structured text parsing fallback
      // Specifically target the `Tests ...` summary line to avoid confusing `Test Files 2 passed` with `Tests 6 passed`
      const testsLineMatch = combinedOutput.match(/(?:^|\n)\s*Tests\s+([^\n]+)/i);
      if (testsLineMatch) {
        const testsLine = testsLineMatch[1];
        const pMatch = testsLine.match(/(\d+)\s+passed/i);
        if (pMatch) passedTests = parseInt(pMatch[1], 10);
        const fMatch = testsLine.match(/(\d+)\s+failed/i);
        if (fMatch) failedTests = parseInt(fMatch[1], 10);
        const sMatch = testsLine.match(/(\d+)\s+skipped/i);
        if (sMatch) skippedTests = parseInt(sMatch[1], 10);
      } else {
        const passedMatch = combinedOutput.match(/(\d+)\s+passed/i);
        if (passedMatch) passedTests = parseInt(passedMatch[1], 10);

        const failedMatch = combinedOutput.match(/(\d+)\s+failed/i);
        if (failedMatch) failedTests = parseInt(failedMatch[1], 10);

        const skippedMatch = combinedOutput.match(/(\d+)\s+skipped/i);
        if (skippedMatch) skippedTests = parseInt(skippedMatch[1], 10);
      }

      const errorMatch = combinedOutput.match(/Errors?\s+(\d+)\s+error/i);
      if (errorMatch) {
        errorCount = parseInt(errorMatch[1], 10);
      }

      // Check for unhandled errors reported by Vitest
      if (/Unhandled Error/i.test(combinedOutput) && errorCount === 0) {
        errorCount = 1;
      }

      // Extract failed test names from standard Vitest output format (e.g. ❯ test-name)
      const failLines = combinedOutput.match(/(?:❯|×|FAIL)\s+([^\n\r]+)/g);
      if (failLines) {
        for (const fl of failLines) {
          const cleaned = fl.replace(/^(?:❯|×|FAIL)\s+/, "").trim();
          if (cleaned && !cleaned.includes("Test Files") && !cleaned.includes("Tests") && !failedTestNames.includes(cleaned)) {
            failedTestNames.push(cleaned);
          }
        }
      }

      totalTests = passedTests + failedTests + skippedTests;

      if (totalTests === 0 && exitCode === 0) {
        const checkmarks = (combinedOutput.match(/✓/g) || []).length;
        if (checkmarks > 0) {
          passedTests = checkmarks;
          totalTests = checkmarks;
        }
      }
    }

    // 3. Classify outcome based on exit code and metrics
    let status: "PASS" | "FAIL" | "SKIPPED" = "FAIL";
    let executionStatus: TestExecutionStatus = "FAIL";
    let failureCategory: TestFailureCategory = "NONE";
    let failureReason: string | undefined;

    const stderrSummary = stderr.trim().split("\n").slice(-5).join(" ").trim();

    if (skippedTests > 0 && passedTests === 0 && failedTests === 0 && errorCount === 0) {
      status = "SKIPPED";
      executionStatus = "SKIPPED";
      failureCategory = "NONE";
      failureReason = `All ${skippedTests} test(s) were skipped.`;
    } else if (exitCode === 0 && failedTests === 0 && errorCount === 0 && (totalTests > 0 || passedTests > 0)) {
      status = "PASS";
      executionStatus = "PASS";
      failureCategory = "NONE";
    } else if (failedTests > 0) {
      status = "FAIL";
      executionStatus = "FAIL";
      failureCategory = "ASSERTION_FAILURE";
      failureReason = `${failedTests} test(s) failed: ${failedTestNames.slice(0, 5).join("; ") || "Assertion error"}`;
    } else if (errorCount > 0) {
      status = "FAIL";
      executionStatus = "CRASHED";
      failureCategory = "UNHANDLED_ERROR";
      failureReason = `Test runner encountered ${errorCount} unhandled error(s) during execution (e.g. worker error or hook crash).`;
    } else if (exitCode !== 0 && passedTests > 0 && failedTests === 0) {
      // Abnormal exit: all individual assertions passed, but process exited non-zero
      status = "FAIL";
      executionStatus = "ABNORMAL_EXIT";
      failureCategory = "ABNORMAL_EXIT";
      failureReason = `Process exited with abnormal code ${exitCode} despite ${passedTests} passed assertions. Diagnostic: ${stderrSummary || "Unhandled process hook or environment failure"}`;
    } else if (exitCode !== 0 && totalTests === 0) {
      status = "FAIL";
      executionStatus = "CRASHED";
      failureCategory = "INFRASTRUCTURE_FAILURE";
      failureReason = `Test runner process failed to execute (exit code ${exitCode}). Error: ${stderrSummary || "Process crashed or terminated prematurely"}`;
    } else if (totalTests === 0 && exitCode === 0) {
      status = "FAIL";
      executionStatus = "FAIL";
      failureCategory = "NO_TESTS_FOUND";
      failureReason = "Test runner completed but found 0 test cases to execute.";
    }

    return {
      status,
      executionStatus,
      framework: "vitest",
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      errorCount,
      durationMs,
      failedTestNames,
      output: combinedOutput,
      exitCode,
      failureCategory,
      failureReason,
    };
  }

  /**
   * Executes the test command inside the project directory and returns a structured report.
   */
  public static run(projectRoot: string): TestExecutionReport {
    const pkgPath = join(projectRoot, "package.json");
    if (!existsSync(pkgPath)) {
      return {
        status: "NOT_APPLICABLE",
        executionStatus: "NOT_APPLICABLE",
        framework: "none",
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        errorCount: 0,
        durationMs: 0,
        failedTestNames: [],
        output: "No package.json found",
        exitCode: 0,
        failureCategory: "NONE",
      };
    }

    let pkg: any = {};
    try {
      pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    } catch {
      return {
        status: "NOT_APPLICABLE",
        executionStatus: "NOT_APPLICABLE",
        framework: "none",
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        errorCount: 0,
        durationMs: 0,
        failedTestNames: [],
        output: "Failed to parse package.json",
        exitCode: 1,
        failureCategory: "INFRASTRUCTURE_FAILURE",
        failureReason: "Corrupted or invalid package.json",
      };
    }

    if (!pkg.scripts?.test) {
      return {
        status: "NOT_APPLICABLE",
        executionStatus: "NOT_APPLICABLE",
        framework: "none",
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        errorCount: 0,
        durationMs: 0,
        failedTestNames: [],
        output: "No test script declared in package.json",
        exitCode: 0,
        failureCategory: "NONE",
      };
    }

    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let exitCode = 0;
    let isTimeout = false;

    // Ensure Prisma Client is generated if prisma schema exists
    const prismaSchema = join(projectRoot, "prisma", "schema.prisma");
    if (existsSync(prismaSchema)) {
      try {
        const prismaBin = join(projectRoot, "node_modules", "prisma", "build", "index.js");
        if (existsSync(prismaBin)) {
          execSync(`node "${prismaBin}" generate`, { cwd: projectRoot, stdio: "ignore" });
        } else {
          execSync(`npx prisma generate`, { cwd: projectRoot, stdio: "ignore" });
        }
      } catch {}
    }

    const aegisDir = join(projectRoot, ".aegis");
    if (!existsSync(aegisDir)) {
      try { mkdirSync(aegisDir, { recursive: true }); } catch {}
    }
    const jsonOutputFile = join(aegisDir, "vitest-results.json");

    const localVitest = resolve(projectRoot, "node_modules", "vitest", "vitest.mjs");
    const runCmd = existsSync(localVitest)
      ? `node "${localVitest}" run --reporter=json --outputFile="${jsonOutputFile}"`
      : "npm test -- --run";

    console.log(`\n[InProjectTestRunner] 🧪 Running generated project test suite: \`${runCmd}\` in ${projectRoot}...`);

    try {
      stdout = execSync(runCmd, {
        cwd: projectRoot,
        timeout: 60000,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err: any) {
      exitCode = err.status || 1;
      stdout = err.stdout ? String(err.stdout) : "";
      stderr = err.stderr ? String(err.stderr) : (err.message || "");
      if (err.code === "ETIMEDOUT" || (err.killed && err.signal === "SIGTERM")) {
        isTimeout = true;
      }
    }

    const durationMs = Date.now() - startTime;

    // Try reading JSON report if generated
    let jsonReport: any;
    if (existsSync(jsonOutputFile)) {
      try {
        jsonReport = JSON.parse(readFileSync(jsonOutputFile, "utf8"));
      } catch {}
    }

    let report = InProjectTestRunner.parseTestResults(stdout, stderr, exitCode, durationMs, jsonReport);

    if (isTimeout) {
      report.status = "FAIL";
      report.executionStatus = "TIMED_OUT";
      report.failureCategory = "TIMEOUT";
      report.failureReason = "Test suite timed out after 60000ms limit.";
    }

    console.log(
      `[InProjectTestRunner] Status: ${report.status} (${report.passedTests}/${report.totalTests} passed, exitCode: ${report.exitCode}) in ${report.durationMs}ms.`
    );
    if (report.failureReason) {
      console.log(`[InProjectTestRunner] Reason: ${report.failureReason}`);
    }

    return report;
  }
}
