import { describe, it, expect } from "vitest";
import { InnovationDiscoveryEngine } from "../innovation-discovery-engine.js";

describe("AEGIS Phase 40 — Innovation Discovery Engine", () => {
  it("discovers engineering innovation opportunities from bottlenecks and technical debt", () => {
    const opps = InnovationDiscoveryEngine.discoverOpportunities("proj_gym", 65, 2, 0.25);
    expect(opps.length).toBeGreaterThanOrEqual(2);
    expect(opps.some((o) => o.source === "PERFORMANCE_BOTTLENECK")).toBe(true);
    expect(opps.some((o) => o.source === "ARCHITECTURE_IMPROVEMENT")).toBe(true);
    expect(opps[0].confidenceScore).toBeGreaterThanOrEqual(0.9);
  });
});
