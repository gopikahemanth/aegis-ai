/**
 * ProductCompletenessAnalyzer
 *
 * Analyzes the generated codebase against parsed requirement contracts to classify implementation and verification completeness.
 * Hard Invariant: GENERATED CODE != COMPLETED PRODUCT.
 */

export type FeatureCompletenessState =
  | "MISSING_FEATURE"
  | "PARTIAL_FEATURE"
  | "UNWIRED_FEATURE"
  | "BROKEN_FEATURE"
  | "UNVERIFIED_FEATURE"
  | "IMPLEMENTED_FEATURE"
  | "VERIFIED_FEATURE";

export interface RequirementAnalysisResult {
  requirementId: string;
  state: FeatureCompletenessState;
  hasUI: boolean;
  hasAPI: boolean;
  hasDatabaseModel: boolean;
  hasRuntimeVerification: boolean;
  hasBrowserWorkflowEvidence: boolean;
  defects: string[];
  completenessScore: number; // 0 to 100
  summary: string;
}

export class ProductCompletenessAnalyzer {
  public static analyzeRequirement(
    requirementId: string,
    hasUI: boolean,
    hasAPI: boolean,
    hasDB: boolean,
    hasRuntime: boolean,
    hasBrowserEvidence: boolean,
    hasUnwiredHandlers: boolean = false
  ): RequirementAnalysisResult {
    const defects: string[] = [];

    if (!hasUI && !hasAPI) {
      return {
        requirementId,
        state: "MISSING_FEATURE",
        hasUI: false,
        hasAPI: false,
        hasDatabaseModel: false,
        hasRuntimeVerification: false,
        hasBrowserWorkflowEvidence: false,
        defects: ["Feature source code completely absent."],
        completenessScore: 0,
        summary: `Requirement ${requirementId} is completely missing.`,
      };
    }

    if (hasUnwiredHandlers) {
      defects.push("Unwired event handlers or placeholder UI detected.");
      return {
        requirementId,
        state: "UNWIRED_FEATURE",
        hasUI,
        hasAPI,
        hasDatabaseModel: hasDB,
        hasRuntimeVerification: false,
        hasBrowserWorkflowEvidence: false,
        defects,
        completenessScore: 40,
        summary: `Requirement ${requirementId} contains unwired or placeholder UI handlers.`,
      };
    }

    if (!hasAPI || !hasDB) {
      defects.push("Missing backend API endpoint or database persistence model.");
      return {
        requirementId,
        state: "PARTIAL_FEATURE",
        hasUI,
        hasAPI,
        hasDatabaseModel: hasDB,
        hasRuntimeVerification: false,
        hasBrowserWorkflowEvidence: false,
        defects,
        completenessScore: 60,
        summary: `Requirement ${requirementId} is partially implemented without full-stack closure.`,
      };
    }

    if (!hasRuntime || !hasBrowserEvidence) {
      return {
        requirementId,
        state: "UNVERIFIED_FEATURE",
        hasUI,
        hasAPI,
        hasDatabaseModel: hasDB,
        hasRuntimeVerification: hasRuntime,
        hasBrowserWorkflowEvidence: hasBrowserEvidence,
        defects: ["Runtime application or browser workflow verification pending."],
        completenessScore: 80,
        summary: `Requirement ${requirementId} is implemented but lacks live runtime/browser evidence.`,
      };
    }

    return {
      requirementId,
      state: "VERIFIED_FEATURE",
      hasUI: true,
      hasAPI: true,
      hasDatabaseModel: true,
      hasRuntimeVerification: true,
      hasBrowserWorkflowEvidence: true,
      defects: [],
      completenessScore: 100,
      summary: `Requirement ${requirementId} is 100% complete and empirically verified across all layers.`,
    };
  }
}
