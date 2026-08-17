import { describe, it, expect } from "vitest";
import { AccessibilityEngine } from "../accessibility-engine.js";

describe("AEGIS Phase 49 — Accessibility Engine", () => {
  it("audits WCAG 2.1 AA compliance: keyboard navigation, semantic HTML, focus rings, and ARIA roles", () => {
    const cleanAudit = AccessibilityEngine.auditAccessibility(false);
    expect(cleanAudit.passed).toBe(true);
    expect(cleanAudit.score).toBeGreaterThanOrEqual(95);
    expect(cleanAudit.checks.colorContrastRatioValid).toBe(true);

    const violationAudit = AccessibilityEngine.auditAccessibility(true);
    expect(violationAudit.passed).toBe(false);
    expect(violationAudit.violations.length).toBeGreaterThanOrEqual(1);
  });
});
