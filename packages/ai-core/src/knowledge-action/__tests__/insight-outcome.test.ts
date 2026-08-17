import { describe, it, expect } from "vitest";
import { InsightOutcomeEngine } from "../insight-outcome-engine.js";

describe("AEGIS Phase 43 — Insight Outcome Engine", () => {
  it("enforces ACTION EXECUTED != ACTION EFFECTIVE and evaluates observed vs expected variance", () => {
    const realized = InsightOutcomeEngine.measureOutcome("act_1", "ins_1", 50, 58, true);
    expect(realized.realizationStatus).toBe("REALIZED");
    expect(realized.variancePct).toBe(8);

    const regressed = InsightOutcomeEngine.measureOutcome("act_2", "ins_2", 30, -10, true);
    expect(regressed.realizationStatus).toBe("REGRESSED");

    const noEvidence = InsightOutcomeEngine.measureOutcome("act_3", "ins_3", 30, 30, false);
    expect(noEvidence.realizationStatus).toBe("INSUFFICIENT_EVIDENCE");
  });
});
