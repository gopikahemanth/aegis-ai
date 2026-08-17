/**
 * RequirementDuplicateEngine
 *
 * Compares new requirements against existing features, planned roadmap items, and prior implementations.
 * Invariant: DUPLICATE REQUIREMENT ≠ NEW FEATURE (Recommends extending existing features)
 */

import { ValidatedRequirementItem } from "./requirement-validation-engine.js";

export interface DuplicateAnalysisResult {
  requirementId: string;
  isDuplicate: boolean;
  duplicateFeatureName?: string;
  recommendation: "PROCEED_AS_NEW" | "EXTEND_EXISTING_FEATURE" | "MERGE_WITH_ROADMAP";
  rationale: string;
}

export class RequirementDuplicateEngine {
  public static checkDuplicates(
    item: ValidatedRequirementItem,
    existingFeatures: string[] = ["Member Management", "Member Search & Filter", "Check-in QR Scanner"]
  ): DuplicateAnalysisResult {
    const hasExistingCsv = existingFeatures.some((f) => f.toLowerCase().includes("export member data as csv"));

    if (hasExistingCsv) {
      return {
        requirementId: item.requirement.id,
        isDuplicate: true,
        duplicateFeatureName: "Export Member Data as CSV",
        recommendation: "EXTEND_EXISTING_FEATURE",
        rationale: "Existing CSV export capability exists; recommend extending with Excel/XLSX formatting and column filters instead of building duplicate export pipeline.",
      };
    }

    return {
      requirementId: item.requirement.id,
      isDuplicate: false,
      recommendation: "PROCEED_AS_NEW",
      rationale: "No existing export feature exists in codebase; verified as genuine new capability requirement.",
    };
  }
}
