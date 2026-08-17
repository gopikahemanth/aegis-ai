import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseKnowledgeGate } from "../enterprise-knowledge-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const KNOWLEDGE_GATE_DIR = join(process.cwd(), ".tmp_test_p41_know_gate");

describe("AEGIS Phase 41 — Enterprise Knowledge Gate", () => {
  beforeEach(() => {
    if (existsSync(KNOWLEDGE_GATE_DIR)) rmSync(KNOWLEDGE_GATE_DIR, { recursive: true, force: true });
    mkdirSync(KNOWLEDGE_GATE_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(KNOWLEDGE_GATE_DIR)) rmSync(KNOWLEDGE_GATE_DIR, { recursive: true, force: true });
  });

  it("evaluates all 30 governance tiers and issues .aegis/enterprise-knowledge-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: KNOWLEDGE_GATE_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseKnowledgeGate.evaluate(KNOWLEDGE_GATE_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_KNOWLEDGE_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(30);
    expect(existsSync(join(KNOWLEDGE_GATE_DIR, ".aegis", "enterprise-knowledge-certificate.json"))).toBe(true);
  });
});
