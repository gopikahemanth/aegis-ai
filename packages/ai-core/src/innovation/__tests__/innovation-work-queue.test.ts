import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseInnovationWorkQueue } from "../innovation-work-queue.js";

describe("AEGIS Phase 36 — Enterprise Innovation Work Queue", () => {
  beforeEach(() => {
    EnterpriseInnovationWorkQueue.reset();
  });

  it("prioritizes innovation tasks by customer demand and strategic score", () => {
    EnterpriseInnovationWorkQueue.enqueue({
      projectId: "proj_gym",
      opportunityId: "opp_minor",
      title: "UI Polish",
      priority: "LOW",
      score: 25,
    });

    EnterpriseInnovationWorkQueue.enqueue({
      projectId: "proj_gym",
      opportunityId: "opp_analytics",
      title: "Real-Time Attendance Analytics",
      priority: "CRITICAL",
      score: 95,
    });

    const tasks = EnterpriseInnovationWorkQueue.getTasks();
    expect(tasks.length).toBe(2);
    expect(tasks[0].priority).toBe("CRITICAL");
    expect(tasks[0].opportunityId).toBe("opp_analytics");
  });
});
