import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseReliabilityWorkQueue } from "../enterprise-reliability-work-queue.js";

describe("AEGIS Phase 30 — Enterprise Reliability Work Queue", () => {
  beforeEach(() => {
    EnterpriseReliabilityWorkQueue.reset();
  });

  it("enqueues and prioritizes items maintaining cross-system lineage", () => {
    EnterpriseReliabilityWorkQueue.enqueue({
      projectId: "proj_api",
      title: "Mitigate Database Pool Contention",
      priorityScore: 80,
      type: "CAPACITY_RISK",
      status: "PENDING",
    });

    EnterpriseReliabilityWorkQueue.enqueue({
      projectId: "proj_auth",
      title: "Multi-Project Cascading Token Expiry",
      priorityScore: 98,
      type: "CRITICAL_BUSINESS_RISK",
      status: "PENDING",
    });

    const queue = EnterpriseReliabilityWorkQueue.getQueue();
    expect(queue.length).toBe(2);
    expect(queue[0].type).toBe("CRITICAL_BUSINESS_RISK");
  });
});
