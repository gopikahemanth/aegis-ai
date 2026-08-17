import { describe, it, expect } from "vitest";
import { RealBrowserWorkflowValidator } from "../real-browser-workflow-validator.js";

describe("AEGIS Phase 47 — Real Browser Workflow Validator", () => {
  it("executes multi-step browser DOM interaction workflow: Landing -> Auth -> Dashboard -> Add Member -> Check-in -> Logout", async () => {
    const report = await RealBrowserWorkflowValidator.executeGymBrowserWorkflow("http://localhost:5173");

    expect(report.passed).toBe(true);
    expect(report.totalSteps).toBe(7);
    expect(report.failedSteps).toBe(0);
    expect(report.assertions.every((a) => a.passed)).toBe(true);
    expect(report.assertions[4].domSnapshotExcerpt).toContain("Sarah Jenkins");
  });
});
