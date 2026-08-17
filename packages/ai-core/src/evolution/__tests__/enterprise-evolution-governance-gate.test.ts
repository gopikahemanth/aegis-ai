import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseEvolutionGovernanceGate } from "../enterprise-evolution-governance-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const EVO_DIR = join(process.cwd(), ".tmp_test_p35_evo_gate");

describe("AEGIS Phase 35 — Enterprise Evolution Governance Gate", () => {
  beforeEach(() => {
    if (existsSync(EVO_DIR)) rmSync(EVO_DIR, { recursive: true, force: true });
    mkdirSync(EVO_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(EVO_DIR)) rmSync(EVO_DIR, { recursive: true, force: true });
  });

  it("evaluates all 24 governance tiers and generates .aegis/enterprise-evolution-governance-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: EVO_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseEvolutionGovernanceGate.evaluate(EVO_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_EVOLUTION_GOVERNANCE_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(24);
    expect(existsSync(join(EVO_DIR, ".aegis", "enterprise-evolution-governance-certificate.json"))).toBe(true);
  });
});
