/**
 * UIProductAcceptanceEngine
 *
 * Enforces strict UI/UX product acceptance criteria:
 * Required pages + Desktop verified + Tablet verified + Mobile verified + Accessibility pass + 0 Critical visual/UX defects.
 * Hard Invariant: FUNCTIONALLY COMPLETE != VISUALLY COMPLETE (Both required for finished product).
 */

import { type VisualVerificationSuiteReport } from "./visual-verification-engine.js";
import { type AccessibilityAuditResult } from "./accessibility-engine.js";
import { type UIConsistencyReport } from "./ui-consistency-engine.js";
import { type UIQualityBreakdown } from "./ui-quality-score-engine.js";

export interface UIAcceptanceDecision {
  isAccepted: boolean;
  pagesVerifiedCount: number;
  desktopVerified: boolean;
  tabletVerified: boolean;
  mobileVerified: boolean;
  accessibilityPassed: boolean;
  consistencyPassed: boolean;
  criticalVisualDefects: number;
  criticalUXDefects: number;
  qualityScore: UIQualityBreakdown;
  blockers: string[];
  summary: string;
}

export class UIProductAcceptanceEngine {
  public static evaluateUIAcceptance(
    visualReport: VisualVerificationSuiteReport,
    a11yReport: AccessibilityAuditResult,
    consistencyReport: UIConsistencyReport,
    qualityScore: UIQualityBreakdown
  ): UIAcceptanceDecision {
    const blockers: string[] = [];

    if (visualReport.failedInspections > 0) {
      blockers.push(`${visualReport.failedInspections} visual inspection(s) failed layout or render checks.`);
    }

    if (!a11yReport.passed) {
      blockers.push(`Accessibility audit failed: ${a11yReport.violations.join(", ")}`);
    }

    if (!consistencyReport.isConsistent) {
      blockers.push(`UI consistency audit found ${consistencyReport.defects.length} token drift defect(s).`);
    }

    const desktopVerified = visualReport.inspections.filter((i) => i.device === "DESKTOP").every((i) => i.rendersCleanly);
    const tabletVerified = visualReport.inspections.filter((i) => i.device === "TABLET").every((i) => i.rendersCleanly);
    const mobileVerified = visualReport.inspections.filter((i) => i.device === "MOBILE").every((i) => i.rendersCleanly);

    const isAccepted = blockers.length === 0 && qualityScore.isPolished;

    return {
      isAccepted,
      pagesVerifiedCount: visualReport.inspections.length / 3,
      desktopVerified,
      tabletVerified,
      mobileVerified,
      accessibilityPassed: a11yReport.passed,
      consistencyPassed: consistencyReport.isConsistent,
      criticalVisualDefects: visualReport.failedInspections,
      criticalUXDefects: consistencyReport.defects.length,
      qualityScore,
      blockers,
      summary: isAccepted
        ? `UI/UX Acceptance PASSED: All viewports (Desktop, Tablet, Mobile), Accessibility (${qualityScore.accessibility}), and Design Tokens verified with overall score ${qualityScore.overallScore}/100.`
        : `UI/UX Acceptance FAILED: ${blockers.join(" ")}`,
    };
  }
}
