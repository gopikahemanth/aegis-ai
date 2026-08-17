import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseGovernanceGate } from "../enterprise-governance-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const ENT_DIR = join(process.cwd(), ".tmp_test_p21_ent_gate");

describe("AEGIS Phase 21 — Enterprise Governance Gate", () => {
  beforeEach(() => {
    if (existsSync(ENT_DIR)) rmSync(ENT_DIR, { recursive: true, force: true });
    mkdirSync(ENT_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(ENT_DIR)) rmSync(ENT_DIR, { recursive: true, force: true });
  });

  it("evaluates all 10 governance tiers and produces .aegis/enterprise-governance-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: ENT_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseGovernanceGate.evaluate(ENT_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_GOVERNANCE_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(10);
    expect(existsSync(join(ENT_DIR, ".aegis", "enterprise-governance-certificate.json"))).toBe(true);
  });
});
