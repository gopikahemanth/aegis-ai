import { describe, it, expect } from "vitest";
import { PrivacyDataflowEngine } from "../privacy-dataflow-engine.js";

describe("AEGIS Phase 58 — Privacy Dataflow Engine", () => {
  it("maps sensitive data lifecycle and ensures zero unencrypted credential leakage", () => {
    const report = PrivacyDataflowEngine.auditDataflow();
    expect(report.isPrivacyCompliant).toBe(true);
    expect(report.nodes.length).toBeGreaterThanOrEqual(3);
    expect(report.totalSensitiveFieldsTracked).toBeGreaterThanOrEqual(6);
    expect(report.gdprCcpaReadiness).toBe(true);
  });
});
