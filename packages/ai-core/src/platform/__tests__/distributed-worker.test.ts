import { describe, it, expect, beforeEach } from "vitest";
import { WorkerManager } from "../worker-manager.js";

describe("AEGIS Phase 18 — Distributed Worker & Lease Safety", () => {
  beforeEach(() => {
    WorkerManager.reset();
  });

  it("grants exclusive lease to first worker and blocks concurrent worker mutation", () => {
    WorkerManager.heartbeat("worker_A");
    WorkerManager.heartbeat("worker_B");

    const acquiredA = WorkerManager.acquireLease("worker_A", "gym_proj", "job_1", 2000);
    expect(acquiredA).toBe(true);

    const acquiredB = WorkerManager.acquireLease("worker_B", "gym_proj", "job_2", 2000);
    expect(acquiredB).toBe(false); // blocked by worker A lease
  });

  it("releases lease cleanly enabling subsequent worker acquisition", () => {
    WorkerManager.heartbeat("worker_A");
    WorkerManager.heartbeat("worker_B");

    WorkerManager.acquireLease("worker_A", "gym_proj", "job_1", 2000);
    WorkerManager.releaseLease("worker_A", "gym_proj");

    const acquiredB = WorkerManager.acquireLease("worker_B", "gym_proj", "job_2", 2000);
    expect(acquiredB).toBe(true);
  });
});
