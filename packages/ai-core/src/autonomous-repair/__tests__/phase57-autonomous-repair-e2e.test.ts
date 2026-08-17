import { describe, it, expect, beforeEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { AutonomousRepairEngine } from "../autonomous-repair-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 57 — Master E2E Autonomous Production Debugging & Verified Repair", () => {
  const tmpBase = path.join(os.tmpdir(), "aegis-p57-e2e");

  beforeEach(() => {
    ProductCompletionLedger.reset();
    if (fs.existsSync(tmpBase)) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpBase, { recursive: true });
  });

  it("handles real production bug report: reproduces, diagnoses RCA, safely patches, regression-tests, deploys, and accepts repair", async () => {
    const projectPath = path.join(tmpBase, "gym-repair-prod");
    fs.mkdirSync(projectPath, { recursive: true });

    const bugReport = "Payments are broken. POST /api/payments/create-intent returns 500 Internal Server Error when members attempt checkout.";

    // Execute Autonomous Repair Engine
    const result = await AutonomousRepairEngine.executeRepairSession("GymMaster Pro", bugReport, {
      projectPath,
      targetUrl: "https://aegisgym.com",
    });

    // 1. Lifecycle
    expect(result.lifecycle).toBe("REPAIRED");
    expect(result.productName).toBe("GymMaster Pro");

    // 2. Deterministic Reproduction
    expect(result.debuggingResult.reproduction.state).toBe("REPRODUCED");
    expect(result.debuggingResult.reproduction.reproductionRate).toBe(1.0);

    // 3. Multi-signal Evidence Collection
    expect(result.debuggingResult.evidence.totalSignals).toBeGreaterThanOrEqual(5);
    expect(result.debuggingResult.evidence.redactedTokensCount).toBeGreaterThan(0);

    // 4. Stack Trace & RCA
    expect(result.debuggingResult.stackTrace.culpritFile).toContain("payment.service.ts");
    expect(result.debuggingResult.diagnosis.isDiagnosed).toBe(true);
    expect(result.debuggingResult.diagnosis.primaryCause.classification).toBe("DIRECT_CAUSE");
    expect(result.debuggingResult.diagnosis.primaryCause.confidence).toBeGreaterThanOrEqual(0.95);

    // 5. Impact & Safe Patch
    expect(result.debuggingResult.impact.overallSeverity).toBe("HIGH");
    expect(result.debuggingResult.appliedPatch?.isApplied).toBe(true);
    expect(result.debuggingResult.appliedPatch?.totalLinesChanged).toBeLessThanOrEqual(25);

    // 6. Regression & Verification
    expect(result.debuggingResult.regressionReport?.isRegressionSafe).toBe(true);
    expect(result.debuggingResult.regressionReport?.totalTests).toBe(61);
    expect(result.debuggingResult.verificationReport?.isFullyVerified).toBe(true);
    expect(result.debuggingResult.verificationReport?.bugNoLongerReproduces).toBe(true);

    // 7. Live Production Deployment & Acceptance
    expect(result.deploymentResult?.isDeployed).toBe(true);
    expect(result.acceptance.isAccepted).toBe(true);
    expect(result.acceptance.criticalDefects).toBe(0);
    expect(result.certificate.tier).toBe(44);
    expect(result.certificate.status).toBe("REPAIR_ACCEPTED");

    // 8. Disk Certificate & Ledger Integrity
    const certPath = path.join(projectPath, ".aegis", "autonomous-repair-certificate.json");
    expect(fs.existsSync(certPath)).toBe(true);
    const certOnDisk = JSON.parse(fs.readFileSync(certPath, "utf8"));
    expect(certOnDisk.status).toBe("REPAIR_ACCEPTED");
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);
  });

  it("escalates to human intervention without fabricating repairs when bug is unresolvable", async () => {
    const projectPath = path.join(tmpBase, "gym-repair-unresolvable");
    fs.mkdirSync(projectPath, { recursive: true });

    const result = await AutonomousRepairEngine.executeRepairSession(
      "GymMaster Pro",
      "Intermittent external upstream packet drops",
      {
        projectPath,
        simulateUnresolvable: true,
      }
    );

    expect(result.lifecycle).toBe("ESCALATED_TO_HUMAN");
    expect(result.debuggingResult.isResolved).toBe(false);
    expect(result.debuggingResult.totalAttempts).toBe(5);
    expect(result.debuggingResult.requiresHumanIntervention).toBe(true);
    expect(result.acceptance.isAccepted).toBe(false);
    expect(result.certificate.status).toBe("REPAIR_REJECTED");
  });

  it("rolls back safely when deployed repair fails live verification", async () => {
    const projectPath = path.join(tmpBase, "gym-repair-rollback");
    fs.mkdirSync(projectPath, { recursive: true });

    const result = await AutonomousRepairEngine.executeRepairSession(
      "GymMaster Pro",
      "Payments are broken",
      {
        projectPath,
        simulateDeploymentFailure: true,
      }
    );

    expect(result.lifecycle).toBe("ROLLED_BACK");
    expect(result.deploymentResult?.isDeployed).toBe(false);
    expect(result.rollbackResult?.isRollbackVerified).toBe(true);
    expect(result.acceptance.isAccepted).toBe(false);
    expect(result.certificate.status).toBe("REPAIR_REJECTED");
  });
});
