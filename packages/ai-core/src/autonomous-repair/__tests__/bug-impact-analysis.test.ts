import { describe, it, expect } from "vitest";
import { BugImpactAnalysisEngine } from "../bug-impact-analysis-engine.js";
import { RootCauseAnalysisEngine } from "../root-cause-analysis-engine.js";
import { StackTraceAnalysisEngine } from "../stack-trace-analysis-engine.js";
import { EvidenceCollectionEngine } from "../evidence-collection-engine.js";

describe("AEGIS Phase 57 — Bug Impact Analysis Engine", () => {
  it("determines blast radius and generates regression test scope", () => {
    const evidence = EvidenceCollectionEngine.collectEvidence();
    const trace = StackTraceAnalysisEngine.analyze(evidence);
    const diagnosis = RootCauseAnalysisEngine.diagnose(evidence, trace);
    const impact = BugImpactAnalysisEngine.analyze(diagnosis);

    expect(impact.overallSeverity).toBe("HIGH");
    expect(impact.affectedFiles.length).toBeGreaterThanOrEqual(2);
    expect(impact.affectedEndpoints).toContain("POST /api/payments/create-intent");
    expect(impact.requiredRegressionSuites.length).toBeGreaterThanOrEqual(3);
  });
});
