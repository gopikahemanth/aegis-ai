import { describe, it, expect, beforeEach } from "vitest";
import { BusinessContinuityEngine } from "../business-continuity-engine.js";

describe("AEGIS Phase 27 — Business Continuity Engine", () => {
  beforeEach(() => {
    BusinessContinuityEngine.reset();
  });

  it("registers and queries mission-critical business capabilities and fallback strategies", () => {
    BusinessContinuityEngine.registerCapability({
      capabilityId: "cap_auth",
      name: "Global User Authentication",
      criticality: "TIER_1_MISSION_CRITICAL",
      dependentProjects: ["proj_auth", "proj_api"],
      fallbackStrategy: "Cached JWT Offline Verification",
      continuityStatus: "FULLY_RESILIENT",
    });

    const cap = BusinessContinuityEngine.getCapability("cap_auth");
    expect(cap?.criticality).toBe("TIER_1_MISSION_CRITICAL");
    expect(cap?.continuityStatus).toBe("FULLY_RESILIENT");
  });
});
