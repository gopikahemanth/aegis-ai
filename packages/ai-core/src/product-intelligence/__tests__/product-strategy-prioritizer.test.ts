import { describe, it, expect } from "vitest";
import { ProductStrategyPrioritizer } from "../product-strategy-prioritizer.js";

describe("AEGIS Phase 37 — Product Strategy Prioritizer", () => {
  it("deterministically ranks opportunities based on ROI, retention gain, and customer value", () => {
    const opp1 = {
      opportunityId: "opp_high",
      title: "Real-Time Attendance Hub",
      expectedRoi: 6.0,
      expectedRetentionGain: 14.2,
      expectedValueINR: 150000,
      costINR: 25000,
      projectId: "p1",
      sourceInsightId: "in1",
      targetUserGroup: "Members",
      status: "DISCOVERED" as const,
      createdAt: "",
      updatedAt: "",
    };

    const opp2 = {
      opportunityId: "opp_low",
      title: "Minor Button Restyle",
      expectedRoi: 1.0,
      expectedRetentionGain: 0.5,
      expectedValueINR: 2000,
      costINR: 2000,
      projectId: "p1",
      sourceInsightId: "in2",
      targetUserGroup: "Staff",
      status: "DISCOVERED" as const,
      createdAt: "",
      updatedAt: "",
    };

    const ranked = ProductStrategyPrioritizer.prioritize([opp2, opp1]);
    expect(ranked.length).toBe(2);
    expect(ranked[0].opportunityId).toBe("opp_high");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].priorityTier).toBe("CRITICAL");
    expect(ranked[0].governanceOverridePrevented).toBe(true);
  });
});
