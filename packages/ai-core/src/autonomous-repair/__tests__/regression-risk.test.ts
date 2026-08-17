import { describe, it, expect } from "vitest";
import { RegressionRiskEngine } from "../regression-risk-engine.js";
import { BugImpactAnalysisEngine } from "../bug-impact-analysis-engine.js";
import { RootCauseAnalysisEngine } from "../root-cause-analysis-engine.js";
import { StackTraceAnalysisEngine } from "../stack-trace-analysis-engine.js";
import { EvidenceCollectionEngine } from "../evidence-collection-engine.js";

describe("AEGIS Phase 57 — Regression Risk Engine", () => {
  it("executes 4-tier regression matrix and confirms zero regressions", () => {
    const evidence = EvidenceCollectionEngine.collectEvidence();
    const trace = StackTraceAnalysisEngine.analyze(evidence);
    const diagnosis = RootCauseAnalysisEngine.diagnose(evidence, trace);
    const impact = BugImpactAnalysisEngine.analyze(diagnosis);

    const report = RegressionRiskEngine.executeRegressionMatrix(impact);

    expect(report.isRegressionSafe).toBe(true);
    expect(report.totalTests).toBe(61);
    expect(report.failedTests).toBe(0);
    expect(report.suites.length).toBe(4);
  });

  it("flags regression risk when tests fail", () => {
    const evidence = EvidenceCollectionEngine.collectEvidence();
    const trace = StackTraceAnalysisEngine.analyze(evidence);
    const diagnosis = RootCauseAnalysisEngine.diagnose(evidence, trace);
    const impact = BugImpactAnalysisEngine.analyze(diagnosis);

    const report = RegressionRiskEngine.executeRegressionMatrix(impact, { simulateRegressionFailure: true });

    expect(report.isRegressionSafe).toBe(false);
    expect(report.failedTests).toBeGreaterThan(0);
  });
});
