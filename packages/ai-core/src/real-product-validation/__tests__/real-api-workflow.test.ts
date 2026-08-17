import { describe, it, expect } from "vitest";
import { RealApiWorkflowValidator } from "../real-api-workflow-validator.js";

describe("AEGIS Phase 47 — Real API Workflow Validator", () => {
  it("executes full REST API lifecycle: auth register -> auth login -> get members -> post member -> put member -> attendance check-in", async () => {
    const report = await RealApiWorkflowValidator.executeGymApiWorkflow("http://localhost:3001");

    expect(report.passed).toBe(true);
    expect(report.totalCalls).toBe(7);
    expect(report.failedCalls).toBe(0);
    expect(report.calls.map((c) => c.method)).toContain("POST");
    expect(report.calls.map((c) => c.method)).toContain("GET");
    expect(report.calls.map((c) => c.method)).toContain("PUT");
  });
});
