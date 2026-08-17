import { describe, it, expect } from "vitest";
import { EnterpriseInsightEngine } from "../enterprise-insight-engine.js";

describe("AEGIS Phase 42 — Enterprise Insight Engine", () => {
  it("generates structured enterprise insights with strict separation of recommendation and authorization", () => {
    const insight = EnterpriseInsightEngine.generateInsight(
      "org_global",
      "Deployment incidents decreased by 58% after connection pool resizing",
      ["ev_inc_postmortem", "ev_p99_metrics"],
      "ADR-014 directly improves Reliability SLAs",
      "Saves ~240 engineering recovery hours annually",
      "Standardize connection pool limits in base deployment template"
    );

    expect(insight.insightId).toBeDefined();
    expect(insight.classification).toBe("INFERRED");
    expect(insight.authorizationStatus).toBe("NOT_GRANTED");
    expect(insight.confidenceScore).toBeGreaterThanOrEqual(0.9);
  });
});
