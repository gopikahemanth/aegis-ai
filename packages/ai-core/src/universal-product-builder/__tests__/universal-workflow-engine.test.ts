import { describe, it, expect } from "vitest";
import { UniversalRequirementInterpreter } from "../universal-requirement-interpreter.js";
import { UniversalWorkflowEngine } from "../universal-workflow-engine.js";

describe("AEGIS Phase 48 — Universal Workflow Engine", () => {
  it("compiles multi-step executable business workflows from domain specifications", () => {
    const spec = UniversalRequirementInterpreter.interpret("Build an e-commerce platform with cart and checkout");
    const workflows = UniversalWorkflowEngine.compileWorkflows(spec);

    expect(workflows.length).toBeGreaterThanOrEqual(1);
    expect(workflows[0].steps.length).toBeGreaterThanOrEqual(2);
    expect(workflows[0].steps[0].description).toBeDefined();
  });
});
