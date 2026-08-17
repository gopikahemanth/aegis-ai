import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseChangeGovernanceGate } from "../enterprise-change-governance-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const CHG_DIR = join(process.cwd(), ".tmp_test_p34_chg_gate");

describe("AEGIS Phase 34 — Enterprise Change Governance Gate", () => {
  beforeEach(() => {
    if (existsSync(CHG_DIR)) rmSync(CHG_DIR, { recursive: true, force: true });
    mkdirSync(CHG_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(CHG_DIR)) rmSync(CHG_DIR, { recursive: true, force: true });
  });

  it("evaluates all 23 governance tiers and generates .aegis/enterprise-change-governance-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: CHG_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseChangeGovernanceGate.evaluate(CHG_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_CHANGE_GOVERNANCE_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(23);
    expect(existsSync(join(CHG_DIR, ".aegis", "enterprise-change-governance-certificate.json"))).toBe(true);
  });
});
