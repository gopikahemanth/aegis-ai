/**
 * KnowledgeContradictionEngine
 *
 * Detects conflicting organizational lessons without silently deleting historical evidence.
 * Hard Invariant: CONTRADICTION != AUTOMATIC RESOLUTION.
 */

export type ContradictionStatus =
  | "NO_CONTRADICTION"
  | "POTENTIAL_CONTRADICTION"
  | "CONFIRMED_CONTRADICTION"
  | "RESOLUTION_REQUIRED";

export interface ContradictionReport {
  contradictionId: string;
  claimA: {
    lessonId: string;
    statement: string;
    evidenceIds: string[];
  };
  claimB: {
    lessonId: string;
    statement: string;
    evidenceIds: string[];
  };
  status: ContradictionStatus;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  affectedDomains: string[];
  recommendedAction: string;
  detectedAt: string;
}

export class KnowledgeContradictionEngine {
  public static detectContradiction(
    lessonAId: string,
    statementA: string,
    evidenceA: string[],
    lessonBId: string,
    statementB: string,
    evidenceB: string[],
    domains: string[]
  ): ContradictionReport {
    const aLower = statementA.toLowerCase();
    const bLower = statementB.toLowerCase();

    let status: ContradictionStatus = "NO_CONTRADICTION";
    let severity: ContradictionReport["severity"] = "LOW";
    let action = "No conflict detected.";

    const hasConflictKeywords =
      (aLower.includes("resolved") && (bLower.includes("contention") || bLower.includes("caused failure"))) ||
      (aLower.includes("safe") && bLower.includes("failure")) ||
      (aLower.includes("reduced latency") && bLower.includes("degraded latency")) ||
      (aLower.includes("increase") && bLower.includes("decrease")) ||
      (aLower.includes("faster") && bLower.includes("slower"));

    if (hasConflictKeywords) {
      status = "CONFIRMED_CONTRADICTION";
      severity = "HIGH";
      action = "Initiate governed multi-role architectural review to establish environmental context.";
    } else if (aLower.includes("conflict") || bLower.includes("conflict")) {
      status = "POTENTIAL_CONTRADICTION";
      severity = "MODERATE";
      action = "Execute zero-mutation scenario simulation across conflicting configurations.";
    }

    return {
      contradictionId: `ctrd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      claimA: {
        lessonId: lessonAId,
        statement: statementA,
        evidenceIds: evidenceA,
      },
      claimB: {
        lessonId: lessonBId,
        statement: statementB,
        evidenceIds: evidenceB,
      },
      status,
      severity,
      affectedDomains: domains,
      recommendedAction: action,
      detectedAt: new Date().toISOString(),
    };
  }
}
