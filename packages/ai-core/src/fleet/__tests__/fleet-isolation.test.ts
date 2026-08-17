import { describe, it, expect } from "vitest";
import { FleetManager } from "../fleet-manager.js";

describe("AEGIS Phase 16 — Fleet Multi-Project Registry & Isolation", () => {
  it("registers multiple isolated projects and computes aggregated fleet health", () => {
    FleetManager.reset();

    FleetManager.registerProject({
      projectId: "proj_a",
      name: "Project A",
      projectPath: "/path/to/a",
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production", "staging"],
    });

    FleetManager.registerProject({
      projectId: "proj_b",
      name: "Project B",
      projectPath: "/path/to/b",
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const fleetHealth = FleetManager.getFleetHealth();
    expect(fleetHealth.totalProjects).toBe(2);
    expect(fleetHealth.projects.length).toBe(2);
  });
});
