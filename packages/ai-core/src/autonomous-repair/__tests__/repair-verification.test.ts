import { describe, it, expect } from "vitest";
import { RepairVerificationEngine } from "../repair-verification-engine.js";

describe("AEGIS Phase 57 — Repair Verification Engine", () => {
  it("verifies all 7 layers (Source, DB, Build, API, Runtime, Browser, Workflow)", () => {
    const report = RepairVerificationEngine.verifyRepair();
    expect(report.isFullyVerified).toBe(true);
    expect(report.bugNoLongerReproduces).toBe(true);
    expect(report.checks.length).toBe(7);
  });

  it("detects when the defect continues reproducing post-patch", () => {
    const report = RepairVerificationEngine.verifyRepair({ simulateVerificationFailure: true });
    expect(report.isFullyVerified).toBe(false);
    expect(report.bugNoLongerReproduces).toBe(false);
  });
});
