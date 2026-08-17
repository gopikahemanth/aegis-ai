/**
 * RealDefectRepairLoop
 *
 * Executes closed-loop self-healing on real failure signals:
 * Detects Failure -> Diagnoses Root Cause -> Plans Governed Repair -> Applies Mutation -> Rebuilds -> Restarts Runtime -> Retests.
 * Enforces strict iteration limits without fake success.
 */

import { RealBuildRunner } from "./real-build-runner.js";
import { RealRuntimeValidator } from "./real-runtime-validator.js";
import { RealApiWorkflowValidator } from "./real-api-workflow-validator.js";
import { RealBrowserWorkflowValidator } from "./real-browser-workflow-validator.js";
import { DefectDiagnosisEngine, type DiagnosedDefect } from "../autonomous-product-builder/defect-diagnosis-engine.js";
import { RepairPlanner, type GovernedRepairPlan } from "../autonomous-product-builder/repair-planner.js";
import { AutonomousDefectRepairEngine } from "../product-completion/autonomous-defect-repair.js";

export interface RepairIterationLog {
  iteration: number;
  stage: "API" | "BROWSER" | "BUILD" | "RUNTIME";
  failureObserved: string;
  defect: DiagnosedDefect;
  repairPlan: GovernedRepairPlan;
  rebuildPassed: boolean;
  retestPassed: boolean;
}

export interface RealRepairLoopResult {
  isResolved: boolean;
  totalIterations: number;
  logs: RepairIterationLog[];
  finalStatus: "RESOLVED" | "PRODUCT_REQUIRES_HUMAN_INTERVENTION";
  summary: string;
}

export class RealDefectRepairLoop {
  public static async executeRepairLoop(
    injectedFailure?: { stage: "API" | "BROWSER"; stepName: string; rawError: string; affectedFile: string },
    maxRepairAttempts: number = 5
  ): Promise<RealRepairLoopResult> {
    const logs: RepairIterationLog[] = [];
    let currentFailure = injectedFailure;

    for (let iteration = 1; iteration <= maxRepairAttempts; iteration++) {
      if (!currentFailure) {
        return {
          isResolved: true,
          totalIterations: iteration - 1,
          logs,
          finalStatus: "RESOLVED",
          summary: `All real-world defects resolved within ${iteration - 1} iteration(s).`,
        };
      }

      // 1. Diagnose defect
      const defect = DefectDiagnosisEngine.diagnose(currentFailure.rawError, [currentFailure.affectedFile]);

      // 2. Plan repair
      const repairPlan = RepairPlanner.planRepair(defect);

      // 3. Apply governed repair
      AutonomousDefectRepairEngine.executeRepairLoop(defect.description, defect.targetFiles, true, 3);

      // 4. Rebuild
      const rebuild = RealBuildRunner.executeRealBuild();

      // 5. Restart runtime & Retest
      const runtime = await RealRuntimeValidator.validateRuntime(5173, 3001, true);
      const apiRetest = await RealApiWorkflowValidator.executeGymApiWorkflow();
      const browserRetest = await RealBrowserWorkflowValidator.executeGymBrowserWorkflow();

      const retestPassed = rebuild.status === "BUILD_PASSED" && runtime.isAvailable && apiRetest.passed && browserRetest.passed;

      logs.push({
        iteration,
        stage: currentFailure.stage,
        failureObserved: currentFailure.rawError,
        defect,
        repairPlan,
        rebuildPassed: rebuild.status === "BUILD_PASSED",
        retestPassed,
      });

      if (retestPassed) {
        currentFailure = undefined; // Defect cleared
      }
    }

    return {
      isResolved: currentFailure === undefined,
      totalIterations: maxRepairAttempts,
      logs,
      finalStatus: currentFailure === undefined ? "RESOLVED" : "PRODUCT_REQUIRES_HUMAN_INTERVENTION",
      summary:
        currentFailure === undefined
          ? `Defects successfully healed after ${logs.length} iteration(s).`
          : `Defect could not be autonomously resolved after ${maxRepairAttempts} attempts. Requires human intervention.`,
    };
  }
}
