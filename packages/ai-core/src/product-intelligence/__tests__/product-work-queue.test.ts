import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseProductWorkQueue } from "../product-work-queue.js";

describe("AEGIS Phase 37 — Enterprise Product Work Queue", () => {
  beforeEach(() => {
    EnterpriseProductWorkQueue.reset();
  });

  it("prioritizes product engineering tasks by customer value and strategic alignment", () => {
    EnterpriseProductWorkQueue.enqueue({
      projectId: "proj_gym",
      opportunityId: "opp_minor",
      title: "Settings Layout Tweak",
      priority: "LOW",
      score: 30,
    });

    EnterpriseProductWorkQueue.enqueue({
      projectId: "proj_gym",
      opportunityId: "opp_attendance",
      title: "Real-Time Attendance Hub",
      priority: "CRITICAL",
      score: 95,
    });

    const tasks = EnterpriseProductWorkQueue.getTasks();
    expect(tasks.length).toBe(2);
    expect(tasks[0].priority).toBe("CRITICAL");
    expect(tasks[0].opportunityId).toBe("opp_attendance");
  });
});
