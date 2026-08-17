import { describe, it, expect } from "vitest";
import { RoadmapPlanningEngine } from "../roadmap-planning-engine.js";
import { PrioritizedRequirement } from "../requirement-prioritization-engine.js";

describe("AEGIS Phase 61 — Roadmap Planning Engine", () => {
  it("constructs machine-readable product roadmap with quarters, priority, and dependency relations", () => {
    const prioritized: PrioritizedRequirement[] = [
      {
        requirementId: "REQ-061",
        title: "Authorized Member Data Bulk Export",
        priorityTier: "P1_HIGH",
        userImpactScore: 92,
        businessValueScore: 96,
        implementationEffort: "LOW",
        riskScore: 10,
        rank: 1,
        rationale: "Aligns with OKR",
      },
    ];

    const roadmap = RoadmapPlanningEngine.planRoadmap("GymMaster Pro", prioritized);
    expect(roadmap.totalItems).toBeGreaterThanOrEqual(3);
    expect(roadmap.items[0].requirementId).toBe("REQ-061");
    expect(roadmap.items[0].quarter).toBe("Q1");
    expect(roadmap.items[0].status).toBe("PLANNED");
    expect(roadmap.items[0].authorizationStatus).toBe("AWAITING_AUTHORIZATION");
  });
});
