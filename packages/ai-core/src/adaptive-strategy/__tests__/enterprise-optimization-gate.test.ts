import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseOptimizationGate } from "../enterprise-optimization-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const OPT_DIR = join(process.cwd(), ".tmp_test_p25_opt_gate");

describe("AEGIS Phase 25 — Enterprise Optimization Gate", () => {
  beforeEach(() => {
    if (existsSync(OPT_DIR)) rmSync(OPT_DIR, { recursive: true, force: true });
    mkdirSync(OPT_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(OPT_DIR)) rmSync(OPT_DIR, { recursive: true, force: true });
  });

  it("evaluates all 14 governance tiers and generates .aegis/enterprise-optimization-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: OPT_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseOptimizationGate.evaluate(OPT_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_OPTIMIZATION_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(14);
    expect(existsSync(join(OPT_DIR, ".aegis", "enterprise-optimization-certificate.json"))).toBe(true);
  });
});
