import { describe, it, expect } from "vitest";
import { RealProductRepairLoop } from "../real-product-repair-loop.js";

describe("AEGIS Phase 52 — Real Product Repair Loop", () => {
  it("resolves real failures through bounded autonomous repair cycles", async () => {
    const result = await RealProductRepairLoop.repair([
      { id: "wf_gym_record_attendance", description: "Attendance check-in API returned 500", isCritical: true },
    ]);
    expect(result.outcome).toBe("RESOLVED");
    expect(result.totalAttempts).toBeGreaterThanOrEqual(1);
    expect(result.repairs.some((r) => r.outcome === "RESOLVED")).toBe(true);
    expect(result.humanInterventionRequired).toBe(false);
  });

  it("escalates to PRODUCT_REQUIRES_HUMAN_INTERVENTION when maxRepairAttempts is set to 0", async () => {
    const result = await RealProductRepairLoop.repair(
      [{ id: "wf_fail", description: "Persistent DB lock error", isCritical: true }],
      0
    );
    expect(result.outcome).toBe("PRODUCT_REQUIRES_HUMAN_INTERVENTION");
    expect(result.humanInterventionRequired).toBe(true);
    expect(result.humanInterventionReason).toBeDefined();
  });
});
