import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SelfManagementGate } from "../self-management-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const SELF_MGMT_DIR = join(process.cwd(), ".tmp_test_p20_self_mgmt_gate");

describe("AEGIS Phase 20 — Self-Management Gate", () => {
  beforeEach(() => {
    if (existsSync(SELF_MGMT_DIR)) rmSync(SELF_MGMT_DIR, { recursive: true, force: true });
    mkdirSync(SELF_MGMT_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(SELF_MGMT_DIR)) rmSync(SELF_MGMT_DIR, { recursive: true, force: true });
  });

  it("evaluates all 9 governance tiers and generates .aegis/self-management-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: SELF_MGMT_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = SelfManagementGate.evaluate(SELF_MGMT_DIR);
    expect(cert.status).toBe("SELF_MANAGEMENT_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(9);
    expect(existsSync(join(SELF_MGMT_DIR, ".aegis", "self-management-certificate.json"))).toBe(true);
  });
});
