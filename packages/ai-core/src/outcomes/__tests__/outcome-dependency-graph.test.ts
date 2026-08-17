import { describe, it, expect, beforeEach } from "vitest";
import { OutcomeDependencyGraph } from "../outcome-dependency-graph.js";

describe("AEGIS Phase 24 — Outcome Dependency Graph", () => {
  beforeEach(() => {
    OutcomeDependencyGraph.reset();
  });

  it("registers and queries strategic outcome dependencies", () => {
    OutcomeDependencyGraph.addDependency({
      dependencyId: "dep_1",
      sourceOutcomeId: "out_db_scaling",
      targetOutcomeId: "out_api_uptime",
      relationshipType: "ENABLES",
    });

    const deps = OutcomeDependencyGraph.getDependencies("out_api_uptime");
    expect(deps.length).toBe(1);
    expect(deps[0].relationshipType).toBe("ENABLES");
  });
});
