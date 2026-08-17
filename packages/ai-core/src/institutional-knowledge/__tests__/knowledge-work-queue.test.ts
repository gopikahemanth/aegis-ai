import { describe, it, expect, beforeEach } from "vitest";
import { KnowledgeWorkQueue } from "../knowledge-work-queue.js";

describe("AEGIS Phase 41 — Knowledge Work Queue", () => {
  beforeEach(() => {
    KnowledgeWorkQueue.reset();
  });

  it("prioritizes knowledge curation tasks based on score and severity", () => {
    KnowledgeWorkQueue.enqueue({
      organizationId: "org_global",
      title: "Document Stale Redis Architecture Guideline",
      priority: "MEDIUM",
      score: 50,
    });

    KnowledgeWorkQueue.enqueue({
      organizationId: "org_global",
      title: "Resolve Connection Pool Latency Contradiction",
      priority: "CRITICAL",
      score: 95,
    });

    const tasks = KnowledgeWorkQueue.getTasks();
    expect(tasks.length).toBe(2);
    expect(tasks[0].priority).toBe("CRITICAL");
  });
});
