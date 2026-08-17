import { describe, it, expect, beforeEach } from "vitest";
import { ContinuousEvolutionRoadmap } from "../continuous-evolution-roadmap.js";

describe("AEGIS Phase 35 — Continuous Evolution Roadmap", () => {
  beforeEach(() => {
    ContinuousEvolutionRoadmap.reset();
  });

  it("publishes immutable, cryptographically chained versioned roadmaps", () => {
    const v1 = ContinuousEvolutionRoadmap.publishVersion([
      { itemId: "item_1", opportunityId: "opp_1", horizon: "NOW", title: "Decouple Gateway", targetQuarter: "Q3 2026" },
      { itemId: "item_2", opportunityId: "opp_2", horizon: "NEXT", title: "Circuit Breakers", targetQuarter: "Q4 2026" },
    ]);

    expect(v1.versionId).toBe("roadmap_v1");
    expect(v1.previousVersionHash).toBe("GENESIS_ROADMAP_HASH");
    expect(v1.currentVersionHash).toBeDefined();

    const v2 = ContinuousEvolutionRoadmap.publishVersion([
      { itemId: "item_1", opportunityId: "opp_1", horizon: "NOW", title: "Decouple Gateway", targetQuarter: "Q3 2026" },
      { itemId: "item_2", opportunityId: "opp_2", horizon: "NOW", title: "Circuit Breakers", targetQuarter: "Q3 2026" },
      { itemId: "item_3", opportunityId: "opp_3", horizon: "NEXT", title: "Event Streaming", targetQuarter: "Q4 2026" },
    ]);

    expect(v2.versionId).toBe("roadmap_v2");
    expect(v2.previousVersionHash).toBe(v1.currentVersionHash);
  });
});
