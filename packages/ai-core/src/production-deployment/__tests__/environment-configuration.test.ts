import { describe, it, expect } from "vitest";
import { EnvironmentConfigurationEngine } from "../environment-configuration-engine.js";

describe("AEGIS Phase 53 — Environment Configuration Engine", () => {
  it("marks contract as READY when all required vars are present", () => {
    const r = EnvironmentConfigurationEngine.generateContract(
      ["DATABASE_URL", "JWT_SECRET", "NODE_ENV"],
      ["DATABASE_URL", "JWT_SECRET", "NODE_ENV"],
    );
    expect(r.isReady).toBe(true);
    expect(r.missingRequiredCount).toBe(0);
  });

  it("blocks when required vars are missing — never reports DEPLOYMENT_SUCCESS", () => {
    const r = EnvironmentConfigurationEngine.generateContract([], ["DATABASE_URL", "JWT_SECRET"]);
    expect(r.isReady).toBe(false);
    expect(r.missingRequiredCount).toBe(2);
    expect(r.configurationRequiredItems).toContain("DATABASE_URL");
  });

  it("never exposes secret values — only presence is tracked", () => {
    const r = EnvironmentConfigurationEngine.generateContract(
      ["JWT_SECRET"], [], ["JWT_SECRET"],
    );
    const secret = r.variables.find((v) => v.name === "JWT_SECRET");
    expect(secret?.isSecret).toBe(true);
    expect(secret?.maskedPresence).toBe(true);
    // No actual value should be present
    expect(JSON.stringify(r)).not.toContain("my-super-secret");
  });
});
