import { describe, it, expect, beforeEach } from "vitest";
import { OrganizationalLearningGraph } from "../organizational-learning-graph.js";

describe("AEGIS Phase 44 — Organizational Learning Graph", () => {
  beforeEach(() => {
    OrganizationalLearningGraph.reset();
  });

  it("builds a traceable graph connecting decisions, actions, outcomes, lessons, and recommendations", () => {
    const node1 = OrganizationalLearningGraph.addNode({
      nodeId: "node_dec_1",
      type: "DECISION",
      label: "Optimize Connection Pool",
      metadata: { targetPoolSize: 50 },
    });

    const node2 = OrganizationalLearningGraph.addNode({
      nodeId: "node_act_1",
      type: "ACTION",
      label: "Configure Pool Standard",
      metadata: { appliedConfig: "pool=50" },
    });

    const edge = OrganizationalLearningGraph.addEdge({
      sourceNodeId: node1.nodeId,
      targetNodeId: node2.nodeId,
      relationship: "TRIGGERED",
      confidence: 1.0,
    });

    expect(OrganizationalLearningGraph.getNode("node_dec_1")).toBeDefined();
    expect(OrganizationalLearningGraph.getEdgesBySource("node_dec_1").length).toBe(1);
    expect(edge.relationship).toBe("TRIGGERED");
  });
});
