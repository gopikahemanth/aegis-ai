import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { StrategicEngineeringGate } from "../strategic-engineering-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const STRAT_DIR = join(process.cwd(), ".tmp_test_p23_strat_gate");

describe("AEGIS Phase 23 — Strategic Engineering Gate", () => {
  beforeEach(() => {
    if (existsSync(STRAT_DIR)) rmSync(STRAT_DIR, { recursive: true, force: true });
    mkdirSync(STRAT_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(STRAT_DIR)) rmSync(STRAT_DIR, { recursive: true, force: true });
  });

  it("evaluates all 12 governance tiers and generates .aegis/strategic-engineering-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: STRAT_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = StrategicEngineeringGate.evaluate(STRAT_DIR, "org_global");
    expect(cert.status).toBe("STRATEGIC_ENGINEERING_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(12);
    expect(existsSync(join(STRAT_DIR, ".aegis", "strategic-engineering-certificate.json"))).toBe(true);
  });
});
