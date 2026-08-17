import { describe, it, expect } from "vitest";
import { ProductionSelfHealingEngine } from "../production-self-healing-engine.js";
import { ProductionIncident } from "../production-incident-detector.js";
import { ProductionStateEngine } from "../production-state-engine.js";

describe("AEGIS Phase 55 — Production Self Healing Engine", () => {
  const baseIncident: ProductionIncident = {
    incidentId: "inc_heal_1",
    title: "Database Degradation",
    severity: "SEV1_CRITICAL",
    state: "DETECTED",
    detectedAt: new Date().toISOString(),
    affectedComponents: ["PostgreSQL Database"],
    correlatedSignals: ["High connection pool saturation"],
    requiresHumanIntervention: false,
    resolutionAttempts: 0,
    summary: "Database connection pool saturated",
  };

  it("heals incident within bounded attempts and verifies recovery", async () => {
    const state = ProductionStateEngine.captureState({
      simulateCritical: ["database"],
      customMetrics: { errorRatePercentage: 4.5 },
    });

    const result = await ProductionSelfHealingEngine.heal(baseIncident, state, { isAuthorized: true });
    expect(result.isResolved).toBe(true);
    expect(result.totalAttempts).toBeLessThanOrEqual(3);
    expect(result.requiresHumanIntervention).toBe(false);
    expect(result.history[0].recoveryReport?.isRecovered).toBe(true);
  });

  it("escalates to HUMAN_INTERVENTION_REQUIRED when attempts are exhausted", async () => {
    const state = ProductionStateEngine.captureState({
      simulateCritical: ["database"],
      customMetrics: { errorRatePercentage: 4.5 },
    });

    const result = await ProductionSelfHealingEngine.heal(baseIncident, state, {
      isAuthorized: true,
      simulatePersistentFailure: true,
    });

    expect(result.isResolved).toBe(false);
    expect(result.totalAttempts).toBe(3);
    expect(result.requiresHumanIntervention).toBe(true);
    expect(result.escalationReason).toContain("exceeded max 3 attempts");
  });
});
