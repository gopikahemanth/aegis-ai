import { describe, it, expect, beforeEach } from "vitest";
import { ProductCompletionWorkQueue } from "../product-completion-work-queue.js";

describe("AEGIS Phase 45 — Product Completion Work Queue", () => {
  beforeEach(() => {
    ProductCompletionWorkQueue.reset();
  });

  it("prioritizes critical defect repair and incomplete requirements before UI polish", () => {
    ProductCompletionWorkQueue.enqueue({
      requirementId: "REQ-004",
      title: "UI Theme Polish",
      priority: "LOW",
      score: 30,
      targetComponent: "theme.css",
    });

    ProductCompletionWorkQueue.enqueue({
      requirementId: "REQ-001",
      title: "Missing Member Attendance POST Route",
      priority: "CRITICAL",
      score: 95,
      targetComponent: "server/routes/member.routes.ts",
    });

    const tasks = ProductCompletionWorkQueue.getTasks();
    expect(tasks[0].priority).toBe("CRITICAL");
    expect(tasks[0].requirementId).toBe("REQ-001");
  });
});
