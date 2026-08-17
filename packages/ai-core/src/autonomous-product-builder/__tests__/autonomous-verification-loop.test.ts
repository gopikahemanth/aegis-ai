import { describe, it, expect } from "vitest";
import { AutonomousVerificationLoop } from "../autonomous-verification-loop.js";

describe("AEGIS Phase 46 — Autonomous Verification Loop", () => {
  it("executes bounded self-healing loop and accepts application after resolving defect", () => {
    const loopResult = AutonomousVerificationLoop.executeLoop(
      {
        errorText: "HTTP 404: Cannot POST /api/members",
        affectedFile: "server/routes/member.routes.ts",
      },
      {
        maxRepairAttempts: 3,
        maxBuildAttempts: 3,
        maxVerificationCycles: 3,
      }
    );

    expect(loopResult.isAccepted).toBe(true);
    expect(loopResult.totalRepairsApplied).toBe(1);
    expect(loopResult.finalBuildStatus).toBe("BUILD_PASSED");
    expect(loopResult.finalRuntimeStatus).toBe("HEALTHY");
    expect(loopResult.browserWorkflowsPassed).toBe(true);
  });
});
