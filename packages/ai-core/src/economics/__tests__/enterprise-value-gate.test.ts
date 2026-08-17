import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseValueGate } from "../enterprise-value-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const VAL_DIR = join(process.cwd(), ".tmp_test_p26_val_gate");

describe("AEGIS Phase 26 — Enterprise Value Gate", () => {
  beforeEach(() => {
    if (existsSync(VAL_DIR)) rmSync(VAL_DIR, { recursive: true, force: true });
    mkdirSync(VAL_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(VAL_DIR)) rmSync(VAL_DIR, { recursive: true, force: true });
  });

  it("evaluates all 15 governance tiers and generates .aegis/enterprise-value-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: VAL_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseValueGate.evaluate(VAL_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_VALUE_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(15);
    expect(existsSync(join(VAL_DIR, ".aegis", "enterprise-value-certificate.json"))).toBe(true);
  });
});
