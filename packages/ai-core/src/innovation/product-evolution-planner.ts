/**
 * ProductEvolutionPlanner
 *
 * Compiles approved innovation opportunities into multi-horizon evolutionary product roadmaps and execution plans.
 */

export type ProductRoadmapHorizon = "NOW" | "NEXT" | "LATER" | "FUTURE";

export interface ProductEvolutionMilestone {
  milestoneId: string;
  name: string;
  tasks: string[];
  verificationCheckpoint: string;
}

export interface ProductEvolutionPlan {
  planId: string;
  opportunityId: string;
  horizon: ProductRoadmapHorizon;
  affectedProjects: string[];
  milestones: ProductEvolutionMilestone[];
  rollbackCheckpoints: string[];
  businessOutcomeMetrics: string[];
  createdAt: string;
}

export class ProductEvolutionPlanner {
  public static compilePlan(
    opportunityId: string,
    affectedProjects: string[],
    horizon: ProductRoadmapHorizon = "NOW"
  ): ProductEvolutionPlan {
    return {
      planId: `prod_plan_${Date.now()}`,
      opportunityId,
      horizon,
      affectedProjects,
      milestones: [
        {
          milestoneId: "m1_architecture_contract",
          name: "Define Architecture & API Contracts",
          tasks: ["Spec Generation", "Contract Lock"],
          verificationCheckpoint: "API Contract Validation",
        },
        {
          milestoneId: "m2_implementation",
          name: "Implement Core Feature Logic",
          tasks: ["Backend Controllers", "Frontend Views"],
          verificationCheckpoint: "Build & Typecheck Validation",
        },
        {
          milestoneId: "m3_experimentation",
          name: "Controlled Canary Rollout",
          tasks: ["10% Traffic Routing", "Telemetry Assertion"],
          verificationCheckpoint: "SLO & Latency Health Check",
        },
      ],
      rollbackCheckpoints: ["Restore baseline schema", "Revert routing table"],
      businessOutcomeMetrics: ["Attendance Logging Throughput +25%", "Active User Engagement +15%"],
      createdAt: new Date().toISOString(),
    };
  }
}
