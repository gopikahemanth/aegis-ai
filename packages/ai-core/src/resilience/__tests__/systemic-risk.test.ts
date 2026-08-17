import { describe, it, expect } from "vitest";
import { SystemicRiskAnalyzer } from "../systemic-risk-analyzer.js";

describe("AEGIS Phase 27 — Systemic Risk Analyzer", () => {
  it("detects single points of failure across interdependent projects", () => {
    const findings = SystemicRiskAnalyzer.analyzeDependencies([
      { sourceProject: "proj_frontend", targetProject: "proj_auth", isCritical: true },
      { sourceProject: "proj_billing", targetProject: "proj_auth", isCritical: true },
    ]);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe("SINGLE_POINT_OF_FAILURE");
    expect(findings[0].sourceProjectId).toBe("proj_auth");
    expect(findings[0].blastRadius).toBe("HIGH");
  });
});
