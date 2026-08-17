import { describe, it, expect } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { ProductionInfrastructureGate } from "../production-infrastructure-gate.js";
import { InfrastructureAcceptanceEngine } from "../infrastructure-acceptance-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 54 — Production Infrastructure Gate", () => {
  it("issues Tier 41 certificate backed by 17-point evidence", () => {
    ProductCompletionLedger.reset();
    const tmpDir = path.join(os.tmpdir(), "aegis-gate-inf-test");
    fs.mkdirSync(tmpDir, { recursive: true });

    const acceptance = InfrastructureAcceptanceEngine.evaluate({
      planValid: true,
      hostingTargetReady: true,
      environmentConfigured: true,
      databaseHealthy: true,
      applicationRunning: true,
      frontendHealthy: true,
      backendHealthy: true,
      domainVerified: true,
      tlsVerified: true,
      publicAvailabilityVerified: true,
      liveApiVerified: true,
      liveBrowserVerified: true,
      monitoringPresent: true,
      backupReadinessVerified: true,
      securityChecksPassed: true,
      rollbackVerified: true,
      criticalDefectCount: 0,
    });

    const cert = ProductionInfrastructureGate.certify(
      "GymMaster Pro",
      tmpDir,
      "aegisgym.com",
      "https://aegisgym.com",
      "CLOUD",
      acceptance
    );

    expect(cert.gate).toBe("ProductionInfrastructureGate");
    expect(cert.tier).toBe(41);
    expect(cert.status).toBe("INFRASTRUCTURE_ACCEPTED");
    expect(cert.evidence.domainVerified).toBe(true);
    expect(cert.evidence.tlsVerified).toBe(true);
    expect(cert.evidence.publicAvailabilityVerified).toBe(true);
    expect(cert.evidence.backupReadinessVerified).toBe(true);
    expect(cert.evidence.criticalDefects).toBe(0);
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects certification when acceptance fails", () => {
    const acceptance = InfrastructureAcceptanceEngine.evaluate({
      planValid: false,
      hostingTargetReady: false,
      environmentConfigured: false,
      databaseHealthy: false,
      applicationRunning: false,
      frontendHealthy: false,
      backendHealthy: false,
      domainVerified: false,
      tlsVerified: false,
      publicAvailabilityVerified: false,
      liveApiVerified: false,
      liveBrowserVerified: false,
      monitoringPresent: false,
      backupReadinessVerified: false,
      securityChecksPassed: false,
      rollbackVerified: false,
      criticalDefectCount: 5,
    });

    const cert = ProductionInfrastructureGate.certify(
      "GymMaster Pro",
      "/tmp/no-dir",
      "aegisgym.com",
      "https://aegisgym.com",
      "LOCAL",
      acceptance
    );

    expect(cert.status).toBe("INFRASTRUCTURE_REJECTED");
  });
});
