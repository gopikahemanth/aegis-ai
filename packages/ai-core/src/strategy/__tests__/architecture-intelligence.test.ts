import { describe, it, expect } from "vitest";
import { ArchitectureIntelligenceEngine } from "../architecture-intelligence.js";

describe("AEGIS Phase 23 — Architecture Intelligence Engine", () => {
  it("detects cross-project architectural divergence across database stacks", () => {
    const findings = ArchitectureIntelligenceEngine.analyzePortfolioArchitectures([
      { projectId: "proj_1", frontend: "React", backend: "Express", database: "PostgreSQL" },
      { projectId: "proj_2", frontend: "React", backend: "Express", database: "MongoDB" },
    ]);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe("ARCHITECTURE_DIVERGENCE");
    expect(findings[0].recommendation).toContain("PostgreSQL");
  });
});
