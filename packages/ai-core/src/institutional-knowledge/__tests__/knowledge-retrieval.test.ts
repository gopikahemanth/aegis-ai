import { describe, it, expect, beforeEach } from "vitest";
import { KnowledgeRetrievalEngine } from "../knowledge-retrieval-engine.js";

describe("AEGIS Phase 41 — Knowledge Retrieval Engine", () => {
  beforeEach(() => {
    KnowledgeRetrievalEngine.reset();
  });

  it("retrieves contextually relevant knowledge with strictly ZERO mutations", () => {
    KnowledgeRetrievalEngine.indexKnowledge("org_global", {
      knowledgeId: "k_pool_1",
      itemType: "HISTORICAL_FACT",
      title: "Prisma Connection Pool Sizing",
      content: "Set connection pool limit to 50 for websocket servers to prevent timeout latency.",
      confidence: 0.95,
      relevanceScore: 0.98,
      sourceEvidenceIds: ["ev_inc_401"],
    });

    const result = KnowledgeRetrievalEngine.retrieve({
      organizationId: "org_global",
      projectId: "proj_gym",
      environment: "production",
      symptoms: ["timeout", "latency"],
      technologyStack: ["Node", "Express", "Prisma"],
    });

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.sourceMutationsAttempted).toBe(0);
    expect(result.databaseMutationsAttempted).toBe(0);
    expect(result.deploymentMutationsAttempted).toBe(0);
  });
});
