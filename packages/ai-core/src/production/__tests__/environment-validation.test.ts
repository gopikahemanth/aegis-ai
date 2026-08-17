import { describe, it, expect } from "vitest";
import { EnvironmentValidator } from "../environment-validator.js";
import { ProductionConfigManager } from "../production-config.js";

describe("AEGIS Phase 14 — Environment & Production Config Validation", () => {
  it("validates runtime environment prerequisites and outputs structured checks", async () => {
    const report = await EnvironmentValidator.validate();
    expect(report.overall).toBe("AVAILABLE");
    expect(report.checks.length).toBeGreaterThanOrEqual(4);
    expect(report.checks.some((c) => c.check === "Node.js Runtime")).toBe(true);
  });

  it("classifies secret vs public configuration and detects public secret exposures", () => {
    const config = {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      VITE_API_BASE: "http://localhost:3000",
      VITE_SECRET_KEY: "super_secret_exposed",
    };

    const result = ProductionConfigManager.validate(config, "production");
    expect(result.valid).toBe(false);
    expect(result.exposedSecrets).toContain("VITE_SECRET_KEY");
    expect(result.sanitizedConfig.DATABASE_URL).toBe("[REDACTED_SECRET]");
  });
});
