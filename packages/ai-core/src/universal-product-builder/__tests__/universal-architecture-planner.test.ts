import { describe, it, expect } from "vitest";
import { UniversalRequirementInterpreter } from "../universal-requirement-interpreter.js";
import { UniversalArchitecturePlanner } from "../universal-architecture-planner.js";

describe("AEGIS Phase 48 — Universal Architecture Planner", () => {
  it("generates full-stack blueprint while respecting user stack preferences", () => {
    const spec = UniversalRequirementInterpreter.interpret("Build an enterprise CRM application");
    const blueprint = UniversalArchitecturePlanner.planArchitecture(spec, {
      frontendFramework: "React-Vite",
      backendFramework: "Express",
      database: "PostgreSQL",
      orm: "Prisma",
    });

    expect(blueprint.domain).toBe("CRM");
    expect(blueprint.stack.frontend).toBe("React-Vite");
    expect(blueprint.stack.backend).toBe("Express");
    expect(blueprint.stack.database).toBe("PostgreSQL");
    expect(blueprint.controllers.length).toBeGreaterThanOrEqual(3);
    expect(blueprint.components.length).toBeGreaterThanOrEqual(3);
  });
});
