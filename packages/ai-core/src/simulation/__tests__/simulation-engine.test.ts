import { describe, it, expect } from "vitest";
import { EngineeringSimulator } from "../engineering-simulator.js";

describe("AEGIS Phase 17 — Zero-Mutation What-If Simulation", () => {
  it("simulates schema change impact with strict 0 disk mutations and calculated risk score", () => {
    const sim = EngineeringSimulator.simulate("gym_proj", "SCHEMA_CHANGE", ["prisma/schema.prisma"]);
    expect(sim.diskMutations).toBe(0);
    expect(sim.predictedImpact).toBe("HIGH_RISK");
    expect(sim.riskScore).toBeGreaterThan(75);
    expect(sim.affectedContracts).toContain("DataContract");
  });

  it("simulates process restart with SAFE rating", () => {
    const sim = EngineeringSimulator.simulate("gym_proj", "PROCESS_RESTART");
    expect(sim.diskMutations).toBe(0);
    expect(sim.predictedImpact).toBe("SAFE");
  });
});
