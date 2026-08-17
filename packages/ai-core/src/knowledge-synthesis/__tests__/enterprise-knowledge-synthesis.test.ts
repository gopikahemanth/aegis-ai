import { describe, it, expect } from "vitest";
import { EnterpriseKnowledgeSynthesisEngine } from "../enterprise-knowledge-synthesis-engine.js";

describe("AEGIS Phase 42 — Enterprise Knowledge Synthesis Engine", () => {
  it("synthesizes multi-domain findings without illegally upgrading inferred to verified", () => {
    const synth = EnterpriseKnowledgeSynthesisEngine.synthesize(
      "org_global",
      ["Engineering", "Reliability", "Economics"],
      ["ev_1", "ev_2"],
      [
        {
          statement: "Clustered connection pooling reduces P99 latency by 58%",
          classification: "VERIFIED",
          confidence: 0.98,
          evidence: ["ev_1"],
        },
        {
          statement: "Standardizing pool settings across fleet nodes will save ~240 engineering hours annually",
          classification: "INFERRED",
          confidence: 0.92,
          evidence: ["ev_2"],
        },
      ]
    );

    expect(synth.synthesisId).toBeDefined();
    expect(synth.findings.length).toBe(2);
    expect(synth.findings[0].classification).toBe("VERIFIED");
    expect(synth.findings[1].classification).toBe("INFERRED");
    expect(synth.overallConfidence).toBeGreaterThanOrEqual(0.9);
  });
});
