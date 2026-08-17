import { describe, it, expect } from "vitest";
import { RepairStrategyEngine } from "../repair-strategy-engine.js";
import { BugImpactAnalysisEngine } from "../bug-impact-analysis-engine.js";
import { RootCauseAnalysisEngine } from "../root-cause-analysis-engine.js";
import { StackTraceAnalysisEngine } from "../stack-trace-analysis-engine.js";
import { EvidenceCollectionEngine } from "../evidence-collection-engine.js";

describe("AEGIS Phase 57 — Repair Strategy Engine", () => {
  it("ranks candidate repair strategies by correctness, risk, and regression probability", () => {
    const evidence = EvidenceCollectionEngine.collectEvidence();
    const trace = StackTraceAnalysisEngine.analyze(evidence);
    const diagnosis = RootCauseAnalysisEngine.diagnose(evidence, trace);
    const impact = BugImpactAnalysisEngine.analyze(diagnosis);

    const plan = RepairStrategyEngine.planStrategy(diagnosis, impact);

    expect(plan.rankedCandidates.length).toBeGreaterThanOrEqual(3);
    expect(plan.selectedStrategy.type).toBe("CODE_PATCH");
    expect(plan.selectedStrategy.estimatedRisk).toBe("LOW");
    expect(plan.selectedStrategy.rollbackAvailable).toBe(true);
    expect(plan.selectedStrategy.score).toBeGreaterThan(90);
  });
});
