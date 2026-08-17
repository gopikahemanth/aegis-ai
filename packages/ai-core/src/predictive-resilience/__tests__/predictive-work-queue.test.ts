import { describe, it, expect, beforeEach } from "vitest";
import { PredictiveResilienceWorkQueue } from "../predictive-resilience-work-queue.js";

describe("AEGIS Phase 29 — Predictive Resilience Work Queue", () => {
  beforeEach(() => {
    PredictiveResilienceWorkQueue.reset();
  });

  it("enqueues and prioritizes items maintaining predictive lineage", () => {
    PredictiveResilienceWorkQueue.enqueue({
      projectId: "proj_api",
      title: "Warmup Standby Replica",
      predictionId: "pred_1",
      priorityScore: 70,
      type: "PRE_INCIDENT_INTERVENTION",
      status: "PENDING",
    });

    PredictiveResilienceWorkQueue.enqueue({
      projectId: "proj_api",
      title: "Mitigate Memory Creep",
      predictionId: "pred_2",
      priorityScore: 90,
      type: "HIGH_CONFIDENCE_FAILURE_FORECAST",
      status: "PENDING",
    });

    const queue = PredictiveResilienceWorkQueue.getQueue();
    expect(queue.length).toBe(2);
    expect(queue[0].type).toBe("HIGH_CONFIDENCE_FAILURE_FORECAST");
  });
});
