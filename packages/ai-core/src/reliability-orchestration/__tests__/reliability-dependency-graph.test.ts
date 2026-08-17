import { describe, it, expect } from "vitest";
import { ReliabilityDependencyGraph } from "../reliability-dependency-graph.js";

describe("AEGIS Phase 30 — Reliability Dependency Graph", () => {
  it("identifies single points of failure and cascading blast radius", () => {
    const report = ReliabilityDependencyGraph.analyzeGraph("db_primary", [
      { sourceProject: "proj_gym", targetProject: "db_primary", dependencyType: "DATABASE", isCritical: true },
      { sourceProject: "proj_billing", targetProject: "db_primary", dependencyType: "DATABASE", isCritical: true },
      { sourceProject: "proj_auth", targetProject: "db_primary", dependencyType: "DATABASE", isCritical: true },
    ]);

    expect(report.isSinglePointOfFailure).toBe(true);
    expect(report.blastRadius).toBe("CRITICAL");
    expect(report.dependentCount).toBe(3);
  });
});
