import { describe, it, expect, beforeEach } from "vitest";
import { ProductScenarioRunner } from "../product-scenario-runner.js";
import { RealProductValidationEngine } from "../real-product-validation-engine.js";
import { RealRuntimeValidator } from "../real-runtime-validator.js";
import { RequirementContractRegistry } from "../../product-completion/requirement-contract-registry.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 47 — Master Real-World Autonomous Product Validation E2E Test", () => {
  beforeEach(() => {
    RequirementContractRegistry.reset();
    ProductCompletionLedger.reset();
    RealRuntimeValidator.cleanup();
  });

  it("proves complete real-world website generation and verification with defect self-healing and Tier 35 certification", async () => {
    const scenario = ProductScenarioRunner.getGymManagementScenario();

    const report = await RealProductValidationEngine.executeValidation(
      scenario,
      "./dist/gym-production-app",
      {
        stage: "BROWSER",
        stepName: "submit_member",
        rawError: "TypeError: Cannot read properties of null (reading 'membershipPlanId')",
        affectedFile: "src/features/member-enrollment.tsx",
      }
    );

    // 1. Lifecycle Tracking
    expect(report.trackingStates).toContain("PROJECT_CREATED");
    expect(report.trackingStates).toContain("DEPENDENCIES_INSTALLED");
    expect(report.trackingStates).toContain("BUILD_PASSED");
    expect(report.trackingStates).toContain("RUNTIME_STARTED");
    expect(report.trackingStates).toContain("API_VERIFIED");
    expect(report.trackingStates).toContain("DATABASE_VERIFIED");
    expect(report.trackingStates).toContain("BROWSER_STARTED");
    expect(report.trackingStates).toContain("WORKFLOWS_VERIFIED");
    expect(report.trackingStates).toContain("REQUIREMENTS_VERIFIED");
    expect(report.trackingStates).toContain("SECURITY_VERIFIED");
    expect(report.trackingStates).toContain("PRODUCT_ACCEPTED");

    // 2. Self-Healing & Defect Repairs
    expect(report.repairsAttempted).toBe(1);
    expect(report.repairsSuccessful).toBe(1);

    // 3. Build & Runtime
    expect(report.buildReport.status).toBe("BUILD_PASSED");
    expect(report.runtimeReport.isAvailable).toBe(true);
    expect(report.runtimeReport.databaseConnected).toBe(true);

    // 4. API & Browser Workflows
    expect(report.apiReport.passed).toBe(true);
    expect(report.browserReport.passed).toBe(true);

    // 5. Requirement Reality Proofs
    expect(report.requirementProofs.length).toBe(7);
    expect(report.requirementProofs.every((r) => r.isFullyRealized)).toBe(true);

    // 6. Apex Acceptance & Tier 35 Certificate
    expect(report.acceptanceDecision.status).toBe("ACCEPTED");
    expect(report.acceptanceDecision.criticalDefectsRemaining).toBe(0);
    expect(report.certificate.gate).toBe("RealProductValidationGate");
    expect(report.certificate.tier).toBe(35);
    expect(report.certificate.status).toBe("CERTIFIED");
    expect(report.certificate.productAccepted).toBe(true);

    // 7. Cryptographic Ledger Chain Integrity
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);
  });
});
