import { describe, it, expect } from "vitest";
import { ArchitectureImprovementEngine } from "../architecture-improvement-engine.js";

describe("AEGIS Phase 35 — Architecture Improvement Engine", () => {
  it("detects excessive coupling and generates decoupled architecture recommendations", () => {
    const findings = ArchitectureImprovementEngine.analyzeArchitecture(6, 2, 55);
    expect(findings.length).toBe(2);
    expect(findings[0].actionType).toBe("REDUCE_DEPENDENCY_COUPLING");
    expect(findings[1].actionType).toBe("REMOVE_DUPLICATION");
  });
});
