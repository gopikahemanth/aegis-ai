import { describe, it, expect } from "vitest";
import { ProductionSmokeTestEngine } from "../production-smoke-test-engine.js";

describe("AEGIS Phase 53 — Production Smoke Test Engine", () => {
  it("passes all 5 critical E2E workflows on the live application", () => {
    const r = ProductionSmokeTestEngine.run();
    expect(r.isAllPassed).toBe(true);
    expect(r.isAcceptanceBlocked).toBe(false);
    expect(r.passedTests).toBe(r.totalTests);
    expect(r.results.every((t) => t.isPassed)).toBe(true);
  });

  it("blocks acceptance when a critical workflow fails — HEALTH CHECK PASS ≠ BUSINESS WORKFLOW PASS", () => {
    const r = ProductionSmokeTestEngine.run("smoke_admin_login");
    const failed = r.results.find((t) => t.testId === "smoke_admin_login");
    expect(failed?.isPassed).toBe(false);
    expect(failed?.blocksAcceptance).toBe(true);
    expect(r.isAcceptanceBlocked).toBe(true);
    expect(r.isAllPassed).toBe(false);
  });
});
