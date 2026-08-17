import { describe, it, expect } from "vitest";
import { ChangeRequestInterpreter } from "../change-request-interpreter.js";

describe("AEGIS Phase 56 — Change Request Interpreter", () => {
  it("translates user payment prompt into explicit, inferred, and assumed requirements", () => {
    const res = ChangeRequestInterpreter.interpret("Add online payments to my existing gym management website");
    expect(res.targetCapability).toContain("Payment");
    expect(res.requirements.length).toBeGreaterThanOrEqual(5);
    expect(res.explicitCount).toBeGreaterThan(0);
    expect(res.inferredCount).toBeGreaterThan(0);
    expect(res.requirements.some((r) => r.category === "DATABASE")).toBe(true);
  });
});
