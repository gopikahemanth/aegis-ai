import { describe, it, expect } from "vitest";
import { ActionEffectivenessEngine } from "../action-effectiveness-engine.js";

describe("AEGIS Phase 43 — Action Effectiveness Engine", () => {
  it("calculates multi-dimensional effectiveness scorecards", () => {
    const effective = ActionEffectivenessEngine.evaluateEffectiveness("act_1", 3200000, 800000, 25, 30, 0);
    expect(effective.rating).toBe("EFFECTIVE");
    expect(effective.benefitCostRatio).toBe(4.0);

    const negative = ActionEffectivenessEngine.evaluateEffectiveness("act_2", 1000000, 800000, -15, 10, 4);
    expect(negative.rating).toBe("NEGATIVE_EFFECT");
  });
});
