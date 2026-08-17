import { describe, it, expect } from "vitest";
import { KnowledgeDiscoveryEngine } from "../knowledge-discovery-engine.js";

describe("AEGIS Phase 41 — Knowledge Discovery Engine", () => {
  it("discovers candidate institutional knowledge from incident and recovery evidence", () => {
    const raw = "Production incident observed with database pool timeout and recovery rollback.";
    const discoveries = KnowledgeDiscoveryEngine.discoverKnowledge("org_global", "INCIDENT_REPORT", "inc_401", raw);

    expect(discoveries.length).toBeGreaterThanOrEqual(2);
    expect(discoveries.some((d) => d.classification === "INCIDENT_PATTERN")).toBe(true);
    expect(discoveries.some((d) => d.classification === "RECOVERY_PATTERN")).toBe(true);
    expect(discoveries[0].confidenceScore).toBeGreaterThanOrEqual(0.9);
  });
});
