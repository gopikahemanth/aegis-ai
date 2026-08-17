import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseReliabilityOrchestrationGate } from "../enterprise-reliability-orchestration-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const REL_DIR = join(process.cwd(), ".tmp_test_p30_rel_gate");

describe("AEGIS Phase 30 — Enterprise Reliability Orchestration Gate", () => {
  beforeEach(() => {
    if (existsSync(REL_DIR)) rmSync(REL_DIR, { recursive: true, force: true });
    mkdirSync(REL_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(REL_DIR)) rmSync(REL_DIR, { recursive: true, force: true });
  });

  it("evaluates all 19 governance tiers and generates .aegis/enterprise-reliability-orchestration-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: REL_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseReliabilityOrchestrationGate.evaluate(REL_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_RELIABILITY_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(19);
    expect(existsSync(join(REL_DIR, ".aegis", "enterprise-reliability-orchestration-certificate.json"))).toBe(true);
  });
});
