import { describe, it, expect } from "vitest";
import { InputValidationSecurityEngine } from "../input-validation-security-engine.js";

describe("AEGIS Phase 58 — Input Validation Security Engine", () => {
  it("verifies server-side schema validation across all mutation routes", () => {
    const report = InputValidationSecurityEngine.auditInputValidation();
    expect(report.isInputValidationSecure).toBe(true);
    expect(report.totalEndpointsChecked).toBe(3);
  });

  it("detects missing server-side validation", () => {
    const report = InputValidationSecurityEngine.auditInputValidation({ simulateMissingServerValidation: true });
    expect(report.isInputValidationSecure).toBe(false);
  });
});
