import { describe, it, expect } from "vitest";
import { UniversalRequirementInterpreter } from "../universal-requirement-interpreter.js";
import { UniversalWorkflowEngine } from "../universal-workflow-engine.js";
import { UniversalRepairEngine } from "../universal-repair-engine.js";

describe("AEGIS Phase 48 — Universal Repair Engine", () => {
  it("diagnoses and self-heals workflow failures across any domain in bounded iterations", async () => {
    const spec = UniversalRequirementInterpreter.interpret("Build an e-commerce platform");
    const workflows = UniversalWorkflowEngine.compileWorkflows(spec);

    const repairResult = await UniversalRepairEngine.healWorkflow(
      workflows[0],
      {
        errorText: "HTTP 500: Missing transaction relation 'orderId' on Payment",
        targetFile: "prisma/schema.prisma",
      },
      3
    );

    expect(repairResult.isHealed).toBe(true);
    expect(repairResult.logs.length).toBe(1);
    expect(repairResult.logs[0].retestReport.passed).toBe(true);
  });
});
