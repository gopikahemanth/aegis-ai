/**
 * KnowledgeRevalidationEngine
 *
 * Continuously evaluates whether active organizational lessons and knowledge remain valid against current telemetry.
 * Hard Invariant: OLD KNOWLEDGE != CURRENT TRUTH.
 */

export type RevalidationStatus =
  | "VALID"
  | "AGING"
  | "STALE"
  | "EXPIRED"
  | "CONTRADICTED"
  | "REQUIRES_REVALIDATION";

export interface RevalidationEvaluationReport {
  knowledgeId: string;
  status: RevalidationStatus;
  ageDays: number;
  isAuthoritative: boolean;
  architectureDriftDetected: boolean;
  hasContradictoryTelemetry: boolean;
  recommendedAction: "KEEP" | "REVALIDATE" | "RETIRE" | "INVESTIGATE";
  summary: string;
}

export class KnowledgeRevalidationEngine {
  public static evaluateRevalidation(
    knowledgeId: string,
    ageDays: number,
    archDrift: boolean = false,
    contradictoryTelemetry: boolean = false
  ): RevalidationEvaluationReport {
    let status: RevalidationStatus = "VALID";
    let isAuth = true;
    let rec: RevalidationEvaluationReport["recommendedAction"] = "KEEP";

    if (contradictoryTelemetry) {
      status = "CONTRADICTED";
      isAuth = false;
      rec = "INVESTIGATE";
    } else if (archDrift) {
      status = "REQUIRES_REVALIDATION";
      isAuth = false;
      rec = "REVALIDATE";
    } else if (ageDays > 180) {
      status = "EXPIRED";
      isAuth = false;
      rec = "RETIRE";
    } else if (ageDays > 90) {
      status = "STALE";
      isAuth = false;
      rec = "REVALIDATE";
    } else if (ageDays > 30) {
      status = "AGING";
      rec = "KEEP";
    }

    return {
      knowledgeId,
      status,
      ageDays,
      isAuthoritative: isAuth,
      architectureDriftDetected: archDrift,
      hasContradictoryTelemetry: contradictoryTelemetry,
      recommendedAction: rec,
      summary: `Knowledge ${knowledgeId} revalidated with status ${status}. Authoritative: ${isAuth}.`,
    };
  }
}
