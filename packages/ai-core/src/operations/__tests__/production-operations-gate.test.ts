import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ProductionOperationsGate } from "../production-operations-gate.js";
import { IncidentEngine } from "../incident-engine.js";
import { ProductionStateManager } from "../production-state.js";
import type { ReleaseCertificate } from "../../production/production-release-gate.js";

const OPS_GATE_DIR = join(process.cwd(), ".tmp_test_p15_ops_gate");

describe("AEGIS Phase 15 — Production Operations Gate", () => {
  beforeEach(() => {
    if (existsSync(OPS_GATE_DIR)) rmSync(OPS_GATE_DIR, { recursive: true, force: true });
    mkdirSync(OPS_GATE_DIR, { recursive: true });
    IncidentEngine.reset();
    ProductionStateManager.reset();
  });

  afterEach(() => {
    if (existsSync(OPS_GATE_DIR)) rmSync(OPS_GATE_DIR, { recursive: true, force: true });
  });

  it("issues operations certificate when environment and health are operational", async () => {
    const mockReleaseCert: ReleaseCertificate = {
      certificateId: "cert_rel_101",
      releaseId: "rel_101",
      projectId: "gym_proj",
      generationId: "gen_1",
      issuedAt: new Date().toISOString(),
      status: "RELEASED",
      scores: {
        productSuccess: "SUCCESS",
        securityAudit: "PASS",
        dependencyAudit: "PASS",
        performance: "PERFORMANCE_PASS",
        environment: "AVAILABLE",
      },
      hashes: {},
      blockers: [],
      summary: "Release ready.",
    };

    const cert = await ProductionOperationsGate.evaluate({
      projectPath: OPS_GATE_DIR,
      projectId: "gym_proj",
      environment: "production",
      releaseCertificate: mockReleaseCert,
      liveServerUrl: "http://127.0.0.1:42173",
    });

    expect(cert.status).toBe("SUCCESS");
    expect(cert.blockers.length).toBe(0);
    expect(existsSync(join(OPS_GATE_DIR, ".aegis", "operations-certificate.json"))).toBe(true);
  });
});
