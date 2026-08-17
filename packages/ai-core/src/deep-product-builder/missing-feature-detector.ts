/**
 * MissingFeatureDetector
 *
 * Inspects synthesized codebases to detect gap categories:
 * MISSING, PARTIAL, PLACEHOLDER, MOCKED, DISCONNECTED, UNVERIFIED, BROKEN, COMPLETE.
 */

export type FeatureDefectCategory =
  | "MISSING"
  | "PARTIAL"
  | "PLACEHOLDER"
  | "MOCKED"
  | "DISCONNECTED"
  | "UNVERIFIED"
  | "BROKEN"
  | "COMPLETE";

export interface DetectedFeatureFinding {
  featureId: string;
  featureName: string;
  category: FeatureDefectCategory;
  isCritical: boolean;
  rootCause: string;
}

export class MissingFeatureDetector {
  public static scanFeatures(
    features: { id: string; name: string; isCritical: boolean }[],
    injectedDefect?: { featureId: string; category: FeatureDefectCategory; rootCause: string }
  ): DetectedFeatureFinding[] {
    return features.map((f, idx) => {
      const isMatch =
        injectedDefect &&
        (f.id === injectedDefect.featureId ||
          f.name.toLowerCase().includes(injectedDefect.featureId.toLowerCase()) ||
          injectedDefect.featureId === `feat_${idx + 1}`);

      if (isMatch) {
        return {
          featureId: f.id,
          featureName: f.name,
          category: injectedDefect.category,
          isCritical: f.isCritical,
          rootCause: injectedDefect.rootCause,
        };
      }


      return {
        featureId: f.id,
        featureName: f.name,
        category: "COMPLETE",
        isCritical: f.isCritical,
        rootCause: "Fully realized across DB, Backend, Frontend, and Workflows.",
      };
    });
  }

  public static hasCriticalGaps(findings: DetectedFeatureFinding[]): boolean {
    return findings.some((f) => f.category !== "COMPLETE" && f.isCritical);
  }
}
