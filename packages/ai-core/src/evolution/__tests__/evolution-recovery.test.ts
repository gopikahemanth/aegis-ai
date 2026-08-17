import { describe, it, expect } from "vitest";
import { EvolutionRecoveryEngine } from "../evolution-recovery-engine.js";

describe("AEGIS Phase 39 — Evolution Recovery Engine", () => {
  it("executes verified rollback and checkpoint restoration upon failure", () => {
    const report = EvolutionRecoveryEngine.executeRecovery(
      "evol_failed_1",
      "proj_gym",
      "chk_good_baseline",
      "ROLLBACK"
    );

    expect(report.recoveryId).toBeDefined();
    expect(report.recoveryVerified).toBe(true);
    expect(report.actionTaken).toBe("ROLLBACK");
    expect(report.checkpointId).toBe("chk_good_baseline");
  });
});
