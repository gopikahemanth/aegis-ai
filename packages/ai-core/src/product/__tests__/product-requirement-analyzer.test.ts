import { describe, it, expect } from "vitest";
import { ProductRequirementAnalyzer } from "../product-requirement-analyzer.js";

describe("ProductRequirementAnalyzer", () => {
  it("converts natural language requests into structured ProductSpecification with explicit and inferred requirements", () => {
    const spec = ProductRequirementAnalyzer.analyze(
      "Build a gym management application where staff can manage members, track attendance, and record workouts"
    );

    expect(spec.version).toBe(1);
    expect(spec.entities).toContain("Member");
    expect(spec.entities).toContain("Trainer");
    expect(spec.entities).toContain("MemberAttendance");
    expect(spec.entities).toContain("Workout");
    expect(spec.features).toContain("members");
    expect(spec.features).toContain("attendance");
    expect(spec.features).toContain("workouts");

    // Inferred requirements
    const authReq = spec.requirements.find((r) => r.category === "auth");
    expect(authReq?.source).toBe("INFERRED");
    expect(authReq?.confidence).toBe("HIGH");

    // Deterministic hash
    expect(spec.productSpecificationHash).toBeDefined();
    expect(spec.productSpecificationHash.length).toBe(12);
  });
});
