import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseKnowledgeActionWorkQueue } from "../enterprise-knowledge-action-work-queue.js";

describe("AEGIS Phase 43 — Enterprise Knowledge Action Work Queue", () => {
  beforeEach(() => {
    EnterpriseKnowledgeActionWorkQueue.reset();
  });

  it("prioritizes and transitions action items without deleting historical records", () => {
    const item = EnterpriseKnowledgeActionWorkQueue.enqueue({
      actionId: "act_pool_standardization",
      sourceInsightId: "ins_p99_reduction",
      title: "Fleet-wide Clustered Connection Pool Standardization",
      priorityScore: 92,
      assignedTeam: "team_infra",
    });

    expect(item.state).toBe("DISCOVERED");
    const updated = EnterpriseKnowledgeActionWorkQueue.transitionState(item.itemId, "AUTHORIZED");
    expect(updated?.state).toBe("AUTHORIZED");
    expect(updated?.stateHistory.length).toBe(2);
  });
});
