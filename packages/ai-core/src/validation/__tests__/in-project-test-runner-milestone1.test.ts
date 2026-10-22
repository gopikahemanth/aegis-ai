import { describe, it, expect } from "vitest";
import { InProjectTestRunner } from "../in-project-test-runner.js";

describe("InProjectTestRunner — Milestone 1 Result Model & Failure Classification", () => {
  it("Scenario 1: All tests pass and process exits 0 -> PASS with NONE category", () => {
    const stdout = `
 RUN  v1.6.1 /workspace/generated-project
 ✓ src/__tests__/app.test.tsx (4 tests) 12ms
 ✓ src/__tests__/api.test.ts (2 tests) 5ms

 Test Files  2 passed (2)
      Tests  6 passed (6)
   Start at  12:00:00
   Duration  1.20s
`;
    const report = InProjectTestRunner.parseTestResults(stdout, "", 0, 1200);

    expect(report.status).toBe("PASS");
    expect(report.executionStatus).toBe("PASS");
    expect(report.failureCategory).toBe("NONE");
    expect(report.passedTests).toBe(6);
    expect(report.failedTests).toBe(0);
    expect(report.totalTests).toBe(6);
    expect(report.exitCode).toBe(0);
    expect(report.failureReason).toBeUndefined();
  });

  it("Scenario 2: A test fails and process exits non-zero -> FAIL with ASSERTION_FAILURE", () => {
    const stdout = `
 RUN  v1.6.1 /workspace/generated-project
 ❯ src/__tests__/app.test.tsx (2 tests | 1 failed)
   × renders active dashboard
 ✓ src/__tests__/api.test.ts (2 tests)

 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 3 passed (4)
`;
    const report = InProjectTestRunner.parseTestResults(stdout, "AssertionError: expected true to be false", 1, 1500);

    expect(report.status).toBe("FAIL");
    expect(report.executionStatus).toBe("FAIL");
    expect(report.failureCategory).toBe("ASSERTION_FAILURE");
    expect(report.failedTests).toBe(1);
    expect(report.passedTests).toBe(3);
    expect(report.totalTests).toBe(4);
    expect(report.exitCode).toBe(1);
    expect(report.failedTestNames).toContain("renders active dashboard");
    expect(report.failureReason).toContain("1 test(s) failed");
  });

  it("Scenario 3: Tests pass but process exits non-zero -> FAIL with ABNORMAL_EXIT and explanation", () => {
    const stdout = `
 RUN  v1.6.1 /workspace/generated-project
 ✓ src/__tests__/app.test.tsx (4 tests) 10ms

 Test Files  1 passed (1)
      Tests  4 passed (4)
`;
    const stderr = `
(node:1234) [DEP0190] DeprecationWarning: Invalid argument concatenation
UnhandledPromiseRejection: Connection closed prematurely
`;
    const report = InProjectTestRunner.parseTestResults(stdout, stderr, 1, 800);

    // Must NOT be marked PASS just because 4/4 passed
    expect(report.status).toBe("FAIL");
    expect(report.executionStatus).toBe("ABNORMAL_EXIT");
    expect(report.failureCategory).toBe("ABNORMAL_EXIT");
    expect(report.passedTests).toBe(4);
    expect(report.failedTests).toBe(0);
    expect(report.exitCode).toBe(1);
    expect(report.failureReason).toContain("Process exited with abnormal code 1 despite 4 passed assertions");
    expect(report.failureReason).toContain("UnhandledPromiseRejection");
  });

  it("Scenario 4: Runner catches unhandled error or crashes during run -> FAIL with UNHANDLED_ERROR or CRASHED", () => {
    const stdout = `
 RUN  v1.6.1 /workspace/generated-project
 ✓ src/__tests__/app.test.tsx (2 tests)

⎯⎯⎯⎯⎯⎯ Unhandled Errors ⎯⎯⎯⎯⎯⎯
Vitest caught 1 unhandled error during the test run.
DataCloneError: transformRequest function could not be cloned.

 Test Files  1 passed (1)
      Tests  2 passed (2)
     Errors  1 error
`;
    const report = InProjectTestRunner.parseTestResults(stdout, "Worker terminated unexpectedly", 1, 2000);

    expect(report.status).toBe("FAIL");
    expect(report.executionStatus).toBe("CRASHED");
    expect(report.failureCategory).toBe("UNHANDLED_ERROR");
    expect(report.errorCount).toBe(1);
    expect(report.failureReason).toContain("1 unhandled error(s)");
  });

  it("Scenario 5: Malformed output or early process crash -> FAIL with INFRASTRUCTURE_FAILURE", () => {
    const stdout = "";
    const stderr = "FATAL: Out of memory during worker allocation";
    const report = InProjectTestRunner.parseTestResults(stdout, stderr, 137, 500);

    expect(report.status).toBe("FAIL");
    expect(report.executionStatus).toBe("CRASHED");
    expect(report.failureCategory).toBe("INFRASTRUCTURE_FAILURE");
    expect(report.totalTests).toBe(0);
    expect(report.exitCode).toBe(137);
    expect(report.failureReason).toContain("Test runner process failed to execute (exit code 137)");
  });

  it("Scenario 6A: Tests are all skipped -> SKIPPED status", () => {
    const stdout = `
 RUN  v1.6.1 /workspace/generated-project
 ↓ src/__tests__/app.test.tsx (3 skipped)

 Test Files  1 skipped (1)
      Tests  3 skipped (3)
`;
    const report = InProjectTestRunner.parseTestResults(stdout, "", 0, 300);

    expect(report.status).toBe("SKIPPED");
    expect(report.executionStatus).toBe("SKIPPED");
    expect(report.skippedTests).toBe(3);
    expect(report.passedTests).toBe(0);
    expect(report.failedTests).toBe(0);
  });

  it("Scenario 6B: Zero tests found on exit 0 -> FAIL with NO_TESTS_FOUND", () => {
    const stdout = `
 RUN  v1.6.1 /workspace/generated-project
 No test files found.
`;
    const report = InProjectTestRunner.parseTestResults(stdout, "", 0, 100);

    expect(report.status).toBe("FAIL");
    expect(report.failureCategory).toBe("NO_TESTS_FOUND");
    expect(report.totalTests).toBe(0);
    expect(report.failureReason).toContain("found 0 test cases");
  });

  it("Scenario 7: Machine-readable JSON report parsed accurately", () => {
    const jsonReport = {
      numTotalTests: 5,
      numPassedTests: 4,
      numFailedTests: 1,
      numPendingTests: 0,
      numTodoTests: 0,
      testResults: [
        {
          name: "test.ts",
          assertionResults: [
            { fullName: "renders correctly", status: "passed" },
            { fullName: "submits order form", status: "failed", title: "submits order form" }
          ]
        }
      ]
    };

    const report = InProjectTestRunner.parseTestResults("", "", 1, 950, jsonReport);

    expect(report.status).toBe("FAIL");
    expect(report.failureCategory).toBe("ASSERTION_FAILURE");
    expect(report.totalTests).toBe(5);
    expect(report.passedTests).toBe(4);
    expect(report.failedTests).toBe(1);
    expect(report.failedTestNames).toContain("submits order form");
  });
});
