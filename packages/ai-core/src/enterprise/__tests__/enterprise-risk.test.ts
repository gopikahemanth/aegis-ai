import { describe, it, expect } from "vitest";
import { EnterpriseRiskEngine } from "../enterprise-risk-engine.js";

describe("AEGIS Phase 21 — Enterprise Risk Engine", () => {
  it("evaluates risk vectors across security, dependency, and compliance dimensions", () => {
    const assessment = EnterpriseRiskEngine.evaluateRisk("org_enterprise");
    expect(assessment.riskLevel).toBe("LOW");
    expect(assessment.securityRisk).toBe("LOW");
    expect(assessment.complianceRisk).toBe("LOW");
  });
});
