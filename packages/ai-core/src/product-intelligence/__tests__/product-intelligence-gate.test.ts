import { describe, it, expect } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { ProductIntelligenceGate } from "../product-intelligence-gate.js";
import { ImprovementVerificationEngine } from "../improvement-verification-engine.js";
import { ImprovementImpactEngine } from "../improvement-impact-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 60 — Product Intelligence Gate", () => {
  it("issues Tier 47 certificate backed by verified continuous improvement evidence", () => {
    ProductCompletionLedger.reset();
    const tmpDir = path.join(os.tmpdir(), "aegis-intel-gate-test");
    fs.mkdirSync(tmpDir, { recursive: true });

    const verification = ImprovementVerificationEngine.verifyImprovement();
    const impact = ImprovementImpactEngine.measureImpact();

    const cert = ProductIntelligenceGate.certify(
      "GymMaster Pro",
      tmpDir,
      verification,
      impact
    );

    expect(cert.gate).toBe("ProductIntelligenceGate");
    expect(cert.tier).toBe(47);
    expect(cert.status).toBe("IMPROVEMENT_ACCEPTED");
    expect(cert.evidence.problemVerified).toBe(true);
    expect(cert.evidence.conversionUpliftPercent).toBe(12);
    expect(cert.evidence.regressionDetected).toBe(false);
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects certification when verification fails", () => {
    const verification = ImprovementVerificationEngine.verifyImprovement({
      simulateVerificationRegression: true,
    });
    const impact = ImprovementImpactEngine.measureImpact();

    const cert = ProductIntelligenceGate.certify(
      "GymMaster Pro",
      "/tmp/no-dir",
      verification,
      impact,
      { hasRegression: true }
    );

    expect(cert.status).toBe("IMPROVEMENT_REJECTED");
  });
});
