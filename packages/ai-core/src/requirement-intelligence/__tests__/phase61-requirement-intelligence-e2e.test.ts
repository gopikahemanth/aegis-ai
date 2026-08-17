import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RequirementIntelligenceOrchestrator } from "../requirement-intelligence-orchestrator.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 61 — Master Autonomous Requirement Evolution & Roadmap Intelligence E2E Test", () => {
  const tmpDir = path.join(os.tmpdir(), "aegis-phase61-e2e-test");

  beforeEach(() => {
    ProductCompletionLedger.reset();
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  it("Crown-Jewel: Independently discovers new requirement from signals, validates, plans roadmap, contracts, authorizes, verifies, and measures real-world outcome", async () => {
    const result = await RequirementIntelligenceOrchestrator.executeRequirementEvolutionCycle("GymMaster Pro", {
      projectPath: tmpDir,
      simulateExportDemand: true,
      userExplicitlyApproved: true,
    });

    // 1. Lifecycle State
    expect(result.lifecycle).toBe("FEATURE_VERIFIED_AND_MEASURED");

    // 2. Signals & Discovery
    expect(result.signals.totalSignals).toBe(3);
    expect(result.discovery.totalCandidates).toBe(1);
    expect(result.discovery.primaryCandidate?.id).toBe("REQ-061");

    // 3. Validation & Invariant: AI IDEA ≠ VALIDATED REQUIREMENT
    expect(result.validation.hasSufficientEvidence).toBe(true);
    expect(result.validation.primaryRequirement?.status).toBe("VERIFIED_REQUIREMENT");
    expect(result.validation.primaryRequirement?.evidenceScore).toBeGreaterThanOrEqual(90);

    // 4. Duplicate Check
    expect(result.duplicateAnalysis?.isDuplicate).toBe(false);
    expect(result.duplicateAnalysis?.recommendation).toBe("PROCEED_AS_NEW");

    // 5. Conflict Check
    expect(result.conflicts?.hasConflict).toBe(false);
    expect(result.conflicts?.isBlockedBySecurity).toBe(false);

    // 6. Lineage Derivation & Impact
    expect(result.lineage?.primaryProvenance).toBe("EXPLICIT");
    expect(result.impact?.overallBlastRadius).toBe("MODERATE");

    // 7. Prioritization & Roadmap
    expect(result.prioritization?.topItem?.priorityTier).toBe("P1_HIGH");
    expect(result.roadmap?.items[0].status).toBe("COMPLETED");

    // 8. Contract & Authorization
    expect(result.contract?.targetRoles).toContain("MANAGER");
    expect(result.authorization?.decision).toBe("AUTHORIZED");

    // 9. Implementation & Verification
    expect(result.implementation?.isImplemented).toBe(true);
    expect(result.verification?.isFullyVerified).toBe(true);
    expect(result.verification?.checks.length).toBe(10);

    // 10. Measured Impact & Tier 48 Certificate
    expect(result.measuredImpact?.isImpactProven).toBe(true);
    expect(result.measuredImpact?.supportTicketReductionPercent).toBe(85.0);
    expect(result.certificate.status).toBe("REQUIREMENT_ACCEPTED");
    expect(result.certificate.tier).toBe(48);
  });

  it("Duplicate Requirement E2E: Recommends extending existing feature when similar functionality exists", async () => {
    const result = await RequirementIntelligenceOrchestrator.executeRequirementEvolutionCycle("GymMaster Pro", {
      projectPath: tmpDir,
      simulateDuplicateRequest: true,
    });

    expect(result.lifecycle).toBe("DUPLICATE_RECOMMEND_EXTENSION");
    expect(result.duplicateAnalysis?.isDuplicate).toBe(true);
    expect(result.duplicateAnalysis?.recommendation).toBe("EXTEND_EXISTING_FEATURE");
    expect(result.certificate.status).toBe("REQUIREMENT_REJECTED");
  });

  it("Conflict E2E: Blocks automatic implementation when requirement conflicts with security policy", async () => {
    const result = await RequirementIntelligenceOrchestrator.executeRequirementEvolutionCycle("GymMaster Pro", {
      projectPath: tmpDir,
      simulateConflictRequest: true,
    });

    expect(result.lifecycle).toBe("SECURITY_CONFLICT_BLOCKED");
    expect(result.conflicts?.hasConflict).toBe(true);
    expect(result.conflicts?.isBlockedBySecurity).toBe(true);
    expect(result.certificate.status).toBe("REQUIREMENT_REJECTED");
  });

  it("Insufficient-Evidence E2E: Halts execution when feedback lacks operational evidence", async () => {
    const result = await RequirementIntelligenceOrchestrator.executeRequirementEvolutionCycle("GymMaster Pro", {
      projectPath: tmpDir,
      simulateVagueRequest: true,
    });

    expect(result.lifecycle).toBe("INSUFFICIENT_EVIDENCE_HOLD");
    expect(result.validation.hasSufficientEvidence).toBe(false);
    expect(result.certificate.status).toBe("REQUIREMENT_REJECTED");
  });

  it("New-Feature Regression E2E: Detects regression in existing workflow and blocks feature acceptance", async () => {
    const result = await RequirementIntelligenceOrchestrator.executeRequirementEvolutionCycle("GymMaster Pro", {
      projectPath: tmpDir,
      simulateWorkflowRegression: true,
      userExplicitlyApproved: true,
    });

    expect(result.lifecycle).toBe("REGRESSION_BLOCKED");
    expect(result.verification?.isFullyVerified).toBe(false);
    expect(result.verification?.hasExistingWorkflowRegression).toBe(true);
    expect(result.certificate.status).toBe("REQUIREMENT_REJECTED");
  });
});
