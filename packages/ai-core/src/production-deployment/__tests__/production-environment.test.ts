import { describe, it, expect } from "vitest";
import { ProductionEnvironmentAnalyzer } from "../production-environment-analyzer.js";

describe("AEGIS Phase 53 — Production Environment Analyzer", () => {
  it("returns READY when all environment conditions are met", () => {
    const r = ProductionEnvironmentAnalyzer.analyze({
      nodeVersion: "20.11.0",
      availablePorts: [3001, 5173, 5432],
      requiredEnvVars: ["DATABASE_URL", "JWT_SECRET", "NODE_ENV"],
      presentEnvVars: ["DATABASE_URL", "JWT_SECRET", "NODE_ENV"],
      hasDomain: true, hasTls: true,
    });
    expect(r.isDeployable).toBe(true);
    expect(r.nodeVersion.state).toBe("READY");
    expect(r.availablePorts.state).toBe("READY");
    expect(r.databaseAvailability.state).toBe("READY");
    expect(r.blockedChecks).toHaveLength(0);
  });

  it("returns BLOCKED when Node version is incompatible", () => {
    const r = ProductionEnvironmentAnalyzer.analyze({ simulateFailure: "NODE_VERSION" });
    expect(r.isDeployable).toBe(false);
    expect(r.overallState).toBe("BLOCKED");
    expect(r.nodeVersion.state).toBe("INCOMPATIBLE");
    expect(r.blockedChecks).toContain("Node.js Version");
  });

  it("returns CONFIGURATION_REQUIRED when env vars are missing — not DEPLOYMENT_SUCCESS", () => {
    const r = ProductionEnvironmentAnalyzer.analyze({ simulateFailure: "ENV_VARS" });
    expect(r.requiredEnvVars.state).toBe("CONFIGURATION_REQUIRED");
    expect(r.configurationRequired).toContain("Environment Variables");
  });
});
