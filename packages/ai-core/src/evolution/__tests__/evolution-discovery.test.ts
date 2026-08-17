import { describe, it, expect } from "vitest";
import { EvolutionDiscoveryEngine } from "../evolution-discovery-engine.js";

describe("AEGIS Phase 35 — Evolution Discovery Engine", () => {
  it("discovers improvement opportunities from operational and architectural evidence", () => {
    const opps = EvolutionDiscoveryEngine.discoverOpportunities("proj_gym", 2, 65, 5);
    expect(opps.length).toBe(3);
    expect(opps.some((o) => o.type === "ARCHITECTURAL_IMPROVEMENT")).toBe(true);
    expect(opps.some((o) => o.type === "RELIABILITY_IMPROVEMENT")).toBe(true);
    expect(opps.some((o) => o.type === "TECHNICAL_DEBT_REDUCTION")).toBe(true);
  });
});
