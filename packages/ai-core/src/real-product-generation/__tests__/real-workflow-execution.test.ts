import { describe, it, expect } from "vitest";
import { RealWorkflowExecutor } from "../real-workflow-executor.js";

describe("AEGIS Phase 52 — Real Workflow Executor", () => {
  it("executes complete gym management business workflows and produces step-level evidence", () => {
    const report = RealWorkflowExecutor.execute("GYM");
    expect(report.totalWorkflows).toBeGreaterThanOrEqual(3);
    expect(report.isAllPassed).toBe(true);
    expect(report.executions.every((e) => e.evidenceHash !== "EVIDENCE_ABSENT")).toBe(true);
    expect(report.executions.every((e) => e.steps.every((s) => s.isCompleted))).toBe(true);
  });

  it("correctly identifies a failing workflow when a real defect is injected", () => {
    const report = RealWorkflowExecutor.execute("GYM", "wf_gym_record_attendance");
    const failedWf = report.executions.find((e) => e.workflowId === "wf_gym_record_attendance");
    expect(failedWf).toBeDefined();
    expect(failedWf?.isPassed).toBe(false);
    expect(report.failedWorkflows).toBeGreaterThan(0);
    expect(report.isAllPassed).toBe(false);
  });
});
