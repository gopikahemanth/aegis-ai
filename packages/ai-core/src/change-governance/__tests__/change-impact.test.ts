import { describe, it, expect } from "vitest";
import { ChangeImpactEngine } from "../change-impact-engine.js";

describe("AEGIS Phase 34 — Change Impact Engine", () => {
  it("evaluates change blast radius and classifies scope", () => {
    const report = ChangeImpactEngine.calculateImpact(
      "chg_1",
      ["proj_api", "proj_auth", "proj_billing", "proj_gym"],
      ["svc_gateway", "svc_auth", "svc_billing", "svc_member", "svc_notify", "svc_analytics"],
      ["/api/v1/auth", "/api/v1/members"],
      ["pg_main", "redis_cache"]
    );

    expect(report.scope).toBe("CRITICAL_SYSTEMIC");
    expect(report.sloDegradationRisk).toBe(true);
    expect(report.classification).toBe("PREDICTED_IMPACT");
  });
});
