import { describe, it, expect } from "vitest";
import { EvolutionImpactEngine } from "../evolution-impact-engine.js";

describe("AEGIS Phase 35 — Evolution Impact Engine", () => {
  it("evaluates blast radius and cross-project scope", () => {
    const report = EvolutionImpactEngine.evaluateImpact(
      "opp_1",
      ["proj_gym", "proj_auth"],
      ["GymGateway", "AuthService", "BillingService"],
      ["@aegis/ai-core", "@aegis/desktop"],
      ["pg_main"]
    );

    expect(report.scope).toBe("CROSS_PROJECT");
    expect(report.affectedProjectsCount).toBe(2);
    expect(report.isCrossTenant).toBe(false);
  });
});
