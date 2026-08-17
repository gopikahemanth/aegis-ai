import { describe, it, expect } from "vitest";
import { ProductChangeVerification } from "../product-change-verification.js";

describe("AEGIS Phase 56 — Product Change Verification", () => {
  it("verifies full 7-layer execution (Source, DB, API, Runtime, Browser, Workflow, Integration)", () => {
    const report = ProductChangeVerification.verifyExecution();
    expect(report.isFullyVerified).toBe(true);
    expect(report.layers).toHaveLength(7);
    expect(report.paymentWorkflowPassed).toBe(true);
    expect(report.existingAttendanceWorkflowPassed).toBe(true);
  });

  it("detects workflow defect when payment fails to activate membership", () => {
    const report = ProductChangeVerification.verifyExecution({ simulateWorkflowDefect: true });
    expect(report.isFullyVerified).toBe(false);
    expect(report.paymentWorkflowPassed).toBe(false);
  });
});
