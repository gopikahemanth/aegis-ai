import { describe, it, expect } from "vitest";
import { AutonomousRecoveryExecutor } from "../autonomous-recovery-executor.js";

describe("AEGIS Phase 29 — Autonomous Recovery Executor", () => {
  it("blocks unapproved destructive actions and executes safe authorized actions", () => {
    const unapproved = AutonomousRecoveryExecutor.executePlan("proj_core", "plan_db_failover", false, false);
    expect(unapproved.status).toBe("AWAITING_AUTHORIZATION");

    const approved = AutonomousRecoveryExecutor.executePlan("proj_core", "plan_db_failover", true, false);
    expect(approved.status).toBe("SUCCEEDED");
  });
});
