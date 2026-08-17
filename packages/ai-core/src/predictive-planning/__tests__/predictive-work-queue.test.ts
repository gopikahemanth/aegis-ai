import { describe, it, expect, beforeEach } from "vitest";
import { PredictiveWorkQueue } from "../predictive-work-queue.js";

describe("AEGIS Phase 32 — Predictive Work Queue", () => {
  beforeEach(() => {
    PredictiveWorkQueue.reset();
  });

  it("enqueues and prioritizes tasks with forecastId and authorizationState lineage", () => {
    PredictiveWorkQueue.enqueue({
      projectId: "proj_core",
      title: "Scale Worker Capacity",
      priority: "HIGH",
      forecastId: "fc_cap_1",
      authorizationState: "PENDING_AUTHORIZATION",
      score: 85,
    });

    PredictiveWorkQueue.enqueue({
      projectId: "proj_core",
      title: "Mitigate Critical DB Contention",
      priority: "CRITICAL",
      forecastId: "fc_risk_2",
      authorizationState: "PENDING_AUTHORIZATION",
      score: 95,
    });

    const tasks = PredictiveWorkQueue.getTasks();
    expect(tasks.length).toBe(2);
    expect(tasks[0].priority).toBe("CRITICAL");
    expect(tasks[0].forecastId).toBe("fc_risk_2");
  });
});
