import { describe, it, expect } from "vitest";
import { FeatureDependencyEngine } from "../feature-dependency-engine.js";

describe("AEGIS Phase 51 — Feature Dependency Engine", () => {
  it("blocks downstream features until prerequisite capabilities are satisfied", () => {
    const graph = FeatureDependencyEngine.buildDependencyGraph(["User Authentication", "Admin Dashboard", "Reports"]);

    expect(graph.find((n) => n.name === "User Authentication")?.status).toBe("READY");
    expect(graph.find((n) => n.name === "Admin Dashboard")?.status).toBe("BLOCKED_BY_DEPENDENCY");

    const resolved = FeatureDependencyEngine.resolveGraph(graph, ["feat_auth"]);
    expect(resolved.find((n) => n.name === "Admin Dashboard")?.status).toBe("READY");
  });
});
