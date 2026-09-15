/**
 * GeneratedTestValidator — Aegis V2.3 Project 2 Phase 5.3
 *
 * Validates in-project test discovery, execution, and anti-cheating criteria:
 * - Ensures tests are discovered and run
 * - Enforces 0 failures and 0 skipped required tests
 * - Validates non-triviality and genuine assertion presence
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { InProjectTestRunner } from "../validation/in-project-test-runner.js";
import { GeneratedTestGenerator } from "./generated-test-generator.js";
import type { GeneratedTestValidationReport } from "./generated-test-contract.js";

export class GeneratedTestValidator {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Executes and validates the generated project test suite with anti-cheating enforcement.
   */
  public validate(): GeneratedTestValidationReport {
    // 1. Discover all test files in project
    const testFiles: string[] = [];
    const scanDir = (dir: string) => {
      if (!existsSync(dir)) return;
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== ".git") {
          scanDir(fullPath);
        } else if (entry.isFile() && /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          testFiles.push(fullPath);
        }
      }
    };

    scanDir(join(this.projectRoot, "src"));
    scanDir(join(this.projectRoot, "server"));
    scanDir(join(this.projectRoot, "test"));

    if (testFiles.length === 0) {
      return {
        status: "FAIL",
        framework: "none",
        totalTestFiles: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        durationMs: 0,
        failedTestNames: ["NO_TEST_FILES_DISCOVERED"],
        qualityAudit: {
          totalAssertions: 0,
          hasTrivialTests: false,
          trivialViolations: ["No test files found in project."],
          realAssertionCount: 0,
          passed: false,
        },
        output: "No test files were discovered in the project.",
      };
    }

    // 2. Perform anti-cheating audit across all test files
    const testContents = testFiles.map((f) => readFileSync(f, "utf8"));
    const qualityAudit = GeneratedTestGenerator.auditTestQuality(testContents);

    // 3. Execute tests via InProjectTestRunner
    const testReport = InProjectTestRunner.run(this.projectRoot);

    const isPassing =
      testReport.status === "PASS" &&
      testReport.passedTests > 0 &&
      testReport.failedTests === 0 &&
      qualityAudit.passed;

    const status: "PASS" | "FAIL" = isPassing ? "PASS" : "FAIL";

    return {
      status,
      framework: testReport.framework,
      totalTestFiles: testFiles.length,
      totalTests: testReport.totalTests,
      passedTests: testReport.passedTests,
      failedTests: testReport.failedTests,
      skippedTests: testReport.skippedTests,
      durationMs: testReport.durationMs,
      failedTestNames: testReport.failedTestNames,
      qualityAudit,
      output: testReport.output,
    };
  }
}
