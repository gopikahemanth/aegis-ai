import { describe, it, expect } from "vitest";
import { InnovationImpactEngine } from "../innovation-impact-engine.js";

describe("AEGIS Phase 36 — Innovation Impact Engine", () => {
  it("evaluates blast radius and preserves tenant isolation", () => {
    const report = InnovationImpactEngine.evaluateImpact(
      "opp_1",
      ["proj_gym"],
      ["/api/members/attendance"],
      ["pg_main"],
      false
    );

    expect(report.impactLevel).toBe("LOCAL");
    expect(report.tenantIsolationPreserved).toBe(true);
  });

  it("blocks innovations attempting cross-tenant boundary violations", () => {
    const report = InnovationImpactEngine.evaluateImpact(
      "opp_xtenant",
      ["proj_gym_tenant_a", "proj_gym_tenant_b"],
      ["/api/all_tenants"],
      [],
      true
    );

    expect(report.impactLevel).toBe("BLOCKED");
    expect(report.tenantIsolationPreserved).toBe(false);
  });
});
