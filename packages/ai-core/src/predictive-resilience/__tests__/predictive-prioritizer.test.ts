import { describe, it, expect } from "vitest";
import { PredictiveRecoveryPrioritizer } from "../predictive-recovery-prioritizer.js";

describe("AEGIS Phase 29 — Predictive Recovery Prioritizer", () => {
  it("prioritizes interventions according to combined probability and business impact", () => {
    const list = PredictiveRecoveryPrioritizer.prioritize([
      { title: "Minor Cache Drift", probability: 20, businessImpact: 10 },
      { title: "DB Memory Creep", probability: 85, businessImpact: 90 },
    ]);

    expect(list.length).toBe(2);
    expect(list[0].title).toBe("DB Memory Creep");
    expect(list[0].priorityClass).toBe("CRITICAL");
  });
});
