import { describe, it, expect } from "vitest";
import { PolicyIntegrityValidator } from "../policy-integrity-validator.js";

describe("AEGIS Phase 20 — Self-Security & Governance Policy Immutability", () => {
  it("validates that safety policies cannot be weakened by autonomous learning or optimization", () => {
    const report = PolicyIntegrityValidator.validatePolicyIntegrity({
      allowDestructiveWithoutAuth: true, // simulated corruption attempt
    });

    expect(report.status).toBe("VIOLATION_DETECTED");
    expect(report.immutablePoliciesPreserved).toBe(false);
    expect(report.violations.length).toBeGreaterThan(0);
  });

  it("passes cleanly when all governance invariants are strictly respected", () => {
    const report = PolicyIntegrityValidator.validatePolicyIntegrity();
    expect(report.status).toBe("VALID");
    expect(report.immutablePoliciesPreserved).toBe(true);
  });
});
