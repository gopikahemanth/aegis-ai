import { describe, it, expect } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { SecurityIntelligenceGate } from "../security-intelligence-gate.js";
import { SecurityAcceptanceEngine } from "../security-acceptance-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 58 — Security Intelligence Gate", () => {
  it("issues Tier 45 certificate backed by verifiable security evidence", () => {
    ProductCompletionLedger.reset();
    const tmpDir = path.join(os.tmpdir(), "aegis-security-gate-test");
    fs.mkdirSync(tmpDir, { recursive: true });

    const acceptance = SecurityAcceptanceEngine.evaluate({
      attackSurfaceAnalyzed: true,
      authenticationVerified: true,
      authorizationVerified: true,
      apiSecurityVerified: true,
      databaseSecurityVerified: true,
      inputValidationVerified: true,
      secretsScanPassed: true,
      dependencySecurityVerified: true,
      webSecurityVerified: true,
      privacyVerified: true,
      securityTestsPassed: true,
      repairsVerified: true,
      productionSecurityVerified: true,
      criticalVulnerabilitiesCount: 0,
    });

    const cert = SecurityIntelligenceGate.certify(
      "GymMaster Pro",
      tmpDir,
      acceptance
    );

    expect(cert.gate).toBe("SecurityIntelligenceGate");
    expect(cert.tier).toBe(45);
    expect(cert.status).toBe("SECURITY_ACCEPTED");
    expect(cert.evidence.attackSurfaceVerified).toBe(true);
    expect(cert.evidence.authorizationVerified).toBe(true);
    expect(cert.evidence.criticalVulnerabilities).toBe(0);
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects certification when security acceptance criteria fail", () => {
    const acceptance = SecurityAcceptanceEngine.evaluate({
      attackSurfaceAnalyzed: false,
      authenticationVerified: false,
      authorizationVerified: false,
      apiSecurityVerified: false,
      databaseSecurityVerified: false,
      inputValidationVerified: false,
      secretsScanPassed: false,
      dependencySecurityVerified: false,
      webSecurityVerified: false,
      privacyVerified: false,
      securityTestsPassed: false,
      repairsVerified: false,
      productionSecurityVerified: false,
      criticalVulnerabilitiesCount: 3,
    });

    const cert = SecurityIntelligenceGate.certify(
      "GymMaster Pro",
      "/tmp/no-dir",
      acceptance
    );

    expect(cert.status).toBe("SECURITY_REJECTED");
  });
});
