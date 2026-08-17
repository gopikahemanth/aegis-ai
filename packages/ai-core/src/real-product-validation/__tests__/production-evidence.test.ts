import { describe, it, expect } from "vitest";
import { ProductScenarioRunner } from "../product-scenario-runner.js";
import { RequirementRealityChecker } from "../requirement-reality-checker.js";
import { RealBuildRunner } from "../real-build-runner.js";
import { RealRuntimeValidator } from "../real-runtime-validator.js";
import { RealApiWorkflowValidator } from "../real-api-workflow-validator.js";
import { RealBrowserWorkflowValidator } from "../real-browser-workflow-validator.js";
import { RealProductAcceptance } from "../real-product-acceptance.js";
import { ProductionEvidenceCollector } from "../production-evidence-collector.js";

describe("AEGIS Phase 47 — Production Evidence Collector", () => {
  it("consolidates multi-dimensional runtime evidence into cryptographically chained ledger entry", async () => {
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

    expect(evidence.productName).toBe(scenario.name);
    expect(evidence.cryptographicHash).toBeDefined();
    expect(evidence.apiVerification.passedCalls).toBe(7);
    expect(evidence.browserAssertions.passedSteps).toBe(7);
    expect(evidence.requirementsVerified.verified).toBe(7);
  });
});
