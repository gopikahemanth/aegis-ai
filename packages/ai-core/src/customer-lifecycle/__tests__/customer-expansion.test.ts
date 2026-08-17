import { describe, it, expect } from "vitest";
import { CustomerExpansionEngine } from "../customer-expansion-engine.js";

describe("AEGIS Phase 38 — Customer Expansion Engine", () => {
  it("discovers evidence-backed expansion opportunities for healthy customers", () => {
    const opps = CustomerExpansionEngine.discoverExpansion("cust_1", "proj_gym", 88, 90, 250);
    expect(opps.length).toBeGreaterThan(0);
    expect(opps.some((o) => o.expansionType === "PRODUCT_EXPANSION")).toBe(true);
    expect(opps.some((o) => o.expansionType === "CAPACITY_EXPANSION")).toBe(true);
    expect(opps[0].readinessScore).toBeGreaterThanOrEqual(0.85);
  });
});
