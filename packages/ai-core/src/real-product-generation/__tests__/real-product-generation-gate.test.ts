import { describe, it, expect } from "vitest";
import { RealProductGenerationGate } from "../real-product-generation-gate.js";
import { RealProductAcceptanceEngine } from "../real-product-acceptance.js";
import { RealWorkflowExecutor } from "../real-workflow-executor.js";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 52 — Real Product Generation Gate", () => {
  it("issues Tier 39 certificate backed by real execution evidence", () => {
    ProductCompletionLedger.reset();
    const tmpDir = path.join(os.tmpdir(), "aegis-gate-test");
    fs.mkdirSync(tmpDir, { recursive: true });

    const acceptance = RealProductAcceptanceEngine.evaluate({
      requirementsCoverage: 100, criticalFeaturesPassed: true, criticalWorkflowsPassed: true,
      databaseVerified: true, backendVerified: true, frontendVerified: true,
      authenticationVerified: true, authorizationVerified: true, uiUxPassed: true,
      responsivePassed: true, accessibilityPassed: true, criticalDefectCount: 0,
    });
    const workflows = RealWorkflowExecutor.execute("GYM");
    const cert = RealProductGenerationGate.certify("AegisGymPro", tmpDir, acceptance, workflows, 2, 100);

    expect(cert.gate).toBe("RealProductGenerationGate");
    expect(cert.tier).toBe(39);
    expect(cert.status).toBe("ACCEPTED");
    expect(cert.evidence.workflowsExecuted).toBe(workflows.totalWorkflows);
    expect(cert.evidence.criticalDefects).toBe(0);
    expect(cert.evidence.featureCompleteness).toBe(100);
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
