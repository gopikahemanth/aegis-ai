/**
 * ToolIntegrityValidator
 *
 * Enforces the Claim vs Evidence model:
 * Prohibits agents from claiming verification success without actual tool execution evidence.
 */

export interface ToolExecutionRecord {
  toolName: "BUILD" | "TEST" | "BROWSER" | "API_REQUEST" | "LINTER";
  command?: string;
  exitCode: number;
  stdout: string;
  stderr?: string;
  executedAt: string;
}

export interface VerificationEvidenceSummary {
  claim: string;
  isVerified: boolean;
  status: "VERIFIED" | "UNVERIFIED" | "FAILED";
  evidenceDetails?: string;
}

export class ToolIntegrityValidator {
  private static executionHistory: ToolExecutionRecord[] = [];

  public static reset(): void {
    this.executionHistory = [];
  }

  public static recordExecution(record: ToolExecutionRecord): void {
    this.executionHistory.push(record);
  }

  /**
   * Verify an agent's claim against actual tool execution history.
   */
  public static verifyClaim(claimType: "BUILD" | "TEST" | "BROWSER" | "API"): VerificationEvidenceSummary {
    switch (claimType) {
      case "BUILD": {
        const buildRuns = this.executionHistory.filter(r => r.toolName === "BUILD");
        if (buildRuns.length === 0) {
          return {
            claim: "Build execution passed",
            isVerified: false,
            status: "UNVERIFIED",
            evidenceDetails: "No build command was actually executed in this session.",
          };
        }
        const lastBuild = buildRuns[buildRuns.length - 1];
        return {
          claim: "Build execution passed",
          isVerified: lastBuild.exitCode === 0,
          status: lastBuild.exitCode === 0 ? "VERIFIED" : "FAILED",
          evidenceDetails: `Build exited with code ${lastBuild.exitCode}. Output: ${lastBuild.stdout.slice(0, 100)}`,
        };
      }

      case "TEST": {
        const testRuns = this.executionHistory.filter(r => r.toolName === "TEST");
        if (testRuns.length === 0) {
          return {
            claim: "Test runner passed",
            isVerified: false,
            status: "UNVERIFIED",
            evidenceDetails: "No test suite was actually executed in this session.",
          };
        }
        const lastTest = testRuns[testRuns.length - 1];
        return {
          claim: "Test runner passed",
          isVerified: lastTest.exitCode === 0,
          status: lastTest.exitCode === 0 ? "VERIFIED" : "FAILED",
          evidenceDetails: `Tests exited with code ${lastTest.exitCode}.`,
        };
      }

      case "BROWSER": {
        const browserRuns = this.executionHistory.filter(r => r.toolName === "BROWSER");
        if (browserRuns.length === 0) {
          return {
            claim: "Browser rendering verified",
            isVerified: false,
            status: "UNVERIFIED",
            evidenceDetails: "No browser automation or DOM snapshot was executed in this session.",
          };
        }
        return {
          claim: "Browser rendering verified",
          isVerified: true,
          status: "VERIFIED",
          evidenceDetails: `Browser session verified at ${browserRuns[browserRuns.length - 1].executedAt}`,
        };
      }

      case "API": {
        const apiRuns = this.executionHistory.filter(r => r.toolName === "API_REQUEST");
        if (apiRuns.length === 0) {
          return {
            claim: "API workflow verified",
            isVerified: false,
            status: "UNVERIFIED",
            evidenceDetails: "No HTTP API endpoints were executed in this session.",
          };
        }
        const hasFailures = apiRuns.some(r => r.exitCode >= 400);
        return {
          claim: "API workflow verified",
          isVerified: !hasFailures,
          status: hasFailures ? "FAILED" : "VERIFIED",
          evidenceDetails: `Executed ${apiRuns.length} API requests.`,
        };
      }
    }
  }
}
