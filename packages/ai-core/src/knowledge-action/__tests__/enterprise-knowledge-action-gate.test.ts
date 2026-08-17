import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseKnowledgeActionGate } from "../enterprise-knowledge-action-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";
import { KnowledgeActionLedger } from "../knowledge-action-ledger.js";

const ACTION_GATE_DIR = join(process.cwd(), ".tmp_test_p43_action_gate");

describe("AEGIS Phase 43 — Enterprise Knowledge Action Gate", () => {
  beforeEach(() => {
    if (existsSync(ACTION_GATE_DIR)) rmSync(ACTION_GATE_DIR, { recursive: true, force: true });
    mkdirSync(ACTION_GATE_DIR, { recursive: true });
    FleetManager.reset();
    KnowledgeActionLedger.reset();
  });

  afterEach(() => {
    if (existsSync(ACTION_GATE_DIR)) rmSync(ACTION_GATE_DIR, { recursive: true, force: true });
  });

  it("evaluates all 32 governance tiers and issues .aegis/enterprise-knowledge-action-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: ACTION_GATE_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseKnowledgeActionGate.evaluate(ACTION_GATE_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_KNOWLEDGE_ACTION_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(32);
    expect(existsSync(join(ACTION_GATE_DIR, ".aegis", "enterprise-knowledge-action-certificate.json"))).toBe(true);
  });
});
