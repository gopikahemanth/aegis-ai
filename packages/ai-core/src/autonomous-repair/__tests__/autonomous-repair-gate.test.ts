import { describe, it, expect } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { AutonomousRepairGate } from "../autonomous-repair-gate.js";
import { RepairAcceptanceEngine } from "../repair-acceptance-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 57 — Autonomous Repair Gate", () => {
  it("issues Tier 44 certificate when acceptance is complete with 0 defects", () => {
    ProductCompletionLedger.reset();
    const tmpDir = path.join(os.tmpdir(), "aegis-repair-gate-test");
    fs.mkdirSync(tmpDir, { recursive: true });

    const acceptance = RepairAcceptanceEngine.evaluate({
      failureReproduced: true,
      rootCauseIdentified: true,
      repairApplied: true,
      bugNoLongerReproduces: true,
      buildPasses: true,
      regressionTestsPass: true,
      affectedWorkflowsPass: true,
      browserVerificationPasses: true,
      liveVerificationPasses: true,
      criticalDefects: 0,
    });

    const cert = AutonomousRepairGate.certify(
      "GymMaster Pro",
      tmpDir,
      "Payments are broken. Fix them.",
      acceptance
    );

    expect(cert.gate).toBe("AutonomousRepairGate");
    expect(cert.tier).toBe(44);
    expect(cert.status).toBe("REPAIR_ACCEPTED");
    expect(cert.evidence.failureReproduced).toBe(true);
    expect(cert.evidence.rootCauseVerified).toBe(true);
    expect(cert.evidence.criticalDefects).toBe(0);
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects certification when acceptance criteria fail", () => {
    const acceptance = RepairAcceptanceEngine.evaluate({
      failureReproduced: false,
      rootCauseIdentified: false,
      repairApplied: false,
      bugNoLongerReproduces: false,
      buildPasses: false,
      regressionTestsPass: false,
      affectedWorkflowsPass: false,
      browserVerificationPasses: false,
      liveVerificationPasses: false,
      criticalDefects: 2,
    });

    const cert = AutonomousRepairGate.certify(
      "GymMaster Pro",
      "/tmp/no-dir",
      "Bug",
      acceptance
    );

    expect(cert.status).toBe("REPAIR_REJECTED");
  });
});
