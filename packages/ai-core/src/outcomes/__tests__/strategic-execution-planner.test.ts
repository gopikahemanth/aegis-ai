import { describe, it, expect } from "vitest";
import { StrategicExecutionPlanner } from "../strategic-execution-planner.js";

describe("AEGIS Phase 24 — Strategic Execution Planner", () => {
  it("decomposes initiative into project execution plan and task DAG", () => {
    const plan = StrategicExecutionPlanner.planExecution("init_api_boost", ["proj_api", "proj_db"]);
    expect(plan.projects.length).toBe(2);
    expect(plan.tasks.length).toBe(2);
    expect(plan.totalEstimatedHours).toBe(24);
  });
});
