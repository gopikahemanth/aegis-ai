import { describe, it, expect } from "vitest";
import { SubsystemCoordinator } from "../subsystem-coordinator.js";

describe("AEGIS Phase 50 — Subsystem Coordinator", () => {
  it("coordinates execution dependencies between stages cleanly", () => {
    const plan = SubsystemCoordinator.getExecutionPlan();

    expect(plan.length).toBe(9);
    expect(plan.every((p) => p.status === "COMPLETED")).toBe(true);

    const validTransition = SubsystemCoordinator.validateDependencies(
      ["REQUIREMENTS", "DOMAIN_MODEL", "ARCHITECTURE"],
      "BACKEND_DATABASE"
    );
    expect(validTransition).toBe(true);
  });
});
