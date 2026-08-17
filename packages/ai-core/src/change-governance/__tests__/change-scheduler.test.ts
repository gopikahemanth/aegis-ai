import { describe, it, expect } from "vitest";
import { ChangeScheduler } from "../change-scheduler.js";

describe("AEGIS Phase 34 — Change Scheduler", () => {
  it("authorizes immediate execution when all environmental prerequisites are satisfied", () => {
    const decision = ChangeScheduler.evaluateSchedule({
      changeId: "chg_1",
      hasActiveIncidents: false,
      isSloExhausted: false,
      isInMaintenanceWindow: true,
      concurrentChangesCount: 1,
    });

    expect(decision.decision).toBe("EXECUTE_NOW");
  });

  it("blocks execution if target environment has active incidents", () => {
    const decision = ChangeScheduler.evaluateSchedule({
      changeId: "chg_1",
      hasActiveIncidents: true,
      isSloExhausted: false,
      isInMaintenanceWindow: true,
      concurrentChangesCount: 1,
    });

    expect(decision.decision).toBe("BLOCK");
  });
});
