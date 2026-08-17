import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseCollaborationGate } from "../enterprise-collaboration-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const COLLAB_DIR = join(process.cwd(), ".tmp_test_p22_collab_gate");

describe("AEGIS Phase 22 — Enterprise Collaboration Gate", () => {
  beforeEach(() => {
    if (existsSync(COLLAB_DIR)) rmSync(COLLAB_DIR, { recursive: true, force: true });
    mkdirSync(COLLAB_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(COLLAB_DIR)) rmSync(COLLAB_DIR, { recursive: true, force: true });
  });

  it("evaluates all 11 governance tiers and generates .aegis/enterprise-collaboration-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: COLLAB_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseCollaborationGate.evaluate(COLLAB_DIR, "org_global");
    expect(cert.status).toBe("COLLABORATION_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(11);
    expect(existsSync(join(COLLAB_DIR, ".aegis", "enterprise-collaboration-certificate.json"))).toBe(true);
  });
});
