import { describe, it, expect, beforeEach } from "vitest";
import { DisasterRecoveryEngine } from "../disaster-recovery-engine.js";

describe("AEGIS Phase 27 — Disaster Recovery Engine", () => {
  beforeEach(() => {
    DisasterRecoveryEngine.reset();
  });

  it("tracks RPO, RTO, and backup freshness for projects", () => {
    DisasterRecoveryEngine.updateStatus({
      projectId: "proj_core",
      rpoSeconds: 30,
      rtoMinutes: 2,
      backupFreshnessMinutes: 5,
      status: "READY",
      lastVerifiedAt: new Date().toISOString(),
    });

    const status = DisasterRecoveryEngine.getStatus("proj_core");
    expect(status.status).toBe("READY");
    expect(status.rpoSeconds).toBe(30);
  });
});
