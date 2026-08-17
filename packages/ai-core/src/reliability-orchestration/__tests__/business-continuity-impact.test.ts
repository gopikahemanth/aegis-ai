import { describe, it, expect } from "vitest";
import { BusinessContinuityImpactEngine } from "../business-continuity-impact.js";

describe("AEGIS Phase 30 — Business Continuity Impact Engine", () => {
  it("evaluates financial exposure and customer impact severity", () => {
    const impact = BusinessContinuityImpactEngine.assessImpact("proj_core", "Member Attendance", 1200, "VERIFIED");
    expect(impact.customerImpactSeverity).toBe("MODERATE");
    expect(impact.financialExposureINR).toBe(150000);
    expect(impact.classification).toBe("VERIFIED");
  });
});
