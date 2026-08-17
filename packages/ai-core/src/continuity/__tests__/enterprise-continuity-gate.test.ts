import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseContinuityOptimizationGate } from "../enterprise-continuity-optimization-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const CONT_DIR = join(process.cwd(), ".tmp_test_p28_cont_gate");

describe("AEGIS Phase 28 — Enterprise Continuity Optimization Gate", () => {
  beforeEach(() => {
    if (existsSync(CONT_DIR)) rmSync(CONT_DIR, { recursive: true, force: true });
    mkdirSync(CONT_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(CONT_DIR)) rmSync(CONT_DIR, { recursive: true, force: true });
  });

  it("evaluates all 17 governance tiers and generates .aegis/enterprise-continuity-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: CONT_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseContinuityOptimizationGate.evaluate(CONT_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_CONTINUITY_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(17);
    expect(existsSync(join(CONT_DIR, ".aegis", "enterprise-continuity-certificate.json"))).toBe(true);
  });
});
