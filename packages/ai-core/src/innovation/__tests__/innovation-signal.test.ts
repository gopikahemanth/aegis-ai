import { describe, it, expect } from "vitest";
import { InnovationSignalEngine } from "../innovation-signal-engine.js";

describe("AEGIS Phase 36 — Innovation Signal Engine", () => {
  it("discovers innovation signals from verified telemetry and operational evidence", () => {
    const signals = InnovationSignalEngine.discoverSignals("proj_gym", 8, 3, 0.25);
    expect(signals.length).toBe(3);
    expect(signals.some((s) => s.type === "CUSTOMER_DEMAND")).toBe(true);
    expect(signals.some((s) => s.type === "PERFORMANCE_OPPORTUNITY")).toBe(true);
    expect(signals.some((s) => s.type === "COST_OPPORTUNITY")).toBe(true);
  });
});
