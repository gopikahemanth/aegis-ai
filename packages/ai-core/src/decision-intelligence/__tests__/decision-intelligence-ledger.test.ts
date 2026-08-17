import { describe, it, expect, beforeEach } from "vitest";
import { DecisionIntelligenceLedger } from "../decision-intelligence-ledger.js";

describe("AEGIS Phase 31 — Decision Intelligence Ledger", () => {
  beforeEach(() => {
    DecisionIntelligenceLedger.reset();
  });

  it("records cryptographically hashed, append-only decision records with previous hash chaining", () => {
    const entry = DecisionIntelligenceLedger.recordDecision({
      actorId: "lead_exec_1",
      organizationId: "org_alpha",
      projectId: "proj_api",
      operation: "EVALUATE_DECISION_QUALITY",
      decisionType: "QUALITY_EVALUATED",
      evidenceSummary: "Decision evaluated as EFFECTIVE with 96% reasoning quality.",
    });

    expect(entry.entryHash).toBeDefined();
    expect(entry.previousHash).toBe("GENESIS_DECISION_INTEL_HASH");
    expect(DecisionIntelligenceLedger.getLedger().length).toBe(1);
  });
});
