import { describe, it, expect } from "vitest";
import { RecoveryGameDayEngine } from "../recovery-game-day-engine.js";

describe("AEGIS Phase 28 — Recovery Game-Day Simulator (Zero-Mutation)", () => {
  it("executes game-day drill with guaranteed zero disk mutations", () => {
    const report = RecoveryGameDayEngine.runGameDay("Total Worker Fleet Loss", ["worker_pool_a", "worker_pool_b"]);
    expect(report.mutationsAttempted).toBe(0);
    expect(report.isSimulationOnly).toBe(true);
    expect(report.projectedDataLossBytes).toBe(0);
  });
});
