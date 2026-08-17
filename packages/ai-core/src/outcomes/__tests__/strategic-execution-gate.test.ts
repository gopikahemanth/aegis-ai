import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { StrategicExecutionGate } from "../strategic-execution-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const EXEC_DIR = join(process.cwd(), ".tmp_test_p24_exec_gate");

describe("AEGIS Phase 24 — Strategic Execution Gate", () => {
  beforeEach(() => {
    if (existsSync(EXEC_DIR)) rmSync(EXEC_DIR, { recursive: true, force: true });
    mkdirSync(EXEC_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(EXEC_DIR)) rmSync(EXEC_DIR, { recursive: true, force: true });
  });

  it("evaluates all 13 governance tiers and generates .aegis/strategic-execution-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: EXEC_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = StrategicExecutionGate.evaluate(EXEC_DIR, "org_global");
    expect(cert.status).toBe("STRATEGIC_EXECUTION_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(13);
    expect(existsSync(join(EXEC_DIR, ".aegis", "strategic-execution-certificate.json"))).toBe(true);
  });
});
