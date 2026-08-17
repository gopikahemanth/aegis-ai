/**
 * UniversalRepairEngine
 *
 * Domain-agnostic closed-loop self-healing engine for repairing broken APIs, workflows, and database schemas.
 */

import { DefectDiagnosisEngine, type DiagnosedDefect } from "../autonomous-product-builder/defect-diagnosis-engine.js";
import { RepairPlanner, type GovernedRepairPlan } from "../autonomous-product-builder/repair-planner.js";
import { AutonomousDefectRepairEngine } from "../product-completion/autonomous-defect-repair.js";
import { type CompiledExecutableWorkflow } from "./universal-workflow-engine.js";
import { UniversalWorkflowValidator, type UniversalWorkflowRunReport } from "./universal-workflow-validator.js";

export interface UniversalRepairIterationLog {
  iteration: number;
  workflowName: string;
  errorSnippet: string;
  defect: DiagnosedDefect;
  repairPlan: GovernedRepairPlan;
  retestReport: UniversalWorkflowRunReport;
}

export interface UniversalRepairResult {
  isHealed: boolean;
  totalIterations: number;
  logs: UniversalRepairIterationLog[];
  summary: string;
}

export class UniversalRepairEngine {
  public static async healWorkflow(
    workflow: CompiledExecutableWorkflow,
    injectedError?: { errorText: string; targetFile: string },
    maxAttempts: number = 3
  ): Promise<UniversalRepairResult> {
    const logs: UniversalRepairIterationLog[] = [];
    let currentError = injectedError;

    for (let i = 1; i <= maxAttempts; i++) {
      if (!currentError) {
        const cleanRun = await UniversalWorkflowValidator.executeWorkflow(workflow);
        return {
          isHealed: cleanRun.passed,
          totalIterations: i - 1,
          logs,
          summary: `Workflow "${workflow.name}" is healthy and verified.`,
        };
      }

      // 1. Diagnose
      const defect = DefectDiagnosisEngine.diagnose(currentError.errorText, [currentError.targetFile]);

      // 2. Plan
      const repairPlan = RepairPlanner.planRepair(defect);

      // 3. Apply mutation
      AutonomousDefectRepairEngine.executeRepairLoop(defect.description, defect.targetFiles, true, 3);

      // 4. Retest workflow
      const retest = await UniversalWorkflowValidator.executeWorkflow(workflow);

      logs.push({
        iteration: i,
        workflowName: workflow.name,
        errorSnippet: currentError.errorText,
        defect,
        repairPlan,
        retestReport: retest,
      });

      if (retest.passed) {
        currentError = undefined; // Cleared!
      }
    }

    return {
      isHealed: currentError === undefined,
      totalIterations: maxAttempts,
      logs,
      summary:
        currentError === undefined
          ? `Workflow "${workflow.name}" healed successfully in ${logs.length} iteration(s).`
          : `Workflow "${workflow.name}" requires human intervention after ${maxAttempts} attempts.`,
    };
  }
}
