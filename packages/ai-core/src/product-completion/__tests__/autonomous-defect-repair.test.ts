import { describe, it, expect } from "vitest";
import { AutonomousDefectRepairEngine } from "../autonomous-defect-repair.js";

describe("AEGIS Phase 45 — Autonomous Defect Repair Engine", () => {
  it("diagnoses, repairs, and re-verifies defects in a bounded loop", () => {
    const repair = AutonomousDefectRepairEngine.executeRepairLoop(
      "Missing member route import in server/index.ts",
      ["server/index.ts"],
      true,
      3
    );

    expect(repair.isResolved).toBe(true);
    expect(repair.rolledBack).toBe(false);
    expect(repair.totalAttempts).toBe(1);
    expect(repair.attempts[0].simulationPassed).toBe(true);
  });
});
