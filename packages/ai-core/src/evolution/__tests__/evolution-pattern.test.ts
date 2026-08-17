import { describe, it, expect } from "vitest";
import { EvolutionPatternEngine } from "../evolution-pattern-engine.js";

describe("AEGIS Phase 35 — Evolution Pattern Engine", () => {
  it("detects REPEATED_ROLLBACK when multiple rollbacks occur on a component", () => {
    const finding = EvolutionPatternEngine.detectPatterns("LegacyGateway", 1, 3);
    expect(finding.patternType).toBe("REPEATED_ROLLBACK");
    expect(finding.systemicSeverity).toBe("HIGH");
  });

  it("detects REPEATED_ARCHITECTURAL_FAILURE when component has frequent incidents", () => {
    const finding = EvolutionPatternEngine.detectPatterns("AuthService", 4, 0);
    expect(finding.patternType).toBe("REPEATED_ARCHITECTURAL_FAILURE");
    expect(finding.systemicSeverity).toBe("CRITICAL");
  });
});
