import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseEvolutionGate } from "../enterprise-evolution-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const EVOL_GATE_DIR = join(process.cwd(), ".tmp_test_p39_evol_gate");

describe("AEGIS Phase 39 — Enterprise Evolution Gate", () => {
  beforeEach(() => {
    if (existsSync(EVOL_GATE_DIR)) rmSync(EVOL_GATE_DIR, { recursive: true, force: true });
    mkdirSync(EVOL_GATE_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(EVOL_GATE_DIR)) rmSync(EVOL_GATE_DIR, { recursive: true, force: true });
  });

  it("evaluates all 28 governance tiers and issues .aegis/enterprise-evolution-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: EVOL_GATE_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseEvolutionGate.evaluate(EVOL_GATE_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_EVOLUTION_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(28);
    expect(existsSync(join(EVOL_GATE_DIR, ".aegis", "enterprise-evolution-certificate.json"))).toBe(true);
  });
});
