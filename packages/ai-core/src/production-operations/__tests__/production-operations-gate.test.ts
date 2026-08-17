import { describe, it, expect } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { ProductionOperationsGate } from "../production-operations-gate.js";
import { ProductionOperationsAcceptance } from "../production-operations-acceptance.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 55 — Production Operations Gate", () => {
  it("issues Tier 42 certificate backed by verified operational evidence", () => {
    ProductCompletionLedger.reset();
    const tmpDir = path.join(os.tmpdir(), "aegis-gate-ops-test");
    fs.mkdirSync(tmpDir, { recursive: true });

    const acceptance = ProductionOperationsAcceptance.evaluate({
      healthMonitoring: true,
      anomalyDetection: true,
      incidentDetection: true,
      diagnosis: true,
      remediationPlanning: true,
      authorizationBoundary: true,
      selfHealing: true,
      recoveryVerification: true,
      dependencyMonitoring: true,
      performanceMonitoring: true,
      sloTracking: true,
      incidentLedger: true,
      boundedRemediation: true,
      humanEscalation: true,
      criticalDefectCount: 0,
    });

    const cert = ProductionOperationsGate.certify("GymMaster Pro", tmpDir, "aegisgym.com", acceptance);

    expect(cert.gate).toBe("ProductionOperationsGate");
    expect(cert.tier).toBe(42);
    expect(cert.status).toBe("OPERATIONS_ACCEPTED");
    expect(cert.evidence.selfHealingVerified).toBe(true);
    expect(cert.evidence.recoveryVerified).toBe(true);
    expect(cert.evidence.criticalDefects).toBe(0);
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects certification when acceptance fails", () => {
    const acceptance = ProductionOperationsAcceptance.evaluate({
      healthMonitoring: false,
      anomalyDetection: false,
      incidentDetection: false,
      diagnosis: false,
      remediationPlanning: false,
      authorizationBoundary: false,
      selfHealing: false,
      recoveryVerification: false,
      dependencyMonitoring: false,
      performanceMonitoring: false,
      sloTracking: false,
      incidentLedger: false,
      boundedRemediation: false,
      humanEscalation: false,
      criticalDefectCount: 4,
    });

    const cert = ProductionOperationsGate.certify("GymMaster Pro", "/tmp/no-dir", "aegisgym.com", acceptance);
    expect(cert.status).toBe("OPERATIONS_REJECTED");
  });
});
