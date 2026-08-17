import { describe, it, expect } from "vitest";
import { SafePatchEngine } from "../safe-patch-engine.js";
import { RepairStrategyEngine } from "../repair-strategy-engine.js";
import { BugImpactAnalysisEngine } from "../bug-impact-analysis-engine.js";
import { RootCauseAnalysisEngine } from "../root-cause-analysis-engine.js";
import { StackTraceAnalysisEngine } from "../stack-trace-analysis-engine.js";
import { EvidenceCollectionEngine } from "../evidence-collection-engine.js";

describe("AEGIS Phase 57 — Safe Patch Engine", () => {
  it("applies bounded atomic patch with pre-mutation checkpoint", () => {
    const evidence = EvidenceCollectionEngine.collectEvidence();
    const trace = StackTraceAnalysisEngine.analyze(evidence);
    const diagnosis = RootCauseAnalysisEngine.diagnose(evidence, trace);
    const impact = BugImpactAnalysisEngine.analyze(diagnosis);
    const strategy = RepairStrategyEngine.planStrategy(diagnosis, impact);

    const patch = SafePatchEngine.applyPatch(strategy);

    expect(patch.isApplied).toBe(true);
    expect(patch.filesModified.length).toBe(2);
    expect(patch.checkpointId).toContain("chkpt_pre_patch");
    expect(patch.totalLinesChanged).toBeLessThanOrEqual(25); // Minimal atomic modification
  });
});
