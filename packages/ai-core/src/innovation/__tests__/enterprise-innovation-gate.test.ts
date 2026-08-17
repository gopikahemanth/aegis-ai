import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseInnovationGate } from "../enterprise-innovation-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const INNOV_GATE_DIR = join(process.cwd(), ".tmp_test_p40_innov_gate");

describe("AEGIS Phase 40 — Enterprise Innovation Gate", () => {
  beforeEach(() => {
    if (existsSync(INNOV_GATE_DIR)) rmSync(INNOV_GATE_DIR, { recursive: true, force: true });
    mkdirSync(INNOV_GATE_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(INNOV_GATE_DIR)) rmSync(INNOV_GATE_DIR, { recursive: true, force: true });
  });

  it("evaluates all 29 governance tiers and issues .aegis/enterprise-innovation-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: INNOV_GATE_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseInnovationGate.evaluate(INNOV_GATE_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_INNOVATION_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(29);
    expect(existsSync(join(INNOV_GATE_DIR, ".aegis", "enterprise-innovation-certificate.json"))).toBe(true);
  });
});
