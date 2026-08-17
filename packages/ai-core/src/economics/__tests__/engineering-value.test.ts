import { describe, it, expect } from "vitest";
import { EngineeringValueEngine } from "../engineering-value-engine.js";

describe("AEGIS Phase 26 — Engineering Value Engine", () => {
  it("computes realized value based strictly on verified outcome evidence", () => {
    const assessment = EngineeringValueEngine.assessValue("init_1", "proj_core", 100000, 95, true);
    expect(assessment.classification).toBe("REALIZED");
    expect(assessment.realizedValueINR).toBe(95000);
    expect(assessment.realizationPercentage).toBe(95);
  });

  it("classifies value as INSUFFICIENT_EVIDENCE when runtime outcome telemetry is missing", () => {
    const assessment = EngineeringValueEngine.assessValue("init_1", "proj_core", 100000, 95, false);
    expect(assessment.classification).toBe("INSUFFICIENT_EVIDENCE");
    expect(assessment.realizedValueINR).toBe(0);
  });
});
