import { describe, it, expect } from "vitest";
import { PredictiveRiskPropagationEngine } from "../predictive-risk-propagation.js";

describe("AEGIS Phase 32 — Predictive Risk Propagation Engine", () => {
  it("models downstream severity propagation across multiple business capabilities", () => {
    const report = PredictiveRiskPropagationEngine.propagateRisk(
      "Redis Cluster Memory Growth",
      ["proj_gym", "proj_auth"],
      ["Member Login", "Check-in Validation", "Payment Processing"],
      80
    );

    expect(report.severity).toBe("CRITICAL");
    expect(report.classification).toBe("FORECAST");
    expect(report.affectedCapabilities.length).toBe(3);
  });
});
