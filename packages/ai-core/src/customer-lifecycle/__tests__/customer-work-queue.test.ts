import { describe, it, expect, beforeEach } from "vitest";
import { CustomerLifecycleWorkQueue } from "../customer-lifecycle-work-queue.js";

describe("AEGIS Phase 38 — Customer Lifecycle Work Queue", () => {
  beforeEach(() => {
    CustomerLifecycleWorkQueue.reset();
  });

  it("prioritizes proactive customer success tasks by churn risk and business impact", () => {
    CustomerLifecycleWorkQueue.enqueue({
      projectId: "proj_gym",
      customerId: "cust_low",
      title: "Routine Feature Newsletter",
      priority: "LOW",
      score: 25,
    });

    CustomerLifecycleWorkQueue.enqueue({
      projectId: "proj_gym",
      customerId: "cust_critical",
      title: "Critical Churn Risk Intervention",
      priority: "CRITICAL",
      score: 95,
    });

    const tasks = CustomerLifecycleWorkQueue.getTasks();
    expect(tasks.length).toBe(2);
    expect(tasks[0].priority).toBe("CRITICAL");
    expect(tasks[0].customerId).toBe("cust_critical");
  });
});
