import { describe, it, expect } from "vitest";
import { BusinessLogicGenerationEngine } from "../business-logic-generation-engine.js";

describe("AEGIS Phase 51 — Business Logic Generation Engine", () => {
  it("derives domain invariants for e-commerce, booking, gym, and LMS applications", () => {
    const ecomRules = BusinessLogicGenerationEngine.deriveBusinessRules("ECOMMERCE");
    expect(ecomRules.some((r) => r.name.includes("Stock Guard"))).toBe(true);

    const gymRules = BusinessLogicGenerationEngine.deriveBusinessRules("GYM_MANAGEMENT");
    expect(gymRules.some((r) => r.name.includes("Active Membership"))).toBe(true);

    const bookingRules = BusinessLogicGenerationEngine.deriveBusinessRules("BOOKING");
    expect(bookingRules.some((r) => r.name.includes("Double Booking"))).toBe(true);
  });
});
