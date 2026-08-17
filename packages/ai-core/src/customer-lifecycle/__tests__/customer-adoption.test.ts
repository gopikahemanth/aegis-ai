import { describe, it, expect } from "vitest";
import { CustomerAdoptionEngine } from "../customer-adoption-engine.js";

describe("AEGIS Phase 38 — Customer Adoption Engine", () => {
  it("measures feature adoption percentage and adoption velocity", () => {
    const report = CustomerAdoptionEngine.evaluateAdoption("cust_1", "proj_gym", 8, 10, 30, 0.25);
    expect(report.adoptionPercentage).toBe(80);
    expect(report.velocity).toBe("INCREASING");
    expect(report.weeklyUsageFrequency).toBe(30);
  });
});
