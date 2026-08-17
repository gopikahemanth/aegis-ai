import { describe, it, expect } from "vitest";
import { EnterpriseRecoverySimulator } from "../enterprise-recovery-simulator.js";

describe("AEGIS Phase 30 — Enterprise Recovery Simulator", () => {
  it("simulates multi-project recovery with strictly ZERO mutations", () => {
    const sim = EnterpriseRecoverySimulator.simulateRecovery("REGIONAL_DATABASE_OUTAGE", ["proj_gym", "proj_auth"]);
    expect(sim.mutationsAttempted).toBe(0);
    expect(sim.isSimulationOnly).toBe(true);
    expect(sim.estimatedRTOSeconds).toBe(90);
  });
});
