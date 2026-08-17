import { describe, it, expect, beforeEach } from "vitest";
import { DependencyCoordinationEngine } from "../dependency-coordination.js";

describe("AEGIS Phase 22 — Dependency Coordination Engine", () => {
  beforeEach(() => {
    DependencyCoordinationEngine.reset();
  });

  it("identifies downstream impacted projects when upstream changes occur", () => {
    DependencyCoordinationEngine.registerDependency({
      dependencyId: "dep_1",
      sourceProjectId: "proj_api_core",
      targetProjectId: "proj_frontend_web",
      type: "API_CONTRACT",
      description: "Frontend consumes Core API",
    });

    const impacted = DependencyCoordinationEngine.getImpactedProjects("proj_api_core");
    expect(impacted).toContain("proj_frontend_web");
  });
});
