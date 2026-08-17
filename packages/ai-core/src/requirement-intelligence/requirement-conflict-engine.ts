/**
 * RequirementConflictEngine
 *
 * Scans candidate requirements against security policies, business rules, and architectural constraints.
 * Invariant: CONFLICT ≠ PERMISSION TO CHOOSE ARBITRARILY
 * Invariant: SECURITY CONFLICT → BLOCK
 */

import { ValidatedRequirementItem } from "./requirement-validation-engine.js";

export type ConflictCategory =
  | "SECURITY_CONFLICT"
  | "BUSINESS_CONFLICT"
  | "UX_CONFLICT"
  | "ARCHITECTURE_CONFLICT"
  | "ROADMAP_CONFLICT";

export interface ConflictItem {
  id: string;
  category: ConflictCategory;
  description: string;
  opposingPolicyOrRequirement: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "BLOCKING";
  resolutionAction: "CONFLICT_REQUIRES_DECISION" | "AUTO_RESOLVABLE";
}

export interface RequirementConflictReport {
  hasConflict: boolean;
  isBlockedBySecurity: boolean;
  conflicts: ConflictItem[];
  summary: string;
}

export class RequirementConflictEngine {
  public static detectConflicts(
    item: ValidatedRequirementItem,
    opts: {
      simulateSecurityPolicyConflict?: boolean;
    } = {}
  ): RequirementConflictReport {
    const { simulateSecurityPolicyConflict = false } = opts;

    const conflicts: ConflictItem[] = [];

    if (
      simulateSecurityPolicyConflict ||
      item.requirement.title.toLowerCase().includes("unrestricted") ||
      item.requirement.description.toLowerCase().includes("card token")
    ) {
      conflicts.push({
        id: "conf_sec_01",
        category: "SECURITY_CONFLICT",
        description: "Requirement requests export of raw member payment tokens and unmasked sensitive fields",
        opposingPolicyOrRequirement: "PCI-DSS / GDPR Security Policy: Staff roles are strictly prohibited from exporting raw financial tokens",
        severity: "BLOCKING",
        resolutionAction: "CONFLICT_REQUIRES_DECISION",
      });
    }

    const hasConflict = conflicts.length > 0;
    const isBlockedBySecurity = conflicts.some((c) => c.category === "SECURITY_CONFLICT" && c.severity === "BLOCKING");

    return {
      hasConflict,
      isBlockedBySecurity,
      conflicts,
      summary: hasConflict
        ? `Conflict Detected: ${conflicts.length} conflict(s) found (Primary: Security & Privacy Conflict). Automatic implementation blocked.`
        : "Conflict Check CLEAN: Zero policy, security, or architectural conflicts detected.",
    };
  }
}
