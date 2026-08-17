import { describe, it, expect } from "vitest";
import { SelfRepairEngine } from "../self-repair-engine.js";

describe("AEGIS Phase 20 — Self-Repair Engine & Policy Evaluation", () => {
  it("evaluates AUTO_REPAIR_SAFE for worker node lease restart", () => {
    const plan = SelfRepairEngine.evaluateRepair("WorkerNodeManager", "Unresponsive worker lease");
    expect(plan.policy).toBe("AUTO_REPAIR_SAFE");
    expect(plan.rollbackReady).toBe(true);
  });

  it("requires human authorization for critical security or database repairs", () => {
    const plan = SelfRepairEngine.evaluateRepair("DatabaseSecurityManager", "Stale connection pool lease");
    expect(plan.policy).toBe("REQUIRES_AUTHORIZATION");
  });
});
