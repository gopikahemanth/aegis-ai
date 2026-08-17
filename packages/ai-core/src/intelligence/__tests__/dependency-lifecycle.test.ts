import { describe, it, expect } from "vitest";
import { DependencyLifecycleManager } from "../dependency-lifecycle-manager.js";

describe("AEGIS Phase 16 — Dependency Lifecycle Intelligence", () => {
  it("classifies major version upgrade as MAJOR_BREAKING requiring authorization", () => {
    const plan = DependencyLifecycleManager.planUpgrade("express", "^4.19.2", "^5.0.0");
    expect(plan.risk).toBe("MAJOR_BREAKING");
    expect(plan.requiresAuthorization).toBe(true);
  });

  it("classifies security patch upgrade as SECURITY_CRITICAL", () => {
    const plan = DependencyLifecycleManager.planUpgrade("lodash", "^4.17.20", "^4.17.21", true);
    expect(plan.risk).toBe("SECURITY_CRITICAL");
  });
});
