import { describe, it, expect } from "vitest";
import { InnovationPatternEngine } from "../innovation-pattern-engine.js";

describe("AEGIS Phase 36 — Innovation Pattern Engine", () => {
  it("detects REPEATED_CUSTOMER_REQUEST when demand is elevated", () => {
    const finding = InnovationPatternEngine.detectPatterns("MemberAnalytics", 6, 0);
    expect(finding.patternType).toBe("REPEATED_CUSTOMER_REQUEST");
    expect(finding.strategicSeverity).toBe("HIGH");
  });

  it("detects REPEATED_FAILED_EXPERIMENT when multiple experiments fail", () => {
    const finding = InnovationPatternEngine.detectPatterns("GamificationBadges", 1, 3);
    expect(finding.patternType).toBe("REPEATED_FAILED_EXPERIMENT");
    expect(finding.strategicSeverity).toBe("HIGH");
  });
});
