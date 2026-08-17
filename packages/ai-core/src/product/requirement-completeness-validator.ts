/**
 * RequirementCompletenessValidator
 *
 * Validates that 100% of user-requested requirements have completed the full
 * engineering lifecycle (REQUESTED -> PLANNED -> IMPLEMENTED -> VERIFIED).
 * Flags INCOMPLETE if any requested feature is missing or unverified.
 */

import type { RequirementTraceabilityMatrix } from "./requirement-traceability.js";

export interface RequirementCompletenessReport {
  isComplete: boolean;
  totalRequirements: number;
  verifiedCount: number;
  missingRequirements: string[];
  summary: string;
}

export class RequirementCompletenessValidator {
  public static validate(matrix: RequirementTraceabilityMatrix): RequirementCompletenessReport {
    const nodes = matrix.getAllNodes();
    const missing: string[] = [];
    let verifiedCount = 0;

    for (const node of nodes) {
      if (node.status === "VERIFIED") {
        verifiedCount++;
      } else {
        missing.push(`[${node.source}] Requirement "${node.requirementId}" for feature "${node.featureId}" is currently ${node.status}`);
      }
    }

    const isComplete = missing.length === 0 && nodes.length > 0;

    return {
      isComplete,
      totalRequirements: nodes.length,
      verifiedCount,
      missingRequirements: missing,
      summary: isComplete
        ? `REQUIREMENT COMPLETENESS VERIFIED: All ${verifiedCount}/${nodes.length} requested requirements implemented and verified with evidence.`
        : `INCOMPLETE REQUIREMENTS: ${missing.length}/${nodes.length} requirements remain unverified.`,
    };
  }
}
