import { describe, it, expect, beforeEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { ProductIntelligenceOrchestrator } from "../product-intelligence-orchestrator.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 60 — Master E2E Autonomous Product Intelligence & Continuous Improvement", () => {
  const tmpBase = path.join(os.tmpdir(), "aegis-p60-e2e");

  beforeEach(() => {
    ProductCompletionLedger.reset();
    if (fs.existsSync(tmpBase)) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpBase, { recursive: true });
  });

  it("independently observes deployed product, discovers checkout abandonment root cause, safely improves it, and measures real-world uplift", async () => {
    const projectPath = path.join(tmpBase, "gym-intel-prod");
    fs.mkdirSync(projectPath, { recursive: true });

    // User only gives prompt: "Continuously improve this product."
    const result = await ProductIntelligenceOrchestrator.executeContinuousImprovementCycle("GymMaster Pro", {
      projectPath,
      simulateCheckoutBottleneck: true,
    });

    // 1. Lifecycle Status
    expect(result.lifecycle).toBe("IMPROVEMENT_ACCEPTED");
    expect(result.productName).toBe("GymMaster Pro");

    // 2. Autonomous Observation & Pattern Discovery
    expect(result.observations.totalObservations).toBeGreaterThanOrEqual(4);
    expect(result.patterns.hasFrictionPatterns).toBe(true);
    expect(result.patterns.primaryAnomaly?.workflowName).toBe("Membership Checkout");
    expect(result.patterns.primaryAnomaly?.abandonmentRatePercent).toBe(38);

    // 3. Multi-Signal Correlation & Root Cause Discovery
    expect(result.correlation.hasCorrelatedProblems).toBe(true);
    expect(result.correlation.strongestSignalGroup?.strength).toBe("VERIFIED_PROBLEM");
    expect(result.problems.hasProblems).toBe(true);
    expect(result.problems.primaryProblem?.rootCause).toContain("PaymentService");

    // 4. Prioritization, Contract & Plan
    expect(result.prioritization?.topPriorityItem?.priorityTier).toBe("P1_HIGH");
    expect(result.contract?.contractId).toBeDefined();
    expect(result.plan?.steps.length).toBe(5);

    // 5. Bounded Autonomous Implementation
    expect(result.execution?.isImplemented).toBe(true);
    expect(result.execution?.totalPatchesApplied).toBe(2);
    expect(result.execution?.requiresHumanIntervention).toBe(false);

    // 6. Multi-Layer Verification
    expect(result.verification?.isFullyVerified).toBe(true);
    expect(result.verification?.functionalVerified).toBe(true);
    expect(result.verification?.securityVerified).toBe(true);
    expect(result.verification?.performanceVerified).toBe(true);
    expect(result.verification?.uxVerified).toBe(true);

    // 7. Real-World Impact Measurement
    expect(result.impact?.isImpactPositive).toBe(true);
    expect(result.impact?.conversionUpliftPercent).toBe(12);
    expect(result.impact?.latencyReductionPercent).toBe(82);

    // 8. Gate Certification & Ledger
    expect(result.certificate.tier).toBe(47);
    expect(result.certificate.status).toBe("IMPROVEMENT_ACCEPTED");
    expect(result.certificate.evidence.problemVerified).toBe(true);
    expect(result.certificate.evidence.realWorldImpactMeasured).toBe(true);

    const certPath = path.join(projectPath, ".aegis", "product-intelligence-certificate.json");
    expect(fs.existsSync(certPath)).toBe(true);
    const certDisk = JSON.parse(fs.readFileSync(certPath, "utf8"));
    expect(certDisk.status).toBe("IMPROVEMENT_ACCEPTED");
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);
  });

  it("guards against false-positives by recognizing scheduled maintenance without modifying the product", async () => {
    const projectPath = path.join(tmpBase, "gym-intel-false-positive");
    fs.mkdirSync(projectPath, { recursive: true });

    const result = await ProductIntelligenceOrchestrator.executeContinuousImprovementCycle("GymMaster Pro", {
      projectPath,
      simulateCheckoutBottleneck: false,
      simulateMaintenanceAnomaly: true,
    });

    expect(result.lifecycle).toBe("INSUFFICIENT_EVIDENCE_HOLD");
    expect(result.correlation.hasInsufficientEvidenceForModification).toBe(true);
    expect(result.problems.hasProblems).toBe(false);
    expect(result.execution).toBeUndefined();
    expect(result.certificate.status).toBe("IMPROVEMENT_REJECTED");
  });

  it("automatically rolls back and verifies previous healthy state when a regression occurs post-optimization", async () => {
    const projectPath = path.join(tmpBase, "gym-intel-rollback");
    fs.mkdirSync(projectPath, { recursive: true });

    const result = await ProductIntelligenceOrchestrator.executeContinuousImprovementCycle("GymMaster Pro", {
      projectPath,
      simulateVerificationRegression: true,
    });

    expect(result.lifecycle).toBe("ROLLED_BACK");
    expect(result.verification?.isFullyVerified).toBe(false);
    expect(result.rollbackResult?.isRolledBack).toBe(true);
    expect(result.rollbackResult?.isRollbackVerified).toBe(true);
    expect(result.certificate.status).toBe("IMPROVEMENT_REJECTED");
  });
});
