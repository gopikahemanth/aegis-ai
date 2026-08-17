import { describe, it, expect } from "vitest";
import { InfrastructureAcceptanceEngine } from "../infrastructure-acceptance-engine.js";

const allPassCriteria = {
  planValid: true,
  hostingTargetReady: true,
  environmentConfigured: true,
  databaseHealthy: true,
  applicationRunning: true,
  frontendHealthy: true,
  backendHealthy: true,
  domainVerified: true,
  tlsVerified: true,
  publicAvailabilityVerified: true,
  liveApiVerified: true,
  liveBrowserVerified: true,
  monitoringPresent: true,
  backupReadinessVerified: true,
  securityChecksPassed: true,
  rollbackVerified: true,
  criticalDefectCount: 0,
};

describe("AEGIS Phase 54 — Infrastructure Acceptance Engine", () => {
  it("accepts infrastructure when all 17 criteria are satisfied", () => {
    const res = InfrastructureAcceptanceEngine.evaluate(allPassCriteria);
    expect(res.isAccepted).toBe(true);
    expect(res.overallScore).toBe(100);
    expect(res.totalCriteria).toBe(17);
    expect(res.passedCriteria).toBe(17);
    expect(res.blockedBy).toHaveLength(0);
  });

  it("blocks acceptance when TLS is unverified", () => {
    const res = InfrastructureAcceptanceEngine.evaluate({ ...allPassCriteria, tlsVerified: false });
    expect(res.isAccepted).toBe(false);
    expect(res.blockedBy.some((c) => c.name === "TLS Verified")).toBe(true);
  });

  it("blocks acceptance when public availability fails", () => {
    const res = InfrastructureAcceptanceEngine.evaluate({ ...allPassCriteria, publicAvailabilityVerified: false });
    expect(res.isAccepted).toBe(false);
    expect(res.blockedBy.some((c) => c.name === "Public Availability Verified")).toBe(true);
  });

  it("blocks acceptance when backup readiness is unverified", () => {
    const res = InfrastructureAcceptanceEngine.evaluate({ ...allPassCriteria, backupReadinessVerified: false });
    expect(res.isAccepted).toBe(false);
    expect(res.blockedBy.some((c) => c.name === "Backup Readiness Verified")).toBe(true);
  });
});
