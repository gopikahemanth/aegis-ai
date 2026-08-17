import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseProductIntelligenceGate } from "../enterprise-product-intelligence-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const PROD_INTEL_DIR = join(process.cwd(), ".tmp_test_p37_prod_gate");

describe("AEGIS Phase 37 — Enterprise Product Intelligence Gate", () => {
  beforeEach(() => {
    if (existsSync(PROD_INTEL_DIR)) rmSync(PROD_INTEL_DIR, { recursive: true, force: true });
    mkdirSync(PROD_INTEL_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(PROD_INTEL_DIR)) rmSync(PROD_INTEL_DIR, { recursive: true, force: true });
  });

  it("evaluates all 26 governance tiers and generates .aegis/enterprise-product-intelligence-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: PROD_INTEL_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseProductIntelligenceGate.evaluate(PROD_INTEL_DIR, "org_global");
    expect(cert.status).toBe("ENTERPRISE_PRODUCT_INTELLIGENCE_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(26);
    expect(existsSync(join(PROD_INTEL_DIR, ".aegis", "enterprise-product-intelligence-certificate.json"))).toBe(true);
  });
});
