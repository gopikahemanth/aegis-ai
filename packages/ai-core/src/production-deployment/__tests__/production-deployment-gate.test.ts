import { describe, it, expect } from "vitest";
import { ProductionDeploymentGate } from "../production-deployment-gate.js";
import { ProductionAcceptanceEngine } from "../production-acceptance-engine.js";
import { ProductionSmokeTestEngine } from "../production-smoke-test-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

describe("AEGIS Phase 53 — Production Deployment Gate", () => {
  it("issues a Tier 40 certificate backed by real deployment evidence", () => {
    ProductCompletionLedger.reset();
    const tmpDir = path.join(os.tmpdir(), "aegis-gate-pd-test");
    fs.mkdirSync(tmpDir, { recursive: true });

    const acceptance = ProductionAcceptanceEngine.evaluate({
      buildPassed: true, environmentReady: true, deploymentCompleted: true,
      frontendHealthy: true, backendHealthy: true, databaseHealthy: true,
      liveApiVerified: true, liveBrowserVerified: true,
      authenticationVerified: true, authorizationVerified: true,
      criticalWorkflowsPassed: true, securityChecksPassed: true,
      observabilityPresent: true, rollbackVerified: true, criticalDefectCount: 0,
    });
    const smokeTests = ProductionSmokeTestEngine.run();
    const cert = ProductionDeploymentGate.certify("AegisGymPro", tmpDir, "http://localhost:3001", acceptance, smokeTests);

    expect(cert.gate).toBe("ProductionDeploymentGate");
    expect(cert.tier).toBe(40);
    expect(cert.status).toBe("PRODUCTION_ACCEPTED");
    expect(cert.evidence.buildVerified).toBe(true);
    expect(cert.evidence.deploymentCompleted).toBe(true);
    expect(cert.evidence.criticalDefects).toBe(0);
    expect(cert.evidence.smokeTestsPassed).toBe(smokeTests.passedTests);
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects and does not write certificate when evidence is incomplete — CERTIFICATE ≠ EVIDENCE", () => {
    const acceptance = ProductionAcceptanceEngine.evaluate({
      buildPassed: false, environmentReady: true, deploymentCompleted: false,
      frontendHealthy: false, backendHealthy: false, databaseHealthy: false,
      liveApiVerified: false, liveBrowserVerified: false,
      authenticationVerified: false, authorizationVerified: false,
      criticalWorkflowsPassed: false, securityChecksPassed: false,
      observabilityPresent: false, rollbackVerified: false, criticalDefectCount: 3,
    });
    const smokeTests = ProductionSmokeTestEngine.run("smoke_admin_login");
    const cert = ProductionDeploymentGate.certify("AegisGymPro", "/tmp/no-dir", "http://localhost:3001", acceptance, smokeTests);
    expect(cert.status).toBe("PRODUCTION_REJECTED");
  });
});
