import { describe, it, expect, beforeEach } from "vitest";
import { ContinuityWorkQueue } from "../continuity-work-queue.js";

describe("AEGIS Phase 28 — Continuity Work Queue", () => {
  beforeEach(() => {
    ContinuityWorkQueue.reset();
  });

  it("enqueues and prioritizes continuity items based on priority score", () => {
    ContinuityWorkQueue.enqueue({
      projectId: "proj_api",
      title: "Optimize DB Snapshot",
      priorityScore: 60,
      type: "BACKUP_OPTIMIZATION",
      status: "PENDING",
    });

    ContinuityWorkQueue.enqueue({
      projectId: "proj_api",
      title: "Resolve RTO Breach",
      priorityScore: 95,
      type: "RTO_BREACH",
      status: "PENDING",
    });

    const queue = ContinuityWorkQueue.getQueue();
    expect(queue.length).toBe(2);
    expect(queue[0].type).toBe("RTO_BREACH");
  });
});
