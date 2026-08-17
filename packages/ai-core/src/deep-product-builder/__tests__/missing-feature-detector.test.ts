import { describe, it, expect } from "vitest";
import { MissingFeatureDetector } from "../missing-feature-detector.js";

describe("AEGIS Phase 51 — Missing Feature Detector", () => {
  it("detects and categorizes partial, placeholder, and disconnected features", () => {
    const features = [
      { id: "feat_1", name: "Authentication", isCritical: true },
      { id: "feat_2", name: "Payment Processing", isCritical: true },
    ];

    const findings = MissingFeatureDetector.scanFeatures(features, {
      featureId: "feat_2",
      category: "PARTIAL",
      rootCause: "Stripe payment webhook handler unverified",
    });

    expect(findings[0].category).toBe("COMPLETE");
    expect(findings[1].category).toBe("PARTIAL");
    expect(MissingFeatureDetector.hasCriticalGaps(findings)).toBe(true);
  });
});
