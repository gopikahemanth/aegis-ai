import { describe, it, expect } from "vitest";
import { ChangeDependencyEngine } from "../change-dependency-engine.js";

describe("AEGIS Phase 34 — Change Dependency Engine", () => {
  it("resolves safe ordering for dependent changes", () => {
    const res = ChangeDependencyEngine.analyzeDependencies([
      { changeId: "chg_db_migrate", dependsOnChangeIds: [] },
      { changeId: "chg_api_update", dependsOnChangeIds: ["chg_db_migrate"] },
    ]);

    expect(res.status).toBe("REQUIRES_ORDERING");
    expect(res.hasCircularDependency).toBe(false);
  });

  it("detects and blocks circular dependencies", () => {
    const res = ChangeDependencyEngine.analyzeDependencies([
      { changeId: "chg_a", dependsOnChangeIds: ["chg_b"] },
      { changeId: "chg_b", dependsOnChangeIds: ["chg_a"] },
    ]);

    expect(res.status).toBe("CIRCULAR_DEPENDENCY");
    expect(res.hasCircularDependency).toBe(true);
  });
});
