import { describe, it, expect } from "vitest";
import { VisualVerificationEngine } from "../visual-verification-engine.js";
import { AccessibilityEngine } from "../accessibility-engine.js";
import { DesignSystemEngine } from "../design-system-engine.js";
import { UIConsistencyEngine } from "../ui-consistency-engine.js";
import { UIQualityScoreEngine } from "../ui-quality-score-engine.js";
import { UIProductAcceptanceEngine } from "../ui-product-acceptance.js";

describe("AEGIS Phase 49 — UI Product Acceptance Engine", () => {
  it("strictly requires Desktop, Tablet, Mobile, Accessibility, and zero critical visual defects for polished acceptance", () => {
    const ds = DesignSystemEngine.generateDesignSystem();
    const visual = VisualVerificationEngine.inspectPages(["/", "/login", "/dashboard"], false);
    const a11y = AccessibilityEngine.auditAccessibility(false);
    const consistency = UIConsistencyEngine.auditConsistency(ds);
    const quality = UIQualityScoreEngine.calculateQualityScore(true, true, true);

    const decision = UIProductAcceptanceEngine.evaluateUIAcceptance(visual, a11y, consistency, quality);

    expect(decision.isAccepted).toBe(true);
    expect(decision.desktopVerified).toBe(true);
    expect(decision.tabletVerified).toBe(true);
    expect(decision.mobileVerified).toBe(true);
    expect(decision.criticalVisualDefects).toBe(0);
    expect(decision.criticalUXDefects).toBe(0);
  });
});
