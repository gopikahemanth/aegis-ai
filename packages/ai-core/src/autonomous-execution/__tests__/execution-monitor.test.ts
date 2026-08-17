import { describe, it, expect } from "vitest";
import { ExecutionMonitor } from "../execution-monitor.js";

describe("AEGIS Phase 33 — Execution Monitor", () => {
  it("tracks execution health, duration, and CPU load", () => {
    const health = ExecutionMonitor.assessHealth("exec_1", 2500, 30000, 0, 45);
    expect(health.status).toBe("HEALTHY");
    expect(health.isTimedOut).toBe(false);
  });

  it("marks execution as FAILED if duration exceeds timeout threshold or incidents occur", () => {
    const health = ExecutionMonitor.assessHealth("exec_1", 35000, 30000, 0, 45);
    expect(health.status).toBe("FAILED");
    expect(health.isTimedOut).toBe(true);
  });
});
