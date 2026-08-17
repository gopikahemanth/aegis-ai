import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseChangeWorkQueue } from "../change-work-queue.js";

describe("AEGIS Phase 34 — Enterprise Change Work Queue", () => {
  beforeEach(() => {
    EnterpriseChangeWorkQueue.reset();
  });

  it("prioritizes change governance work by importance and urgency score", () => {
    EnterpriseChangeWorkQueue.enqueue({
      projectId: "proj_api",
      changeId: "chg_minor",
      title: "Minor Config Tweak",
      priority: "LOW",
      score: 30,
    });

    EnterpriseChangeWorkQueue.enqueue({
      projectId: "proj_api",
      changeId: "chg_critical",
      title: "Critical Schema Migration",
      priority: "CRITICAL",
      score: 95,
    });

    const tasks = EnterpriseChangeWorkQueue.getTasks();
    expect(tasks.length).toBe(2);
    expect(tasks[0].priority).toBe("CRITICAL");
    expect(tasks[0].changeId).toBe("chg_critical");
  });
});
