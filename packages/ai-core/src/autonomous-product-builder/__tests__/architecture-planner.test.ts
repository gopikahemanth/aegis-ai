import { describe, it, expect } from "vitest";
import { ProductArchitecturePlanner } from "../architecture-planner.js";

describe("AEGIS Phase 46 — Architecture Planner", () => {
  it("formulates full-stack architecture plans with frontend, backend, models, and auth specs", () => {
    const plan = ProductArchitecturePlanner.planArchitecture("GymPortal", "Gym management with members and trainers");

    expect(plan.projectName).toBe("GymPortal");
    expect(plan.frontend.framework).toBe("React-Vite");
    expect(plan.backend.framework).toBe("Express");
    expect(plan.database.engine).toBe("PostgreSQL");
    expect(plan.database.models).toContain("Member");
    expect(plan.database.models).toContain("Trainer");
    expect(plan.auth.strategy).toBe("JWT");
  });
});
