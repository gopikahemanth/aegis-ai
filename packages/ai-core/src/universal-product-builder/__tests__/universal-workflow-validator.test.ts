import { describe, it, expect } from "vitest";
import { UniversalRequirementInterpreter } from "../universal-requirement-interpreter.js";
import { UniversalWorkflowEngine } from "../universal-workflow-engine.js";
import { UniversalWorkflowValidator } from "../universal-workflow-validator.js";

describe("AEGIS Phase 48 — Universal Workflow Validator", () => {
  it("executes multi-step business workflows dynamically and captures step results", async () => {
    const spec = UniversalRequirementInterpreter.interpret("Build an e-commerce platform");
    const workflows = UniversalWorkflowEngine.compileWorkflows(spec);

    const report = await UniversalWorkflowValidator.executeWorkflow(workflows[0]);
    expect(report.passed).toBe(true);
    expect(report.stepsExecuted.length).toBe(workflows[0].totalSteps);
  });
});
