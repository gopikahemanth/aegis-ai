import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseResilienceGate } from "../enterprise-resilience-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const RESIL_DIR = join(process.cwd(), ".tmp_test_p27_resil_gate");

describe("AEGIS Phase 27 — Enterprise Resilience Gate", () => {
  beforeEach(() => {
    if (existsSync(RESIL_DIR)) rmSync(RESIL_DIR, { recursive: true, force: true });
    mkdirSync(RESIL_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(RESIL_DIR)) rmSync(RESIL_DIR, { recursive: true, force: true });
  });

  it("evaluates all 16 governance tiers and generates .aegis/enterprise-resilience-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: RESIL_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseResilienceGate.evaluate(RESIL_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_RESILIENCE_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(16);
    expect(existsSync(join(RESIL_DIR, ".aegis", "enterprise-resilience-certificate.json"))).toBe(true);
  });
});
