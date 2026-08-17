import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseEvolutionWorkQueue } from "../evolution-work-queue.js";

describe("AEGIS Phase 35 — Enterprise Evolution Work Queue", () => {
  beforeEach(() => {
    EnterpriseEvolutionWorkQueue.reset();
  });

  it("prioritizes evolution tasks by business value and ROI score", () => {
    EnterpriseEvolutionWorkQueue.enqueue({
      projectId: "proj_gym",
      opportunityId: "opp_minor",
      title: "Minor Refactor",
      priority: "LOW",
      score: 25,
    });

    EnterpriseEvolutionWorkQueue.enqueue({
      projectId: "proj_gym",
      opportunityId: "opp_arch",
      title: "Gateway Decoupling",
      priority: "CRITICAL",
      score: 95,
    });

    const tasks = EnterpriseEvolutionWorkQueue.getTasks();
    expect(tasks.length).toBe(2);
    expect(tasks[0].priority).toBe("CRITICAL");
    expect(tasks[0].opportunityId).toBe("opp_arch");
  });
});
