/**
 * ProductUXCompletenessEngine
 *
 * Checks user-facing UX completeness including loading states, empty states, error states, and responsive styling.
 * Hard Invariant: FUNCTIONAL != USER-COMPLETE.
 */

export interface UXEvaluationReport {
  isUXComplete: boolean;
  hasNavigation: boolean;
  hasResponsiveLayout: boolean;
  hasLoadingStates: boolean;
  hasEmptyStates: boolean;
  hasErrorStates: boolean;
  hasAccessibilityBasics: boolean;
  uxScorePct: number; // 0 to 100
  missingUXElements: string[];
  summary: string;
}

export class ProductUXCompletenessEngine {
  public static evaluateUX(
    hasNav: boolean,
    hasResponsive: boolean,
    hasLoading: boolean,
    hasEmpty: boolean,
    hasError: boolean,
    hasA11y: boolean = true
  ): UXEvaluationReport {
    const missing: string[] = [];

    if (!hasNav) missing.push("Primary navigation or routing bar missing.");
    if (!hasResponsive) missing.push("Responsive grid/flex layouts missing.");
    if (!hasLoading) missing.push("Loading skeletons/spinners missing for asynchronous requests.");
    if (!hasEmpty) missing.push("Empty state placeholders missing when lists/tables contain 0 items.");
    if (!hasError) missing.push("Error boundary or visual feedback missing for failed operations.");
    if (!hasA11y) missing.push("ARIA labels or accessible button names missing.");

    const checksPassed = [
      hasNav,
      hasResponsive,
      hasLoading,
      hasEmpty,
      hasError,
      hasA11y,
    ].filter(Boolean).length;

    const score = Math.round((checksPassed / 6) * 100);
    const isComplete = missing.length === 0;

    return {
      isUXComplete: isComplete,
      hasNavigation: hasNav,
      hasResponsiveLayout: hasResponsive,
      hasLoadingStates: hasLoading,
      hasEmptyStates: hasEmpty,
      hasErrorStates: hasError,
      hasAccessibilityBasics: hasA11y,
      uxScorePct: score,
      missingUXElements: missing,
      summary: isComplete
        ? "Product UX verified as user-complete (navigation, loading, empty, error, accessibility)."
        : `Product UX incomplete (${score}%): ${missing.join("; ")}`,
    };
  }
}
