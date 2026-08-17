import { describe, it, expect } from "vitest";
import { ProductScenarioRunner } from "../product-scenario-runner.js";
import { RequirementRealityChecker } from "../requirement-reality-checker.js";
import { RealBuildRunner } from "../real-build-runner.js";
import { RealRuntimeValidator } from "../real-runtime-validator.js";
import { RealApiWorkflowValidator } from "../real-api-workflow-validator.js";
import { RealBrowserWorkflowValidator } from "../real-browser-workflow-validator.js";
import { RealProductAcceptance } from "../real-product-acceptance.js";

describe("AEGIS Phase 47 — Real Product Acceptance", () => {
  it("strictly enforces acceptance rules: requires 100% requirements + 100% workflows + 0 critical defects", async () => {
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

    expect(decision.status).toBe("ACCEPTED");
    expect(decision.requirementsScore.percentage).toBe(100);
    expect(decision.buildPassed).toBe(true);
    expect(decision.runtimePassed).toBe(true);
    expect(decision.apiPassed).toBe(true);
    expect(decision.databasePassed).toBe(true);
    expect(decision.browserPassed).toBe(true);
    expect(decision.criticalDefectsRemaining).toBe(0);
  });
});
