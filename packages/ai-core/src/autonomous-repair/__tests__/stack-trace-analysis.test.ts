import { describe, it, expect } from "vitest";
import { StackTraceAnalysisEngine } from "../stack-trace-analysis-engine.js";
import { EvidenceCollectionEngine } from "../evidence-collection-engine.js";

describe("AEGIS Phase 57 — Stack Trace Analysis Engine", () => {
  it("correlates stack trace back to culprit file, function, and database model", () => {
    const evidence = EvidenceCollectionEngine.collectEvidence();
    const trace = StackTraceAnalysisEngine.analyze(evidence);

    expect(trace.culpritFile).toContain("payment.service.ts");
    expect(trace.culpritFunction).toBe("createPaymentIntent");
    expect(trace.culpritLine).toBe(42);
    expect(trace.callChain.length).toBeGreaterThanOrEqual(4);
    expect(trace.affectedDatabaseModel).toBe("Payment");
  });
});
