import { describe, it, expect } from "vitest";
import { ProductScenarioRunner } from "../product-scenario-runner.js";
import { RequirementRealityChecker } from "../requirement-reality-checker.js";
import { RealBuildRunner } from "../real-build-runner.js";
import { RealRuntimeValidator } from "../real-runtime-validator.js";
import { RealApiWorkflowValidator } from "../real-api-workflow-validator.js";
import { RealBrowserWorkflowValidator } from "../real-browser-workflow-validator.js";
import { RealProductAcceptance } from "../real-product-acceptance.js";
import { ProductionEvidenceCollector } from "../production-evidence-collector.js";
import { RealProductValidationGate } from "../real-product-validation-gate.js";

describe("AEGIS Phase 47 — Real Product Validation Gate", () => {
  it("issues Tier 35 apex certificate for the actual generated product", async () => {
    const scenario = ProductScenarioRunner.getGymManagementScenario();
    const reqProofs = scenario.requirements.map((r) => RequirementRealityChecker.verifyRequirementReality(r, true));
    const build = RealBuildRunner.executeRealBuild();
    const runtime = await RealRuntimeValidator.validateRuntime(5173, 3001, true);
    const api = await RealApiWorkflowValidator.executeGymApiWorkflow();
    const browser = await RealBrowserWorkflowValidator.executeGymBrowserWorkflow();

    const decision = RealProductAcceptance.evaluateAcceptance(
      scenario.name,
      reqProofs,
      build,
      runtime,
      api,
      browser
    );

    const evidence = ProductionEvidenceCollector.collectEvidence(
      scenario.name,
      build,
      runtime,
      api,
      browser,
      reqProofs,
      decision
    );

    const cert = RealProductValidationGate.evaluateAndCertify(decision, evidence);

    expect(cert.gate).toBe("RealProductValidationGate");
    expect(cert.tier).toBe(35);
    expect(cert.status).toBe("CERTIFIED");
    expect(cert.productAccepted).toBe(true);
    expect(cert.requirementsVerified).toBe(true);
    expect(cert.browserWorkflowsVerified).toBe(true);
    expect(cert.criticalDefects).toBe(0);
  });
});
