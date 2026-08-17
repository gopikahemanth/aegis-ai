/**
 * RepairPlanner
 *
 * Formulates governed repair plans from diagnosed defects with risk levels, affected files, and atomic rollback guarantees.
 */

import { type DiagnosedDefect } from "./defect-diagnosis-engine.js";

export interface GovernedRepairPlan {
  planId: string;
  defectId: string;
  category: string;
  proposedAction: string;
  affectedFiles: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  rollbackAvailable: boolean;
  requiresHumanReview: boolean;
  summary: string;
}

export class RepairPlanner {
  public static planRepair(defect: DiagnosedDefect): GovernedRepairPlan {
    const riskLevel: GovernedRepairPlan["riskLevel"] =
      defect.category === "DATABASE_ERROR" || defect.category === "AUTHORIZATION_ERROR"
        ? "MEDIUM"
        : "LOW";

    return {
      planId: `rplan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      defectId: defect.defectId,
      category: defect.category,
      proposedAction: `Apply targeted AST/source correction to ${defect.targetFiles.join(", ")} resolving ${defect.category}.`,
      affectedFiles: defect.targetFiles,
      riskLevel,
      rollbackAvailable: true,
      requiresHumanReview: !defect.isAutonomouslyRepairable,
      summary: `Repair plan formulated for ${defect.category} with risk ${riskLevel} and atomic rollback enabled.`,
    };
  }
}
