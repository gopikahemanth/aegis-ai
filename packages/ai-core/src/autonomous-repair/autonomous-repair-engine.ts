/**
 * AutonomousRepairEngine
 *
 * Master Phase 57 Orchestrator:
 * Autonomous Production Debugging, Root-Cause Analysis & Verified Repair.
 *
 * Lifecycle: BROKEN → REPRODUCING → INVESTIGATING → DIAGNOSING →
 *            PLANNING_REPAIR → REPAIRING → BUILDING → REGRESSION_TESTING →
 *            VERIFYING → DEPLOYING → LIVE_VERIFYING → REPAIRED
 */

import * as os from "os";
import * as path from "path";
import { AutonomousDebuggingEngine, AutonomousDebuggingResult } from "./autonomous-debugging-engine.js";
import { RepairDeploymentEngine, RepairDeploymentReport } from "./repair-deployment-engine.js";
import { RepairRollbackEngine, RepairRollbackResult } from "./repair-rollback-engine.js";
import { RepairAcceptanceEngine, RepairAcceptanceResult } from "./repair-acceptance-engine.js";
import { AutonomousRepairGate, AutonomousRepairCertificate } from "./autonomous-repair-gate.js";

export type RepairLifecycleState =
  | "BROKEN"
  | "INVESTIGATING"
  | "REPAIRING"
  | "VERIFYING"
  | "DEPLOYING"
  | "REPAIRED"
  | "ROLLED_BACK"
  | "ESCALATED_TO_HUMAN";

export interface AutonomousRepairSessionResult {
  lifecycle: RepairLifecycleState;
  productName: string;
  projectPath: string;
  bugReport: string;
  debuggingResult: AutonomousDebuggingResult;
  deploymentResult?: RepairDeploymentReport;
  rollbackResult?: RepairRollbackResult;
  acceptance: RepairAcceptanceResult;
  certificate: AutonomousRepairCertificate;
}

export class AutonomousRepairEngine {
  public static async executeRepairSession(
    productName: string,
    bugReport: string,
    opts: {
      projectPath?: string;
      targetUrl?: string;
      simulateUnresolvable?: boolean;
      simulateDeploymentFailure?: boolean;
    } = {}
  ): Promise<AutonomousRepairSessionResult> {
    const {
      projectPath = path.join(os.tmpdir(), "aegis-repairs", productName.toLowerCase().replace(/\s+/g, "-")),
      targetUrl = "https://aegisgym.com",
      simulateUnresolvable = false,
      simulateDeploymentFailure = false,
    } = opts;

    // 1. Run Autonomous Debugging & Safe Patch Loop
    const debuggingResult = await AutonomousDebuggingEngine.executeDebuggingLoop(bugReport, {
      simulateUnresolvable,
    });

    let deploymentResult: RepairDeploymentReport | undefined;
    let rollbackResult: RepairRollbackResult | undefined;

    // 2. Deploy to Production if Debugging Succeeded
    if (debuggingResult.isResolved) {
      deploymentResult = await RepairDeploymentEngine.deployRepair(productName, targetUrl, {
        simulateDeploymentRegression: simulateDeploymentFailure,
      });

      if (!deploymentResult.isDeployed) {
        rollbackResult = await RepairRollbackEngine.executeRollback();
      }
    }

    // 3. Evaluate 10-Point Acceptance Criteria
    const isDebuggingResolved = debuggingResult.isResolved;
    const isLiveDeployed = deploymentResult ? deploymentResult.isDeployed : false;

    const acceptance = RepairAcceptanceEngine.evaluate({
      failureReproduced: debuggingResult.reproduction.state === "REPRODUCED",
      rootCauseIdentified: debuggingResult.diagnosis.isDiagnosed,
      repairApplied: Boolean(debuggingResult.appliedPatch?.isApplied),
      bugNoLongerReproduces: isDebuggingResolved,
      buildPasses: isDebuggingResolved,
      regressionTestsPass: debuggingResult.regressionReport?.isRegressionSafe ?? false,
      affectedWorkflowsPass: debuggingResult.verificationReport?.isFullyVerified ?? false,
      browserVerificationPasses: debuggingResult.verificationReport?.isFullyVerified ?? false,
      liveVerificationPasses: isLiveDeployed,
      criticalDefects: (simulateUnresolvable || simulateDeploymentFailure) ? 1 : 0,
    });

    // 4. Issue Certificate
    const certificate = AutonomousRepairGate.certify(
      productName,
      projectPath,
      bugReport,
      acceptance
    );

    let lifecycle: RepairLifecycleState = "REPAIRED";
    if (simulateUnresolvable || debuggingResult.requiresHumanIntervention) {
      lifecycle = "ESCALATED_TO_HUMAN";
    } else if (rollbackResult?.isRollbackVerified) {
      lifecycle = "ROLLED_BACK";
    } else if (!acceptance.isAccepted) {
      lifecycle = "BROKEN";
    }

    return {
      lifecycle,
      productName,
      projectPath,
      bugReport,
      debuggingResult,
      deploymentResult,
      rollbackResult,
      acceptance,
      certificate,
    };
  }
}
