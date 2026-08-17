import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseLearningWorkQueue } from "../enterprise-learning-work-queue.js";

describe("AEGIS Phase 44 — Enterprise Learning Work Queue", () => {
  beforeEach(() => {
    EnterpriseLearningWorkQueue.reset();
  });

  it("prioritizes and manages learning tasks through the complete lifecycle", () => {
    const task = EnterpriseLearningWorkQueue.enqueue({
      category: "Contradiction",
      title: "Contradicted Security Lesson in Token Storage",
      priority: "CRITICAL",
      score: 95,
      assignedTeam: "team_security",
    });

    expect(task.taskId).toBeDefined();
    expect(task.state).toBe("DISCOVERED");

    EnterpriseLearningWorkQueue.updateState(task.taskId, "APPROVED");
    const tasks = EnterpriseLearningWorkQueue.getTasks();
    expect(tasks[0].state).toBe("APPROVED");
  });
});
