import { describe, it, expect } from "vitest";
import { RecoveryOutcomeAnalyzer } from "../recovery-outcome-analyzer.js";

describe("AEGIS Phase 28 — Recovery Outcome Analyzer", () => {
  it("compares planned vs actual recovery execution metrics", () => {
    const report = RecoveryOutcomeAnalyzer.analyzeOutcome({
      projectId: "proj_core",
      plannedRTOSeconds: 120,
      actualRTOSeconds: 90,
      plannedRPOSeconds: 60,
      actualRPOSeconds: 30,
      dataIntegrityPassed: true,
      businessWorkflowIntegrityPassed: true,
    });

    expect(report.outcomeStatus).toBe("BETTER_THAN_EXPECTED");
    expect(report.dataIntegrityPassed).toBe(true);
  });
});
