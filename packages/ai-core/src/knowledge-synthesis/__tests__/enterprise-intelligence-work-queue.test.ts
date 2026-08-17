import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseIntelligenceWorkQueue } from "../enterprise-intelligence-work-queue.js";

describe("AEGIS Phase 42 — Enterprise Intelligence Work Queue", () => {
  beforeEach(() => {
    EnterpriseIntelligenceWorkQueue.reset();
  });

  it("prioritizes systemic risks, conflicts, and insight validations by score", () => {
    EnterpriseIntelligenceWorkQueue.enqueue({
      organizationId: "org_global",
      category: "TRADEOFF_REVIEW",
      title: "Review Reliability vs Infrastructure Cost Rebalance",
      priority: "MEDIUM",
      score: 60,
    });

    EnterpriseIntelligenceWorkQueue.enqueue({
      organizationId: "org_global",
      category: "SYSTEMIC_RISK",
      title: "Mitigate Unpatched Router Across 4 Projects",
      priority: "CRITICAL",
      score: 95,
    });

    const tasks = EnterpriseIntelligenceWorkQueue.getTasks();
    expect(tasks.length).toBe(2);
    expect(tasks[0].category).toBe("SYSTEMIC_RISK");
  });
});
