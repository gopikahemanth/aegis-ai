import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseLearningGovernanceGate } from "../enterprise-learning-governance-gate.js";
import { LearningGovernanceLedger } from "../learning-governance-ledger.js";

describe("AEGIS Phase 44 — Enterprise Learning Governance Gate (Tier 33)", () => {
  beforeEach(() => {
    LearningGovernanceLedger.reset();
  });

  it("evaluates all 33 governance tiers and issues EnterpriseLearningGovernanceCertificate", () => {
    LearningGovernanceLedger.recordEntry({
      actor: "system",
      tenant: "tenant_corp",
      project: "proj_gym",
      eventType: "GENESIS_LEARNING_VERIFICATION",
      targetId: "k_genesis",
      evidenceReferences: ["ev_gen"],
    });

    const cert = EnterpriseLearningGovernanceGate.evaluate(process.cwd());

    expect(cert.tier).toBe(33);
    expect(cert.status).toBe("ENTERPRISE_LEARNING_GOVERNANCE_CERTIFIED");
    expect(cert.previousTierCount).toBe(32);
    expect(cert.safetyPoliciesMutated).toBe(0);
    expect(cert.authorizationBypassesAttempted).toBe(0);
    expect(cert.simulationMutationCount).toBe(0);
    expect(cert.ledgerIntegrityVerified).toBe(true);
  });
});
