import { describe, it, expect } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { ProductEvolutionGate } from "../product-evolution-gate.js";
import { ProductEvolutionAcceptance } from "../product-evolution-acceptance.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 56 — Product Evolution Gate", () => {
  it("issues Tier 43 certificate backed by complete verified evolution evidence", () => {
    ProductCompletionLedger.reset();
    const tmpDir = path.join(os.tmpdir(), "aegis-gate-evo-test");
    fs.mkdirSync(tmpDir, { recursive: true });

    const acceptance = ProductEvolutionAcceptance.evaluate({
      changeRequirementsSatisfied: true,
      newFeaturesVerified: true,
      affectedFeaturesVerified: true,
      databaseEvolutionPassed: true,
      backendEvolutionPassed: true,
      frontendEvolutionPassed: true,
      authVerified: true,
      uiConsistencyPassed: true,
      businessWorkflowsPassed: true,
      regressionTestsPassed: true,
      liveVerificationPassed: true,
      repairSuccessful: true,
      criticalDefectCount: 0,
    });

    const cert = ProductEvolutionGate.certify(
      "GymMaster Pro",
      tmpDir,
      "Add online payments",
      acceptance
    );

    expect(cert.gate).toBe("ProductEvolutionGate");
    expect(cert.tier).toBe(43);
    expect(cert.status).toBe("EVOLUTION_ACCEPTED");
    expect(cert.evidence.changeRequirementsVerified).toBe(true);
    expect(cert.evidence.newFeaturesVerified).toBe(true);
    expect(cert.evidence.regressionVerified).toBe(true);
    expect(cert.evidence.criticalDefects).toBe(0);
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects certification when acceptance fails", () => {
    const acceptance = ProductEvolutionAcceptance.evaluate({
      changeRequirementsSatisfied: false,
      newFeaturesVerified: false,
      affectedFeaturesVerified: false,
      databaseEvolutionPassed: false,
      backendEvolutionPassed: false,
      frontendEvolutionPassed: false,
      authVerified: false,
      uiConsistencyPassed: false,
      businessWorkflowsPassed: false,
      regressionTestsPassed: false,
      liveVerificationPassed: false,
      repairSuccessful: false,
      criticalDefectCount: 3,
    });

    const cert = ProductEvolutionGate.certify(
      "GymMaster Pro",
      "/tmp/no-dir",
      "Add online payments",
      acceptance
    );

    expect(cert.status).toBe("EVOLUTION_REJECTED");
  });
});
