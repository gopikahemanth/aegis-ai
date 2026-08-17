import { describe, it, expect } from "vitest";
import { EnvironmentProvisioningEngine } from "../environment-provisioning-engine.js";

describe("AEGIS Phase 54 — Environment Provisioning Engine", () => {
  it("provisions environment variables and tracks secret masking", () => {
    const res = EnvironmentProvisioningEngine.provision();
    expect(res.isConfigured).toBe(true);
    expect(res.missingCount).toBe(0);
    expect(res.invalidCount).toBe(0);

    const dbVar = res.variables.find((v) => v.key === "DATABASE_URL");
    expect(dbVar?.isSecret).toBe(true);
    expect(dbVar?.maskedPresence).toBe(true);
  });

  it("detects invalid environment variable values", () => {
    const res = EnvironmentProvisioningEngine.provision(undefined, "JWT_SECRET");
    expect(res.isConfigured).toBe(false);
    expect(res.invalidCount).toBe(1);
    expect(res.variables.find((v) => v.key === "JWT_SECRET")?.state).toBe("INVALID");
  });
});
