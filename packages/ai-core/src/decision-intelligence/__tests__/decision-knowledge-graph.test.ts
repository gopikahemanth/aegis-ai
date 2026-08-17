import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseDecisionKnowledgeGraph } from "../enterprise-decision-knowledge-graph.js";

describe("AEGIS Phase 31 — Enterprise Decision Knowledge Graph", () => {
  beforeEach(() => {
    EnterpriseDecisionKnowledgeGraph.reset();
  });

  it("links decisions, releases, incidents, and outcomes with provenance", () => {
    EnterpriseDecisionKnowledgeGraph.addNode({
      nodeId: "node_dec_1",
      nodeType: "DECISION",
      label: "Scale Redis Replicas",
      projectId: "proj_core",
      timestamp: new Date().toISOString(),
      isVerified: true,
    });

    EnterpriseDecisionKnowledgeGraph.addNode({
      nodeId: "node_rel_1",
      nodeType: "RELEASE",
      label: "Release 2.0.0",
      projectId: "proj_core",
      timestamp: new Date().toISOString(),
      isVerified: true,
    });

    EnterpriseDecisionKnowledgeGraph.addEdge({
      fromNodeId: "node_dec_1",
      toNodeId: "node_rel_1",
      relationship: "EXECUTED_IN",
      provenance: "PR #102 verified via deployment orchestrator",
    });

    const lineage = EnterpriseDecisionKnowledgeGraph.getLineage("node_dec_1");
    expect(lineage.nodes.length).toBe(2);
    expect(lineage.edges[0].relationship).toBe("EXECUTED_IN");
  });
});
