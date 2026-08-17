import { describe, it, expect } from "vitest";
import { RootCauseAnalysisEngine } from "../root-cause-analysis-engine.js";
import { StackTraceAnalysisEngine } from "../stack-trace-analysis-engine.js";
import { EvidenceCollectionEngine } from "../evidence-collection-engine.js";

describe("AEGIS Phase 57 — Root Cause Analysis Engine", () => {
  it("determines direct cause and contributing causes with high confidence", () => {
    const evidence = EvidenceCollectionEngine.collectEvidence();
    const trace = StackTraceAnalysisEngine.analyze(evidence);
    const diagnosis = RootCauseAnalysisEngine.diagnose(evidence, trace);

    expect(diagnosis.isDiagnosed).toBe(true);
    expect(diagnosis.primaryCause.classification).toBe("DIRECT_CAUSE");
    expect(diagnosis.primaryCause.confidence).toBeGreaterThanOrEqual(0.95);
    expect(diagnosis.primaryCause.verificationStatus).toBe("VERIFIED");
    expect(diagnosis.contributingCauses.length).toBeGreaterThan(0);
  });

  it("handles inconclusive evidence cleanly with UNKNOWN cause", () => {
    const evidence = EvidenceCollectionEngine.collectEvidence();
    const trace = StackTraceAnalysisEngine.analyze(evidence);
    const diagnosis = RootCauseAnalysisEngine.diagnose(evidence, trace, { simulateUnknownFailure: true });

    expect(diagnosis.isDiagnosed).toBe(false);
    expect(diagnosis.primaryCause.classification).toBe("UNKNOWN");
  });
});
