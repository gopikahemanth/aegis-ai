import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EnterpriseCustomerLifecycleGate } from "../enterprise-customer-lifecycle-gate.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

const CUST_LIFE_DIR = join(process.cwd(), ".tmp_test_p38_cust_gate");

describe("AEGIS Phase 38 — Enterprise Customer Lifecycle Gate", () => {
  beforeEach(() => {
    if (existsSync(CUST_LIFE_DIR)) rmSync(CUST_LIFE_DIR, { recursive: true, force: true });
    mkdirSync(CUST_LIFE_DIR, { recursive: true });
    FleetManager.reset();
  });

  afterEach(() => {
    if (existsSync(CUST_LIFE_DIR)) rmSync(CUST_LIFE_DIR, { recursive: true, force: true });
  });

  it("evaluates all 27 governance tiers and generates .aegis/customer-lifecycle-certificate.json", () => {
    FleetManager.registerProject({
      projectId: "gym_proj",
      name: "Gym Management",
      projectPath: CUST_LIFE_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const cert = EnterpriseCustomerLifecycleGate.evaluate(CUST_LIFE_DIR, "org_global");
    expect(cert.status).toBe("CUSTOMER_LIFECYCLE_CERTIFIED");
    expect(cert.totalCertifiedGates).toBe(27);
    expect(existsSync(join(CUST_LIFE_DIR, ".aegis", "customer-lifecycle-certificate.json"))).toBe(true);
  });
});
