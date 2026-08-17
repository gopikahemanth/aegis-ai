import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseDecisionIntelligenceGate } from "../enterprise-decision-intelligence-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const DEC_DIR = join(process.cwd(), ".tmp_test_p31_dec_gate");

describe("AEGIS Phase 31 — Enterprise Decision Intelligence Gate", () => {
  beforeEach(() => {
    if (existsSync(DEC_DIR)) rmSync(DEC_DIR, { recursive: true, force: true });
    mkdirSync(DEC_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(DEC_DIR)) rmSync(DEC_DIR, { recursive: true, force: true });
  });

  it("evaluates all 20 governance tiers and generates .aegis/enterprise-decision-intelligence-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: DEC_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseDecisionIntelligenceGate.evaluate(DEC_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_DECISION_INTELLIGENCE_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(20);
    expect(existsSync(join(DEC_DIR, ".aegis", "enterprise-decision-intelligence-certificate.json"))).toBe(true);
  });
});
