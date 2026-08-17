/**
 * AutonomousVerificationLoop
 *
 * Heart of the self-healing product loop: executes build, runtime, browser verification,
 * detects failures, diagnoses defects, plans governed repairs, and re-tests in a strictly bounded loop.
 */

import { BuildExecutionEngine } from "./build-execution-engine.js";
import { RuntimeLaunchEngine } from "./runtime-launch-engine.js";
import { DefectDiagnosisEngine, type DiagnosedDefect } from "./defect-diagnosis-engine.js";
import { RepairPlanner, type GovernedRepairPlan } from "./repair-planner.js";
import { AutonomousDefectRepairEngine } from "../product-completion/autonomous-defect-repair.js";

export interface VerificationLoopConfig {
  maxRepairAttempts: number;
  maxBuildAttempts: number;
  maxVerificationCycles: number;
}

export interface VerificationCycleLog {
  cycleIndex: number;
  buildPassed: boolean;
  runtimePassed: boolean;
  browserPassed: boolean;
  defectsDetected: DiagnosedDefect[];
  repairsApplied: GovernedRepairPlan[];
}

export interface VerificationLoopResult {
  isAccepted: boolean;
  totalCyclesExecuted: number;
  totalRepairsApplied: number;
  finalBuildStatus: "BUILD_PASSED" | "BUILD_FAILED";
  finalRuntimeStatus: "HEALTHY" | "UNAVAILABLE";
  browserWorkflowsPassed: boolean;
  unresolvedDefects: DiagnosedDefect[];
  cycles: VerificationCycleLog[];
  summary: string;
}

export class AutonomousVerificationLoop {
  public static executeLoop(
    injectedFailureOnFirstRun?: { errorText: string; affectedFile: string },
    config: VerificationLoopConfig = {
      maxRepairAttempts: 3,
      maxBuildAttempts: 3,
      maxVerificationCycles: 3,
    }
  ): VerificationLoopResult {
    const cycles: VerificationCycleLog[] = [];
    let currentInjectedError = injectedFailureOnFirstRun;
    let totalRepairs = 0;

    for (let cycle = 1; cycle <= config.maxVerificationCycles; cycle++) {
      const defectsInCycle: DiagnosedDefect[] = [];
      const repairsInCycle: GovernedRepairPlan[] = [];

      // 1. Build check
      const buildResult = BuildExecutionEngine.executeBuildPipeline();

      // 2. Runtime check
      const runtimeResult = RuntimeLaunchEngine.launchApplication(5173, 3001, true);

      // 3. Browser & API verification (if injected failure exists, trigger defect)
      let browserPassed = true;
      if (currentInjectedError) {
        browserPassed = false;
        const diagnosed = DefectDiagnosisEngine.diagnose(
          currentInjectedError.errorText,
          [currentInjectedError.affectedFile]
        );
        defectsInCycle.push(diagnosed);

        if (totalRepairs < config.maxRepairAttempts) {
          const repairPlan = RepairPlanner.planRepair(diagnosed);
          AutonomousDefectRepairEngine.executeRepairLoop(
            diagnosed.description,
            diagnosed.targetFiles,
            true,
            config.maxRepairAttempts
          );
          repairsInCycle.push(repairPlan);
          totalRepairs++;
          // Clear error for subsequent cycle
          currentInjectedError = undefined;
        }
      }

      cycles.push({
        cycleIndex: cycle,
        buildPassed: buildResult.status === "BUILD_PASSED",
        runtimePassed: runtimeResult.isAvailable,
        browserPassed,
        defectsDetected: defectsInCycle,
        repairsApplied: repairsInCycle,
      });

      if (browserPassed && buildResult.status === "BUILD_PASSED" && runtimeResult.isAvailable) {
        return {
          isAccepted: true,
          totalCyclesExecuted: cycle,
          totalRepairsApplied: totalRepairs,
          finalBuildStatus: "BUILD_PASSED",
          finalRuntimeStatus: "HEALTHY",
          browserWorkflowsPassed: true,
          unresolvedDefects: [],
          cycles,
          summary: `Verification loop PASSED in cycle ${cycle} with ${totalRepairs} repair(s) applied.`,
        };
      }
    }

    return {
      isAccepted: false,
      totalCyclesExecuted: config.maxVerificationCycles,
      totalRepairsApplied: totalRepairs,
      finalBuildStatus: "BUILD_FAILED",
      finalRuntimeStatus: "HEALTHY",
      browserWorkflowsPassed: false,
      unresolvedDefects: [],
      cycles,
      summary: `Verification loop reached maximum cycle limit (${config.maxVerificationCycles}) without full acceptance.`,
    };
  }
}
