import { describe, it, expect } from "vitest";
import { RecoveryPlanCompiler } from "../recovery-plan-compiler.js";

describe("AEGIS Phase 29 — Recovery Plan Compiler", () => {
  it("compiles verified recovery knowledge into verifiable steps", () => {
    const plan = RecoveryPlanCompiler.compilePlan("PRIMARY_DATABASE_OUTAGE");
    expect(plan.steps.length).toBe(4);
    expect(plan.requiresAuthorization).toBe(true);
    expect(plan.steps[0].isVerificationStep).toBe(true);
  });
});
