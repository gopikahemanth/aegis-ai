import { describe, it, expect } from "vitest";
import { UniversalRequirementInterpreter } from "../universal-requirement-interpreter.js";
import { UniversalRequirementRealityChecker } from "../universal-requirement-reality-checker.js";
import { UniversalWorkflowEngine } from "../universal-workflow-engine.js";
import { UniversalWorkflowValidator } from "../universal-workflow-validator.js";
import { UniversalProductAcceptanceEngine } from "../universal-product-acceptance.js";

describe("AEGIS Phase 48 — Universal Product Acceptance Engine", () => {
  it("strictly accepts universal products when 100% requirements and workflows pass with 0 critical defects", async () => {
    const spec = UniversalRequirementInterpreter.interpret("Build an LMS course platform");
    const reqProofs = spec.features.map((f) => UniversalRequirementRealityChecker.verifyRequirement(f, true));
    const workflows = UniversalWorkflowEngine.compileWorkflows(spec);
    const wfReports = await Promise.all(workflows.map((w) => UniversalWorkflowValidator.executeWorkflow(w)));

    const acceptance = UniversalProductAcceptanceEngine.evaluate(
      spec,
      reqProofs,
      wfReports,
      true, // build
      true, // runtime
      true, // api
      true, // db
      true  // browser
    );

    expect(acceptance.isAccepted).toBe(true);
    expect(acceptance.requirementsScore.percentage).toBe(100);
    expect(acceptance.workflowsScore.percentage).toBe(100);
    expect(acceptance.criticalDefects).toBe(0);
  });
});
