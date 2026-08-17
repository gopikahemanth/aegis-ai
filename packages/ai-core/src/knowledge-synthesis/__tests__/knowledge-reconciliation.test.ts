import { describe, it, expect } from "vitest";
import { KnowledgeReconciliationEngine } from "../knowledge-reconciliation-engine.js";

describe("AEGIS Phase 42 — Knowledge Reconciliation Engine", () => {
  it("detects cross-domain contradictions and proposes governed review without overwriting evidence", () => {
    const report = KnowledgeReconciliationEngine.reconcile(
      "Engineering",
      "Database schema migration is verified safe",
      "Reliability",
      "Database schema migration causes elevated downtime"
    );

    expect(report.conflictType).toBe("DIRECT_CONTRADICTION");
    expect(report.proposedAction.actionType).toBe("REQUEST_REVIEW");
  });
});
