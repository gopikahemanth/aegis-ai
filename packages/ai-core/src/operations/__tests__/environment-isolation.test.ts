import { describe, it, expect } from "vitest";
import { EnvironmentRegistry } from "../environment-registry.js";
import { ProductionStateManager } from "../production-state.js";

describe("AEGIS Phase 15 — Environment Isolation & State Management", () => {
  it("strictly prevents forbidden mutations across isolated environments", () => {
    const invalidCheck = EnvironmentRegistry.validateMutation("gym_proj", "canary", "SCHEMA_MIGRATION");
    expect(invalidCheck.valid).toBe(false);
    expect(invalidCheck.error).toContain("PROJECT_ENVIRONMENT_MISMATCH");

    const validCheck = EnvironmentRegistry.validateMutation("gym_proj", "production", "CODE_DEPLOY");
    expect(validCheck.valid).toBe(true);
  });

  it("maintains deterministic isolated production state per environment", () => {
    ProductionStateManager.reset();
    const prodState = ProductionStateManager.getState("gym_proj", "production");
    const stagingState = ProductionStateManager.getState("gym_proj", "staging");

    expect(prodState.environment).toBe("production");
    expect(stagingState.environment).toBe("staging");

    ProductionStateManager.updateState("gym_proj", "production", { currentReleaseId: "rel_100" });
    expect(ProductionStateManager.getState("gym_proj", "production").currentReleaseId).toBe("rel_100");
    expect(ProductionStateManager.getState("gym_proj", "staging").currentReleaseId).toBeUndefined();
  });
});
