import { describe, it, expect } from "vitest";
import { ProductValueIntelligenceEngine } from "../product-value-intelligence.js";

describe("AEGIS Phase 37 — Product Value Intelligence Engine", () => {
  it("calculates verified product value and enforces distinction between unverified and verified value", () => {
    const verified = ProductValueIntelligenceEngine.calculateValue(
      "feat_attendance",
      88,
      14,
      8,
      150000,
      25000,
      true
    );
    expect(verified.isVerifiedValue).toBe(true);
    expect(verified.verifiedValueINR).toBe(150000);
    expect(verified.roi).toBe(6.0);

    const unverified = ProductValueIntelligenceEngine.calculateValue(
      "feat_attendance",
      88,
      14,
      8,
      150000,
      25000,
      false
    );
    expect(unverified.isVerifiedValue).toBe(false);
    expect(unverified.verifiedValueINR).toBe(0);
  });
});
