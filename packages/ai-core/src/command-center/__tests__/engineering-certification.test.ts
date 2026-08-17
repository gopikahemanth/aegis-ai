import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EngineeringCertificationGate } from "../engineering-certification-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const CERT_GATE_DIR = join(process.cwd(), ".tmp_test_p17_cert_gate");

describe("AEGIS Phase 17 — Master Engineering Certification Gate", () => {
  beforeEach(() => {
    if (existsSync(CERT_GATE_DIR)) rmSync(CERT_GATE_DIR, { recursive: true, force: true });
    mkdirSync(CERT_GATE_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(CERT_GATE_DIR)) rmSync(CERT_GATE_DIR, { recursive: true, force: true });
  });

  it("evaluates all 17 dimensions and issues master engineering certificate at .aegis/engineering-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: CERT_GATE_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EngineeringCertificationGate.evaluate(CERT_GATE_DIR);
    expect(cert.status).toBe("ENGINEERING_CERTIFIED");
    expect(existsSync(join(CERT_GATE_DIR, ".aegis", "engineering-certificate.json"))).toBe(true);
  });
});
