import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseInnovationGovernanceGate } from "../enterprise-innovation-governance-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const INNOV_DIR = join(process.cwd(), ".tmp_test_p36_innov_gate");

describe("AEGIS Phase 36 — Enterprise Innovation Governance Gate", () => {
  beforeEach(() => {
    if (existsSync(INNOV_DIR)) rmSync(INNOV_DIR, { recursive: true, force: true });
    mkdirSync(INNOV_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(INNOV_DIR)) rmSync(INNOV_DIR, { recursive: true, force: true });
  });

  it("evaluates all 25 governance tiers and generates .aegis/enterprise-innovation-governance-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: INNOV_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseInnovationGovernanceGate.evaluate(INNOV_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_INNOVATION_GOVERNANCE_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(25);
    expect(existsSync(join(INNOV_DIR, ".aegis", "enterprise-innovation-governance-certificate.json"))).toBe(true);
  });
});
