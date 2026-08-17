import { describe, it, expect } from "vitest";
import { SystemicRiskInsightEngine } from "../systemic-risk-insight-engine.js";

describe("AEGIS Phase 42 — Systemic Risk Insight Engine", () => {
  it("detects cross-project systemic cascading risks without automatic remediation", () => {
    const risk = SystemicRiskInsightEngine.evaluateRisk(
      "Unpatched Shared WebSocket Router Dependency",
      4,
      "@aegis/ws-router@0.1.0",
      ["ev_cve_alert", "ev_dependency_audit"]
    );

    expect(risk.riskId).toBeDefined();
    expect(risk.severity).toBe("SYSTEMIC_RISK");
    expect(risk.blastRadiusScore).toBeGreaterThanOrEqual(50);
    expect(risk.affectedProjects.length).toBe(4);
  });
});
