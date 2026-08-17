import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterprisePredictivePlanningGate } from "../enterprise-predictive-planning-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const PLAN_DIR = join(process.cwd(), ".tmp_test_p32_plan_gate");

describe("AEGIS Phase 32 — Enterprise Predictive Planning Gate", () => {
  beforeEach(() => {
    if (existsSync(PLAN_DIR)) rmSync(PLAN_DIR, { recursive: true, force: true });
    mkdirSync(PLAN_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(PLAN_DIR)) rmSync(PLAN_DIR, { recursive: true, force: true });
  });

  it("evaluates all 21 governance tiers and generates .aegis/enterprise-predictive-planning-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: PLAN_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterprisePredictivePlanningGate.evaluate(PLAN_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_PREDICTIVE_PLANNING_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(21);
    expect(existsSync(join(PLAN_DIR, ".aegis", "enterprise-predictive-planning-certificate.json"))).toBe(true);
  });
});
