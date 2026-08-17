import { describe, it, expect } from "vitest";
import { UniversalRequirementInterpreter } from "../universal-requirement-interpreter.js";
import { UniversalRequirementRealityChecker } from "../universal-requirement-reality-checker.js";

describe("AEGIS Phase 48 — Universal Requirement Reality Checker", () => {
  it("proves operational reality across Source, API, Runtime, DB, Browser, and Workflow for universal features", () => {
    const spec = UniversalRequirementInterpreter.interpret("Build an LMS course platform");
    const feature = spec.features[0];

    const proof = UniversalRequirementRealityChecker.verifyRequirement(feature, true);
    expect(proof.status).toBe("VERIFIED");
    expect(proof.matrix.sourceExists).toBe(true);
    expect(proof.matrix.apiResponds).toBe(true);
    expect(proof.matrix.runtimeHealthy).toBe(true);
    expect(proof.matrix.databasePersisted).toBe(true);
    expect(proof.matrix.browserRendered).toBe(true);
    expect(proof.matrix.workflowProven).toBe(true);
  });
});
