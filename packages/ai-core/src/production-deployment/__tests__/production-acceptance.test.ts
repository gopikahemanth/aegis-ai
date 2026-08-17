import { describe, it, expect } from "vitest";
import { ProductionAcceptanceEngine } from "../production-acceptance-engine.js";

const allPass = {
  buildPassed: true, environmentReady: true, deploymentCompleted: true,
  frontendHealthy: true, backendHealthy: true, databaseHealthy: true,
  liveApiVerified: true, liveBrowserVerified: true,
  authenticationVerified: true, authorizationVerified: true,
  criticalWorkflowsPassed: true, securityChecksPassed: true,
  observabilityPresent: true, rollbackVerified: true, criticalDefectCount: 0,
};

describe("AEGIS Phase 53 — Production Acceptance Engine", () => {
  it("accepts production when all 15 criteria pass", () => {
    const r = ProductionAcceptanceEngine.evaluate(allPass);
    expect(r.isAccepted).toBe(true);
    expect(r.overallScore).toBe(100);
    expect(r.criticalDefectCount).toBe(0);
    expect(r.totalCriteria).toBe(15);
    expect(r.blockedBy).toHaveLength(0);
  });

  it("blocks production when live browser fails — LIVE WEBSITE + 1 CRITICAL FAILURE = NOT ACCEPTED", () => {
    const r = ProductionAcceptanceEngine.evaluate({ ...allPass, liveBrowserVerified: false });
    expect(r.isAccepted).toBe(false);
    expect(r.blockedBy.some((b) => b.name === "Browser VERIFIED")).toBe(true);
  });

  it("blocks production when critical workflow fails post-deployment", () => {
    const r = ProductionAcceptanceEngine.evaluate({ ...allPass, criticalWorkflowsPassed: false });
    expect(r.isAccepted).toBe(false);
    expect(r.blockedBy.some((b) => b.name === "Critical Workflows PASS")).toBe(true);
  });

  it("blocks production when rollback is not verified", () => {
    const r = ProductionAcceptanceEngine.evaluate({ ...allPass, rollbackVerified: false });
    expect(r.isAccepted).toBe(false);
    expect(r.blockedBy.some((b) => b.name === "Rollback VERIFIED")).toBe(true);
  });
});
