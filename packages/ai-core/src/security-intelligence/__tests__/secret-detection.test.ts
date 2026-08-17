import { describe, it, expect } from "vitest";
import { SecretDetectionEngine } from "../secret-detection-engine.js";

describe("AEGIS Phase 58 — Secret Detection Engine", () => {
  it("scans codebase and bundles confirming zero exposed private credentials", () => {
    const report = SecretDetectionEngine.scanForSecrets();
    expect(report.isClean).toBe(true);
    expect(report.totalSecretsFound).toBe(0);
    expect(report.filesScannedCount).toBeGreaterThan(100);
  });

  it("detects and redacts exposed credentials in client bundles", () => {
    const report = SecretDetectionEngine.scanForSecrets({ simulateExposedSecret: true });
    expect(report.isClean).toBe(false);
    expect(report.totalSecretsFound).toBe(1);
    expect(report.findings[0].severity).toBe("CRITICAL");
    expect(report.findings[0].redactedValue).toContain("sk_live_51M");
    expect(report.findings[0].redactedValue).not.toContain("489a_unmasked");
  });
});
