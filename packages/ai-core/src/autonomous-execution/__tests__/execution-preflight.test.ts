import { describe, it, expect } from "vitest";
import { ExecutionPreflightEngine } from "../execution-preflight-engine.js";

describe("AEGIS Phase 33 — Execution Preflight Engine", () => {
  it("passes preflight when all environmental, rollback, and release prerequisites are healthy", () => {
    const res = ExecutionPreflightEngine.runPreflight({
      projectId: "proj_api",
      environment: "production",
      hasActiveIncidents: false,
      isSloBreached: false,
      hasRollbackPlan: true,
      isBackupFresh: true,
      hasDependencyFailures: false,
      isReleaseMatched: true,
    });

    expect(res.status).toBe("READY");
    expect(res.passed).toBe(true);
    expect(res.blockingFailures.length).toBe(0);
  });

  it("blocks execution if rollback is missing, backup is stale, or incidents are active", () => {
    const res = ExecutionPreflightEngine.runPreflight({
      projectId: "proj_api",
      environment: "production",
      hasActiveIncidents: true,
      isSloBreached: false,
      hasRollbackPlan: false,
      isBackupFresh: false,
      hasDependencyFailures: false,
      isReleaseMatched: true,
    });

    expect(res.status).toBe("BLOCKED");
    expect(res.passed).toBe(false);
    expect(res.blockingFailures.length).toBe(3);
  });
});
