import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FleetOperationsGate } from "../fleet-operations-gate.js";
import { FleetManager } from "../fleet-manager.js";

const FLEET_GATE_DIR = join(process.cwd(), ".tmp_test_p16_fleet_gate");

describe("AEGIS Phase 16 — Fleet Operations Gate", () => {
  beforeEach(() => {
    if (existsSync(FLEET_GATE_DIR)) rmSync(FLEET_GATE_DIR, { recursive: true, force: true });
    mkdirSync(FLEET_GATE_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(FLEET_GATE_DIR)) rmSync(FLEET_GATE_DIR, { recursive: true, force: true });
  });

  it("issues fleet operations certificate and generates .aegis/fleet-operations-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: FLEET_GATE_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = FleetOperationsGate.evaluate(FLEET_GATE_DIR);
    expect(cert.status).toBe("FLEET_OPERATIONAL");
    expect(cert.totalProjects).toBe(1);
    expect(existsSync(join(FLEET_GATE_DIR, ".aegis", "fleet-operations-certificate.json"))).toBe(true);
  });
});
