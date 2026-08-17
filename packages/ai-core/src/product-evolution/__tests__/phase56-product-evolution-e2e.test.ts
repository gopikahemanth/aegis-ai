import { describe, it, expect, beforeEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { ProductEvolutionEngine } from "../product-evolution-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 56 — Master E2E Product Evolution & Autonomous Modification", () => {
  const tmpBase = path.join(os.tmpdir(), "aegis-p56-e2e");

  beforeEach(() => {
    ProductCompletionLedger.reset();
    if (fs.existsSync(tmpBase)) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpBase, { recursive: true });
  });

  it("modifies existing gym product, detects & repairs defect, and accepts updated live product", async () => {
    const projectPath = path.join(tmpBase, "gym-evo-prod");
    fs.mkdirSync(projectPath, { recursive: true });

    const changePrompt = "Add online payments to my existing gym management website. Members should be able to pay for memberships, admins should see payment history, and membership status should update after successful payment.";

    // Execute Master Product Evolution Engine (with simulated regression that AEGIS autonomously repairs)
    const result = await ProductEvolutionEngine.evolveProduct("GymMaster Pro", changePrompt, {
      projectPath,
      simulateRegression: true, // Triggers autonomous defect detection & repair
    });

    // 1. Lifecycle verification
    expect(result.lifecycle).toBe("ACCEPTED");
    expect(result.productName).toBe("GymMaster Pro");

    // 2. Existing Product Discovery & Understanding
    expect(result.inventory.orm).toBe("Prisma ORM");
    expect(result.architecture.entities).toContain("Member");

    // 3. Contract & Impact
    expect(result.contract.affectedEntities).toContain("Payment");
    expect(result.impactReport.overallSeverity).toBe("HIGH");

    // 4. Multi-Layer Modifications
    expect(result.database.newModelsCreated).toContain("Payment");
    expect(result.backend.newEndpointsAdded).toBe(3);
    expect(result.frontend.componentsModified.length).toBeGreaterThanOrEqual(4);
    expect(result.ui.isDesignConsistent).toBe(true);
    expect(result.integration.verifiedCount).toBe(2);

    // 5. Defect Detection & Autonomous Repair
    expect(result.repairResult).toBeDefined();
    expect(result.repairResult?.isRepaired).toBe(true);
    expect(result.repairResult?.totalAttempts).toBe(1);

    // 6. Test Matrix & Verification
    expect(result.testReport.isAllPassed).toBe(true);
    expect(result.testReport.regressionDetected).toBe(false);
    expect(result.verificationReport.isFullyVerified).toBe(true);
    expect(result.verificationReport.paymentWorkflowPassed).toBe(true);
    expect(result.verificationReport.existingAttendanceWorkflowPassed).toBe(true);

    // 7. Live Deployment & Acceptance
    expect(result.deploymentResult?.isDeployed).toBe(true);
    expect(result.acceptance.isAccepted).toBe(true);
    expect(result.acceptance.criticalDefectCount).toBe(0);
    expect(result.certificate.tier).toBe(43);
    expect(result.certificate.status).toBe("EVOLUTION_ACCEPTED");

    // 8. Disk Certificate & Ledger Integrity
    const certPath = path.join(projectPath, ".aegis", "product-evolution-certificate.json");
    expect(fs.existsSync(certPath)).toBe(true);
    const certOnDisk = JSON.parse(fs.readFileSync(certPath, "utf8"));
    expect(certOnDisk.status).toBe("EVOLUTION_ACCEPTED");
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);
  });

  it("escalates to human intervention when defects exceed max repair attempts", async () => {
    const projectPath = path.join(tmpBase, "gym-evo-unrepairable");
    fs.mkdirSync(projectPath, { recursive: true });

    const result = await ProductEvolutionEngine.evolveProduct(
      "GymMaster Pro",
      "Add online payments",
      {
        projectPath,
        simulateRegression: true,
        simulateUnrepairableDefect: true,
      }
    );

    expect(result.lifecycle).toBe("FAILED");
    expect(result.repairResult?.isRepaired).toBe(false);
    expect(result.repairResult?.requiresHumanIntervention).toBe(true);
    expect(result.acceptance.isAccepted).toBe(false);
    expect(result.certificate.status).toBe("EVOLUTION_REJECTED");
  });

  it("rolls back safely when live deployment of evolved product fails", async () => {
    const projectPath = path.join(tmpBase, "gym-evo-rollback");
    fs.mkdirSync(projectPath, { recursive: true });

    const result = await ProductEvolutionEngine.evolveProduct(
      "GymMaster Pro",
      "Add online payments",
      {
        projectPath,
        simulateDeploymentFailure: true,
      }
    );

    expect(result.lifecycle).toBe("ROLLED_BACK");
    expect(result.deploymentResult?.isDeployed).toBe(false);
    expect(result.rollbackResult?.isRollbackVerified).toBe(true);
    expect(result.acceptance.isAccepted).toBe(false);
    expect(result.certificate.status).toBe("EVOLUTION_REJECTED");
  });
});
