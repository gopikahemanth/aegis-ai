import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseReliabilityStateEngine } from "../enterprise-reliability-state.js";

describe("AEGIS Phase 30 — Enterprise Reliability State Engine", () => {
  beforeEach(() => {
    EnterpriseReliabilityStateEngine.reset();
  });

  it("records and updates holistic project reliability state", () => {
    EnterpriseReliabilityStateEngine.updateState({
      projectId: "proj_core",
      organizationId: "org_alpha",
      environment: "production",
      state: "BUSINESS_RECOVERED",
      activeIncidentsCount: 0,
      rtoCompliancePercentage: 100,
      rpoCompliancePercentage: 100,
      lastVerifiedAt: new Date().toISOString(),
    });

    const state = EnterpriseReliabilityStateEngine.getState("proj_core");
    expect(state.state).toBe("BUSINESS_RECOVERED");
    expect(state.rtoCompliancePercentage).toBe(100);
  });
});
