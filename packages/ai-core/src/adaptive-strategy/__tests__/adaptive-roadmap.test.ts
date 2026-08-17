import { describe, it, expect, beforeEach } from "vitest";
import { AdaptiveRoadmapEngine } from "../adaptive-roadmap-engine.js";

describe("AEGIS Phase 25 — Adaptive Roadmap Engine", () => {
  beforeEach(() => {
    AdaptiveRoadmapEngine.reset();
  });

  it("publishes immutable versioned roadmaps preserving lineage history", () => {
    const v1 = AdaptiveRoadmapEngine.publishRoadmapVersion("org_alpha", [], "Initial baseline roadmap");
    expect(v1.version).toBe(1);
    expect(v1.parentVersion).toBeUndefined();

    const v2 = AdaptiveRoadmapEngine.publishRoadmapVersion("org_alpha", [], "Adaptive outcome rebalancing");
    expect(v2.version).toBe(2);
    expect(v2.parentVersion).toBe(1);

    const history = AdaptiveRoadmapEngine.getRoadmapHistory("org_alpha");
    expect(history.length).toBe(2);
  });
});
