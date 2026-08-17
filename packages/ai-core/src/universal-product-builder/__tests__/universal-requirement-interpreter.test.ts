import { describe, it, expect } from "vitest";
import { UniversalRequirementInterpreter } from "../universal-requirement-interpreter.js";

describe("AEGIS Phase 48 — Universal Requirement Interpreter", () => {
  it("interprets arbitrary requirements into structured specifications with origin tags", () => {
    const spec = UniversalRequirementInterpreter.interpret(
      "Build an online learning platform with student courses, lessons, and assignments"
    );

    expect(spec.domain).toBe("EDUCATION");
    expect(spec.users.some((u) => u.role === "STUDENT")).toBe(true);
    expect(spec.features.length).toBeGreaterThanOrEqual(4);
    expect(spec.features.some((f) => f.origin === "EXPLICIT")).toBe(true);
    expect(spec.features.some((f) => f.origin === "ASSUMED")).toBe(true);
    expect(spec.workflows.length).toBeGreaterThanOrEqual(1);
  });
});
