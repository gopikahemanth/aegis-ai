import { describe, it, expect } from "vitest";
import { InfrastructureAnalysisEngine } from "../infrastructure-analysis-engine.js";

describe("AEGIS Phase 54 — Infrastructure Analysis Engine", () => {
  it("returns READY when all infrastructure requirements are available", () => {
    const res = InfrastructureAnalysisEngine.analyze();
    expect(res.isDeployable).toBe(true);
    expect(res.overallState).toBe("READY");
    expect(res.blockedItems).toHaveLength(0);
  });

  it("identifies blocked state when critical compute host is unavailable", () => {
    const res = InfrastructureAnalysisEngine.analyze({ simulateFailure: "BACKEND" });
    expect(res.isDeployable).toBe(false);
    expect(res.overallState).toBe("BLOCKED");
    expect(res.blockedItems).toContain("Backend Compute Host");
  });

  it("flags CONFIGURATION_REQUIRED for missing domain or TLS", () => {
    const res = InfrastructureAnalysisEngine.analyze({ simulateFailure: "DOMAIN" });
    expect(res.overallState).toBe("CONFIGURATION_REQUIRED");
    expect(res.configurationRequiredItems).toContain("Domain Name & DNS");
  });
});
