import { InProjectTestRunner, type TestExecutionReport } from "../validation/in-project-test-runner.js";

export interface BaselineRegressionReport {
  baselinePassed: boolean;
  baselineTotal: number;
  baselinePassCount: number;
  postChangePassed: boolean;
  postChangeTotal: number;
  postChangePassCount: number;
  newTestsAdded: number;
  hasRegression: boolean;
  regressionMessage?: string;
}

export class BaselineRegressionValidator {
  /**
   * Runs pre-change baseline tests.
   */
  public static async captureBaseline(projectRoot: string): Promise<TestExecutionReport> {
    console.log("[BaselineRegressionValidator] 🧪 Executing pre-change test baseline...");
    const report = InProjectTestRunner.run(projectRoot);
    console.log(`[BaselineRegressionValidator] Baseline test result: ${report.passedTests}/${report.totalTests} passed.`);
    return report;
  }

  /**
   * Compares post-change test execution against the pre-change baseline.
   */
  public static evaluateRegression(
    baseline: TestExecutionReport,
    postChange: TestExecutionReport,
    expectedNewTestsCount: number = 0
  ): BaselineRegressionReport {
    const baselinePassed = baseline.status === "PASS" || (baseline.status === "NOT_APPLICABLE");
    const postChangePassed = postChange.status === "PASS";

    let hasRegression = false;
    let regressionMessage: string | undefined;

    if (baseline.status === "PASS" && postChange.status === "FAIL") {
      hasRegression = true;
      regressionMessage = `REGRESSION_DETECTED: Pre-change baseline passed (${baseline.passedTests}/${baseline.totalTests}) but post-change suite failed (${postChange.passedTests}/${postChange.totalTests}).`;
    } else if (postChange.failedTests > baseline.failedTests) {
      hasRegression = true;
      regressionMessage = `REGRESSION_DETECTED: Failed tests increased from ${baseline.failedTests} to ${postChange.failedTests}.`;
    } else if (postChange.passedTests < baseline.passedTests) {
      hasRegression = true;
      regressionMessage = `REGRESSION_DETECTED: Passing tests decreased from ${baseline.passedTests} to ${postChange.passedTests}.`;
    }

    return {
      baselinePassed,
      baselineTotal: baseline.totalTests,
      baselinePassCount: baseline.passedTests,
      postChangePassed,
      postChangeTotal: postChange.totalTests,
      postChangePassCount: postChange.passedTests,
      newTestsAdded: Math.max(0, postChange.totalTests - baseline.totalTests),
      hasRegression,
      regressionMessage,
    };
  }
}
