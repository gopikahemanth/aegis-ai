import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseKnowledgeSynthesisGate } from "../enterprise-knowledge-synthesis-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const SYNTHESIS_GATE_DIR = join(process.cwd(), ".tmp_test_p42_synth_gate");

describe("AEGIS Phase 42 — Enterprise Knowledge Synthesis Gate", () => {
  beforeEach(() => {
    if (existsSync(SYNTHESIS_GATE_DIR)) rmSync(SYNTHESIS_GATE_DIR, { recursive: true, force: true });
    mkdirSync(SYNTHESIS_GATE_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(SYNTHESIS_GATE_DIR)) rmSync(SYNTHESIS_GATE_DIR, { recursive: true, force: true });
  });

  it("evaluates all 31 governance tiers and issues .aegis/enterprise-knowledge-synthesis-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: SYNTHESIS_GATE_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseKnowledgeSynthesisGate.evaluate(SYNTHESIS_GATE_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_KNOWLEDGE_SYNTHESIS_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(31);
    expect(existsSync(join(SYNTHESIS_GATE_DIR, ".aegis", "enterprise-knowledge-synthesis-certificate.json"))).toBe(true);
  });
});
