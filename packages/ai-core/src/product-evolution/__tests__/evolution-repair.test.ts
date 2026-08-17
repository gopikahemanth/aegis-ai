import { describe, it, expect } from "vitest";
import { ProductEvolutionRepairEngine } from "../product-evolution-repair-engine.js";

describe("AEGIS Phase 56 — Product Evolution Repair Engine", () => {
  it("diagnoses and patches defect within bounded attempts", async () => {
    const result = await ProductEvolutionRepairEngine.repairDefect(
      "Payment succeeded but membership status remained inactive"
    );
    expect(result.isRepaired).toBe(true);
    expect(result.totalAttempts).toBe(1);
    expect(result.requiresHumanIntervention).toBe(false);
    expect(result.attempts[0].retestPassed).toBe(true);
  });

  it("escalates to human intervention when max 5 repair attempts fail", async () => {
    const result = await ProductEvolutionRepairEngine.repairDefect(
      "Circular dependency in database migration",
      { simulateUnrepairable: true }
    );
    expect(result.isRepaired).toBe(false);
    expect(result.totalAttempts).toBe(5);
    expect(result.requiresHumanIntervention).toBe(true);
  });
});
