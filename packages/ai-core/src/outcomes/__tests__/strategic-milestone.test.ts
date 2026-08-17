import { describe, it, expect, beforeEach } from "vitest";
import { StrategicMilestoneEngine } from "../strategic-milestone-engine.js";

describe("AEGIS Phase 24 — Strategic Milestone Engine", () => {
  beforeEach(() => {
    StrategicMilestoneEngine.reset();
  });

  it("creates and advances milestones with verified evidence summaries", () => {
    const ms = StrategicMilestoneEngine.createMilestone({
      milestoneId: "ms_api_v2",
      initiativeId: "init_1",
      title: "API v2 Rollout",
      dueDate: "2026-11-30",
      status: "IN_PROGRESS",
    });

    expect(ms.status).toBe("IN_PROGRESS");

    const updated = StrategicMilestoneEngine.updateMilestoneStatus(
      "ms_api_v2",
      "ACHIEVED",
      "Production deployment and telemetry verification passed"
    );
    expect(updated).toBe(true);
    expect(StrategicMilestoneEngine.getMilestone("ms_api_v2")?.status).toBe("ACHIEVED");
  });
});
