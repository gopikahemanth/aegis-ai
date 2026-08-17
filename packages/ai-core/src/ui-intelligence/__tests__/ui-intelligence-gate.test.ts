import { describe, it, expect } from "vitest";
import { VisualVerificationEngine } from "../visual-verification-engine.js";
import { AccessibilityEngine } from "../accessibility-engine.js";
import { DesignSystemEngine } from "../design-system-engine.js";
import { UIConsistencyEngine } from "../ui-consistency-engine.js";
import { UIQualityScoreEngine } from "../ui-quality-score-engine.js";
import { UIProductAcceptanceEngine } from "../ui-product-acceptance.js";
import { UIIntelligenceGate } from "../ui-intelligence-gate.js";

describe("AEGIS Phase 49 — UI Intelligence Gate", () => {
  it("evaluates and issues Tier 36 apex certificate for polished visual quality", () => {
    const ds = DesignSystemEngine.generateDesignSystem();
    const visual = VisualVerificationEngine.inspectPages(["/", "/login", "/dashboard"], false);
    const a11y = AccessibilityEngine.auditAccessibility(false);
    const consistency = UIConsistencyEngine.auditConsistency(ds);
    const quality = UIQualityScoreEngine.calculateQualityScore(true, true, true);

    const decision = UIProductAcceptanceEngine.evaluateUIAcceptance(visual, a11y, consistency, quality);
    const cert = UIIntelligenceGate.evaluateAndCertify(decision);

    expect(cert.gate).toBe("UIIntelligenceGate");
    expect(cert.tier).toBe(36);
    expect(cert.status).toBe("CERTIFIED");
    expect(cert.desktopVerified).toBe(true);
    expect(cert.tabletVerified).toBe(true);
    expect(cert.mobileVerified).toBe(true);
    expect(cert.accessibilityVerified).toBe(true);
    expect(cert.uiQualityScore).toBeGreaterThanOrEqual(90);
  });
});
