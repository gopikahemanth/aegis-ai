import { describe, it, expect } from "vitest";
import { ChangePatternEngine } from "../change-pattern-engine.js";

describe("AEGIS Phase 34 — Change Pattern Engine", () => {
  it("detects HIGH_RISK_COMPONENT when recurring failure pattern is observed", () => {
    const finding = ChangePatternEngine.detectPatterns("LegacyPaymentGateway", 2, 4);
    expect(finding.patternType).toBe("HIGH_RISK_COMPONENT");
    expect(finding.riskSeverity).toBe("HIGH");
  });

  it("detects REPEATED_SUCCESS on stable components", () => {
    const finding = ChangePatternEngine.detectPatterns("MemberServiceCore", 15, 0);
    expect(finding.patternType).toBe("REPEATED_SUCCESS");
    expect(finding.riskSeverity).toBe("LOW");
  });
});
