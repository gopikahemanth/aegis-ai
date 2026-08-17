/**
 * KnowledgeActionPlanner
 *
 * Converts approved recommendations into structured action plans preserving full lineage.
 * Lineage: Evidence -> Synthesis -> Insight -> Recommendation -> Action Plan.
 */

export interface ActionPlanLineage {
  evidenceIds: string[];
  synthesisId: string;
  insightId: string;
  recommendationId: string;
}

export interface KnowledgeActionPlan {
  planId: string;
  sourceInsightId: string;
  title: string;
  objectives: string[];
  affectedProjects: string[];
  affectedDomains: string[];
  dependencies: string[];
  prerequisites: string[];
  expectedOutcome: string;
  risk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  rollbackStrategy: string;
  authorizationRequirement: string;
  verificationCriteria: string[];
  lineage: ActionPlanLineage;
  status: "DRAFT" | "READY_FOR_REVIEW" | "AUTHORIZED" | "EXECUTING" | "VERIFYING" | "COMPLETED" | "BLOCKED" | "ROLLED_BACK";
  createdAt: string;
}

export class KnowledgeActionPlanner {
  public static createPlan(
    sourceInsightId: string,
    title: string,
    objectives: string[],
    affectedProjects: string[],
    affectedDomains: string[],
    lineage: ActionPlanLineage,
    risk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "MODERATE"
  ): KnowledgeActionPlan {
    return {
      planId: `act_plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sourceInsightId,
      title,
      objectives,
      affectedProjects,
      affectedDomains,
      dependencies: ["Fleet Node Synchronization", "Baseline Schema Lock"],
      prerequisites: ["Verification Matrix Clean", "Zero-Mutation Simulation Complete"],
      expectedOutcome: "Standardized multi-project architectural resiliency with zero runtime regression.",
      risk,
      rollbackStrategy: "Atomic git commit reversal and configuration checkpoint restore.",
      authorizationRequirement: risk === "LOW" ? "AUTO_SAFE" : "REQUIRES_AUTHORIZATION",
      verificationCriteria: [
        "API Workflow verification passes with 100% success",
        "Database pool saturation metrics remain under 70%",
        "Telemetry latency regression < 2%",
      ],
      lineage,
      status: "READY_FOR_REVIEW",
      createdAt: new Date().toISOString(),
    };
  }
}
