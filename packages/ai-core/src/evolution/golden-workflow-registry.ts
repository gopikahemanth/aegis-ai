/**
 * GoldenWorkflowRegistry
 *
 * Manages persistent critical user workflows across multiple generations (e.g. login, createMember, listMembers).
 * Executes regression checks after every generation to guarantee unaffected features remain verified.
 */

import { ApiWorkflowVerifier, type ApiWorkflowStep } from "../validation/api-workflow-verifier.js";
import { BrowserWorkflowRunner, type BrowserWorkflowAction } from "../validation/browser-workflow-runner.js";

export interface GoldenWorkflowDefinition {
  id: string;
  name: string;
  description: string;
  targetFeature: string;
  apiSteps?: ApiWorkflowStep[];
  browserActions?: BrowserWorkflowAction[];
}

export interface GoldenWorkflowExecutionResult {
  workflowId: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  evidence: string[];
}

export interface GoldenRegressionReport {
  passed: boolean;
  totalWorkflows: number;
  passedCount: number;
  failedCount: number;
  results: GoldenWorkflowExecutionResult[];
  summary: string;
}

export class GoldenWorkflowRegistry {
  private static workflows: Map<string, GoldenWorkflowDefinition> = new Map();

  public static registerWorkflow(workflow: GoldenWorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  public static getWorkflow(id: string): GoldenWorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  public static getAllWorkflows(): GoldenWorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  public static clear(): void {
    this.workflows.clear();
  }

  /**
   * Run all registered golden workflows against the live server URL.
   */
  public static async executeRegression(baseUrl: string): Promise<GoldenRegressionReport> {
    const results: GoldenWorkflowExecutionResult[] = [];
    const allWorkflows = this.getAllWorkflows();

    if (allWorkflows.length === 0) {
      return {
        passed: true,
        totalWorkflows: 0,
        passedCount: 0,
        failedCount: 0,
        results: [],
        summary: "No golden workflows registered — regression check skipped.",
      };
    }

    console.log(`[GoldenWorkflowRegistry] 🛡️ Running ${allWorkflows.length} golden regression workflow(s) against ${baseUrl}...`);

    for (const wf of allWorkflows) {
      const start = Date.now();
      const evidence: string[] = [];
      let passed = true;
      let errorReason: string | undefined;

      try {
        // 1. Execute API steps if defined
        if (wf.apiSteps && wf.apiSteps.length > 0) {
          const apiReport = await ApiWorkflowVerifier.executeWorkflows(baseUrl, wf.apiSteps);
          if (!apiReport.passed) {
            passed = false;
            errorReason = `API step failure: ${apiReport.summary}`;
          } else {
            evidence.push(`Passed ${apiReport.passedSteps}/${apiReport.totalSteps} API steps`);
          }
        }

        // 2. Execute Browser actions if defined
        if (passed && wf.browserActions && wf.browserActions.length > 0) {
          const browserResult = await BrowserWorkflowRunner.executeWorkflow(baseUrl, wf.browserActions);
          if (!browserResult.passed) {
            passed = false;
            errorReason = `Browser interaction failure: ${browserResult.error || "Actions failed"}`;
          } else {
            evidence.push(...browserResult.evidence);
          }
        }

        results.push({
          workflowId: wf.id,
          name: wf.name,
          passed,
          durationMs: Date.now() - start,
          error: errorReason,
          evidence,
        });
      } catch (err: any) {
        results.push({
          workflowId: wf.id,
          name: wf.name,
          passed: false,
          durationMs: Date.now() - start,
          error: err.message,
          evidence: [`Execution exception: ${err.message}`],
        });
      }
    }

    const failedCount = results.filter((r) => !r.passed).length;
    const passedCount = results.length - failedCount;
    const overallPassed = failedCount === 0;

    return {
      passed: overallPassed,
      totalWorkflows: results.length,
      passedCount,
      failedCount,
      results,
      summary: overallPassed
        ? `GOLDEN REGRESSION PASSED: ${passedCount}/${results.length} core workflows verified.`
        : `GOLDEN REGRESSION FAILED: ${failedCount}/${results.length} workflows failed.`,
    };
  }
}
