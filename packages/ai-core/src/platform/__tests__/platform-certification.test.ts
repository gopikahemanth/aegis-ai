import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PlatformCertificationGate } from "../platform-certification-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const PLATFORM_CERT_DIR = join(process.cwd(), ".tmp_test_p18_platform_cert");

describe("AEGIS Phase 18 — Supreme Platform Certification Gate", () => {
  beforeEach(() => {
    if (existsSync(PLATFORM_CERT_DIR)) rmSync(PLATFORM_CERT_DIR, { recursive: true, force: true });
    mkdirSync(PLATFORM_CERT_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(PLATFORM_CERT_DIR)) rmSync(PLATFORM_CERT_DIR, { recursive: true, force: true });
  });

  it("evaluates all 20 dimensions and issues supreme platform certificate at .aegis/platform-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: PLATFORM_CERT_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = PlatformCertificationGate.evaluate(PLATFORM_CERT_DIR);
    expect(cert.status).toBe("PLATFORM_CERTIFIED");
    expect(cert.governanceGatesPassed).toBe(7);
    expect(existsSync(join(PLATFORM_CERT_DIR, ".aegis", "platform-certificate.json"))).toBe(true);
  });
});
