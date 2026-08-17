import { describe, it, expect } from "vitest";
import { RealDefectRepairLoop } from "../real-defect-repair-loop.js";

describe("AEGIS Phase 47 — Real Defect Repair Loop", () => {
  it("diagnoses real 500 error, patches schema/route, rebuilds, restarts runtime, and re-verifies successfully", async () => {
    const loopResult = await RealDefectRepairLoop.executeRepairLoop(
      {
        stage: "API",
        stepName: "create_member",
        rawError: "HTTP 500: Database schema missing required field 'membershipPlanId'",
        affectedFile: "prisma/schema.prisma",
      },
      5
    );

    expect(loopResult.isResolved).toBe(true);
    expect(loopResult.finalStatus).toBe("RESOLVED");
    expect(loopResult.logs.length).toBe(1);
    expect(loopResult.logs[0].rebuildPassed).toBe(true);
    expect(loopResult.logs[0].retestPassed).toBe(true);
  });
});
