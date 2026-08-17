import { describe, it, expect } from "vitest";
import { StrategicRoadmapEngine } from "../roadmap-engine.js";
import type { StrategicInitiative } from "../strategic-initiative.js";

describe("AEGIS Phase 23 — Strategic Roadmap Engine", () => {
  it("organizes initiatives across multi-generation planning horizons (NOW, NEXT, LATER, FUTURE)", () => {
    const initiatives: StrategicInitiative[] = [
      {
        initiativeId: "init_1",
        organizationId: "org_global",
        name: "Security Zero-Day Patching",
        description: "Patch critical vuln",
        businessObjective: "Security",
        affectedProjects: ["proj_1"],
        priorityClass: "CRITICAL",
        status: "APPROVED",
        createdAt: new Date().toISOString(),
      },
      {
        initiativeId: "init_2",
        organizationId: "org_global",
        name: "API v3 Migration",
        description: "Migrate REST to GraphQL",
        businessObjective: "Modernization",
        affectedProjects: ["proj_1", "proj_2"],
        priorityClass: "HIGH",
        status: "PLANNED",
        createdAt: new Date().toISOString(),
      },
    ];

    const roadmap = StrategicRoadmapEngine.generateRoadmap("org_global", initiatives);
    expect(roadmap.horizons.find((h) => h.horizon === "NOW")?.initiatives.length).toBe(1);
    expect(roadmap.horizons.find((h) => h.horizon === "NEXT")?.initiatives.length).toBe(1);
  });
});
