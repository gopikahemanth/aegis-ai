import { describe, it, expect } from "vitest";
import { ReleaseLineageTracker } from "../release-lineage.js";

describe("AEGIS Phase 15 — Release Lineage Tree", () => {
  it("tracks generation lineage from G1 to G2 with parent links", () => {
    ReleaseLineageTracker.reset();

    ReleaseLineageTracker.recordNode({
      generationId: "gen_g1",
      projectId: "gym_proj",
      releaseId: "rel_101",
      createdAt: new Date().toISOString(),
      contractHashes: { architectureHash: "arch_1" },
      incidentIds: [],
      rolledBack: false,
    });

    ReleaseLineageTracker.recordNode({
      generationId: "gen_g2",
      parentGenerationId: "gen_g1",
      projectId: "gym_proj",
      releaseId: "rel_102",
      createdAt: new Date().toISOString(),
      contractHashes: { architectureHash: "arch_1" },
      incidentIds: [],
      rolledBack: false,
    });

    const lineage = ReleaseLineageTracker.getLineage("gym_proj");
    expect(lineage.length).toBe(2);
    expect(lineage[1].parentGenerationId).toBe("gen_g1");
  });
});
