import { describe, it, expect } from "vitest";
import { DeepRequirementDecomposer } from "../deep-requirement-decomposer.js";

describe("AEGIS Phase 51 — Deep Requirement Decomposer", () => {
  it("decomposes high-level requirements into atomic UI, API, DB, and Business Logic obligations", () => {
    const obligation = DeepRequirementDecomposer.decomposeRequirement(
      {
        id: "feat_1",
        name: "Appointment Booking System",
        category: "BOOKING",
        description: "Users can book time slots with staff",
        origin: "EXPLICIT",
        isCritical: true,
        acceptanceCriteria: ["Valid slot selection", "No double bookings"],
      },
      "BOOKING"
    );

    expect(obligation.ui.views).toContain("/bookings");
    expect(obligation.api.endpoints.some((e) => e.path === "/api/bookings")).toBe(true);
    expect(obligation.database.models).toContain("Booking");
    expect(obligation.businessLogic.invariants.some((i) => i.includes("Double booking"))).toBe(true);
    expect(obligation.workflow.steps.length).toBeGreaterThanOrEqual(3);
  });
});
