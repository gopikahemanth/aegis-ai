import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PredictiveResilienceGate } from "../predictive-resilience-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const PRED_DIR = join(process.cwd(), ".tmp_test_p29_pred_gate");

describe("AEGIS Phase 29 — Predictive Resilience Gate", () => {
  beforeEach(() => {
    if (existsSync(PRED_DIR)) rmSync(PRED_DIR, { recursive: true, force: true });
    mkdirSync(PRED_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(PRED_DIR)) rmSync(PRED_DIR, { recursive: true, force: true });
  });

  it("evaluates all 18 governance tiers and generates .aegis/predictive-resilience-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: PRED_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = PredictiveResilienceGate.evaluate(PRED_DIR, "org_global");
    expect(cert.status).toBe("PREDICTIVE_RESILIENCE_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(18);
    expect(existsSync(join(PRED_DIR, ".aegis", "predictive-resilience-certificate.json"))).toBe(true);
  });
});
