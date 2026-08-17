import { describe, it, expect } from "vitest";
import { ProductionOperationsAcceptance } from "../production-operations-acceptance.js";

const allPassCriteria = {
  healthMonitoring: true,
  anomalyDetection: true,
  incidentDetection: true,
  diagnosis: true,
  remediationPlanning: true,
  authorizationBoundary: true,
  selfHealing: true,
  recoveryVerification: true,
  dependencyMonitoring: true,
  performanceMonitoring: true,
  sloTracking: true,
  incidentLedger: true,
  boundedRemediation: true,
  humanEscalation: true,
  criticalDefectCount: 0,
};

describe("AEGIS Phase 55 — Production Operations Acceptance", () => {
  it("accepts operations when all 15 criteria pass", () => {
    const res = ProductionOperationsAcceptance.evaluate(allPassCriteria);
    expect(res.isAccepted).toBe(true);
    expect(res.overallScore).toBe(100);
    expect(res.totalCriteria).toBe(15);
    expect(res.passedCriteria).toBe(15);
    expect(res.blockedBy).toHaveLength(0);
  });

  it("blocks acceptance when self-healing fails and unescalated", () => {
    const res = ProductionOperationsAcceptance.evaluate({ ...allPassCriteria, selfHealing: false });
    expect(res.isAccepted).toBe(false);
    expect(res.blockedBy.some((c) => c.name === "Autonomous Self-Healing")).toBe(true);
  });

  it("blocks acceptance when critical defect count > 0", () => {
    const res = ProductionOperationsAcceptance.evaluate({ ...allPassCriteria, criticalDefectCount: 2 });
    expect(res.isAccepted).toBe(false);
    expect(res.blockedBy.some((c) => c.name === "Zero Critical Operational Defects")).toBe(true);
  });
});
