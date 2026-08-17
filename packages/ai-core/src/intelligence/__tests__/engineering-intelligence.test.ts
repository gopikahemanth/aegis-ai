import { describe, it, expect } from "vitest";
import { EngineeringIntelligenceEngine } from "../engineering-intelligence-engine.js";
import { IncidentEngine } from "../../operations/incident-engine.js";
import { ReleaseLineageTracker } from "../../operations/release-lineage.js";

describe("AEGIS Phase 16 — Engineering Intelligence Engine", () => {
  it("correlates active incident with release lineage and produces evidence-backed insight", async () => {
    IncidentEngine.reset();
    ReleaseLineageTracker.reset();

    ReleaseLineageTracker.recordNode({
      generationId: "gen_1",
      projectId: "gym_proj",
      releaseId: "rel_101",
      createdAt: new Date().toISOString(),
      contractHashes: {},
      incidentIds: [],
      rolledBack: false,
    });

    IncidentEngine.createIncident(
      process.cwd(),
      "gym_proj",
      "production",
      "API_FAILURE",
      "HIGH",
      ["POST /api/members 500 error"]
    );

    const summary = await EngineeringIntelligenceEngine.analyzeProject("gym_proj", "production");
    expect(summary.insights.length).toBe(1);
    expect(summary.insights[0].introducedInRelease).toBe("rel_101");
    expect(summary.insights[0].confidence).toBeGreaterThan(0.9);
  });
});
