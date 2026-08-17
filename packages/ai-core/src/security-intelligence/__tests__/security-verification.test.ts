import { describe, it, expect } from "vitest";
import { SecurityVerificationEngine } from "../security-verification-engine.js";
import { SecurityRepairEngine } from "../security-repair-engine.js";
import { VulnerabilityDiagnosisEngine } from "../vulnerability-diagnosis-engine.js";

describe("AEGIS Phase 58 — Security Verification Engine", () => {
  it("verifies elimination of vulnerabilities across all 8 system layers", async () => {
    const diagnosis = VulnerabilityDiagnosisEngine.diagnoseVulnerabilities({
      includeDeliberateVulnerabilities: true,
    });
    const repairReport = await SecurityRepairEngine.repairVulnerabilities(diagnosis);
    const verification = SecurityVerificationEngine.verifyRepairs(repairReport);

    expect(verification.isFullyVerified).toBe(true);
    expect(verification.layers).toHaveLength(8);
    expect(verification.authorizationVerified).toBe(true);
    expect(verification.secretsEliminated).toBe(true);
  });

  it("detects when authorization check still fails post-repair", async () => {
    const diagnosis = VulnerabilityDiagnosisEngine.diagnoseVulnerabilities();
    const repairReport = await SecurityRepairEngine.repairVulnerabilities(diagnosis);
    const verification = SecurityVerificationEngine.verifyRepairs(repairReport, {
      simulateVerificationFailure: true,
    });

    expect(verification.isFullyVerified).toBe(false);
    expect(verification.authorizationVerified).toBe(false);
  });
});
