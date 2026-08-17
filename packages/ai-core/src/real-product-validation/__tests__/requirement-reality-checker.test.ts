import { describe, it, expect } from "vitest";
import { ProductScenarioRunner } from "../product-scenario-runner.js";
import { RequirementRealityChecker } from "../requirement-reality-checker.js";

describe("AEGIS Phase 47 — Requirement Reality Checker", () => {
  it("proves operational reality across Source, API, Runtime, Browser, and DB instead of superficial file existence", () => {
    const scenario = ProductScenarioRunner.getGymManagementScenario();
    const req = scenario.requirements[2]; // Member enrollment

    const proof = RequirementRealityChecker.verifyRequirementReality(req, true);

    expect(proof.requirementId).toBe("REQ-003");
    expect(proof.sourceVerified).toBe(true);
    expect(proof.apiVerified).toBe(true);
    expect(proof.runtimeVerified).toBe(true);
    expect(proof.browserVerified).toBe(true);
    expect(proof.databaseVerified).toBe(true);
    expect(proof.isFullyRealized).toBe(true);
  });
});
