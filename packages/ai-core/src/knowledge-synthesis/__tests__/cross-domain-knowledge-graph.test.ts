import { describe, it, expect, beforeEach } from "vitest";
import { CrossDomainKnowledgeGraph } from "../cross-domain-knowledge-graph.js";

describe("AEGIS Phase 42 — Cross-Domain Knowledge Graph", () => {
  beforeEach(() => {
    CrossDomainKnowledgeGraph.reset();
  });

  it("connects cross-domain nodes with typed relationships and evidence provenance", () => {
    const edge = CrossDomainKnowledgeGraph.addEdge({
      sourceId: "ADR-014",
      sourceDomain: "Architecture",
      targetId: "INC-401",
      targetDomain: "Reliability",
      relationshipType: "MITIGATED",
      evidenceIds: ["ev_p99_latency_18ms"],
      confidence: 0.98,
      verificationStatus: "EMPIRICALLY_VERIFIED",
    });

    expect(edge.edgeId).toBeDefined();
    expect(edge.relationshipType).toBe("MITIGATED");
    expect(CrossDomainKnowledgeGraph.getEdgesByDomain("Architecture").length).toBe(1);
    expect(CrossDomainKnowledgeGraph.getAllEdges().length).toBe(1);
  });
});
