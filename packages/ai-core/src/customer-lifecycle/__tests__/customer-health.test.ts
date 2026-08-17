import { describe, it, expect } from "vitest";
import { CustomerHealthEngine } from "../customer-health-engine.js";

describe("AEGIS Phase 38 — Customer Health Engine", () => {
  it("calculates composite health score from adoption, engagement, reliability, and support metrics", () => {
    const report = CustomerHealthEngine.calculateHealth("cust_1", "proj_gym", 85, 90, 99.9, 0);
    expect(report.healthScore).toBeGreaterThanOrEqual(80);
    expect(report.status).toBe("HEALTHY");
  });

  it("classifies health as AT_RISK or CRITICAL when support friction and downtime are high", () => {
    const report = CustomerHealthEngine.calculateHealth("cust_2", "proj_gym", 20, 20, 90.0, 4);
    expect(report.healthScore).toBeLessThan(50);
    expect(["AT_RISK", "CRITICAL"]).toContain(report.status);
  });
});
