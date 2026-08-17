import { describe, it, expect } from "vitest";
import { RequirementInterpreter } from "../requirement-interpreter.js";

describe("AEGIS Phase 46 — Requirement Interpreter", () => {
  it("converts natural-language requirement into classified specs with derivation flags", () => {
    const specs = RequirementInterpreter.interpretPrompt(
      "Build me a complete gym management website with authentication, dashboard, members, trainers, payments, attendance and admin panel."
    );

    expect(specs.length).toBeGreaterThanOrEqual(7);

    const authReq = specs.find((s) => s.category === "AUTHENTICATION");
    expect(authReq).toBeDefined();
    expect(authReq?.derivation).toBe("EXPLICIT");

    const dbReq = specs.find((s) => s.category === "DATABASE");
    expect(dbReq).toBeDefined();
    expect(dbReq?.derivation).toBe("ASSUMED");

    const memberReq = specs.find((s) => s.title.includes("Member"));
    expect(memberReq).toBeDefined();
    expect(memberReq?.isCritical).toBe(true);
  });
});
