import { describe, it, expect } from "vitest";
import { ProductAcceptanceEngine } from "../product-acceptance-engine.js";

describe("AEGIS Phase 45 — Product Acceptance Engine", () => {
  it("accepts product when 100% requirements and workflows pass with 0 critical defects", () => {
    const rejected = ProductAcceptanceEngine.evaluateAcceptance(
      8,
      7,
      false,
      1,
      true,
      true,
      true,
      true,
      true,
      true
    );
    expect(rejected.isAccepted).toBe(false);
    expect(rejected.status).toBe("REPAIR_REQUIRED");

    const accepted = ProductAcceptanceEngine.evaluateAcceptance(
      8,
      8,
      true,
      0,
      true,
      true,
      true,
      true,
      true,
      true
    );
    expect(accepted.isAccepted).toBe(true);
    expect(accepted.status).toBe("ACCEPTED");
  });
});
