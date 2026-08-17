/**
 * InsightActionMapper
 *
 * Maps validated Phase 42 insights into possible governed organizational actions.
 * Hard Invariant: INSIGHT != ACTION. An insight never directly executes an action.
 */

export type KnowledgeActionClass =
  | "MONITOR"
  | "INVESTIGATE"
  | "STANDARDIZE"
  | "OPTIMIZE"
  | "REMEDIATE"
  | "REPLAN"
  | "SIMULATE"
  | "REQUEST_REVIEW"
  | "REQUEST_AUTHORIZATION"
  | "NO_ACTION";

export interface ActionProposal {
  proposalId: string;
  sourceInsightId: string;
  actionClass: KnowledgeActionClass;
  title: string;
  description: string;
  evidenceIds: string[];
  confidence: number;
  affectedDomains: string[];
  affectedProjects: string[];
  expectedOutcome: string;
  riskClassification: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  authorizationRequirement: "AUTO_SAFE" | "REQUIRES_AUTHORIZATION" | "REQUIRES_MULTI_ROLE_REVIEW" | "MANUAL_ONLY";
  createdAt: string;
}

export class InsightActionMapper {
  public static mapInsightToAction(
    insightId: string,
    actionClass: KnowledgeActionClass,
    title: string,
    description: string,
    evidenceIds: string[],
    domains: string[],
    projects: string[],
    expectedOutcome: string,
    risk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "MODERATE"
  ): ActionProposal {
    let authReq: ActionProposal["authorizationRequirement"] = "REQUIRES_AUTHORIZATION";
    if (risk === "CRITICAL" || projects.length >= 5) {
      authReq = "REQUIRES_MULTI_ROLE_REVIEW";
    } else if (actionClass === "MONITOR" || actionClass === "SIMULATE") {
      authReq = "AUTO_SAFE";
    } else if (actionClass === "REMEDIATE" && risk === "HIGH") {
      authReq = "MANUAL_ONLY";
    }

    return {
      proposalId: `prop_act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sourceInsightId: insightId,
      actionClass,
      title,
      description,
      evidenceIds,
      confidence: evidenceIds.length >= 2 ? 0.95 : 0.8,
      affectedDomains: domains,
      affectedProjects: projects,
      expectedOutcome,
      riskClassification: risk,
      authorizationRequirement: authReq,
      createdAt: new Date().toISOString(),
    };
  }
}
