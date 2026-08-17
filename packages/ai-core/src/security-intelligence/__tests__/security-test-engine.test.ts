import { describe, it, expect } from "vitest";
import { SecurityTestEngine } from "../security-test-engine.js";

describe("AEGIS Phase 58 — Security Test Engine", () => {
  it("executes automated security test suite and validates all assertions", () => {
    const report = SecurityTestEngine.runSecurityTests();
    expect(report.isAllPassed).toBe(true);
    expect(report.totalTests).toBe(5);
    expect(report.failedTests).toBe(0);
  });

  it("detects security test failures cleanly", () => {
    const report = SecurityTestEngine.runSecurityTests({ simulateFailureInTest: true });
    expect(report.isAllPassed).toBe(false);
    expect(report.failedTests).toBeGreaterThan(0);
  });
});
