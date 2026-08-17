/**
 * ContinuityCapacityPlanner
 *
 * Models infrastructure and worker headroom under simulated failure conditions.
 */

export interface CapacityPlanReport {
  resourceType: "WORKER_NODES" | "DATABASE_CONNECTIONS" | "LLM_INFERENCE_BANDWIDTH";
  totalCapacity: number;
  outageLossPercentage: number;
  availableCapacityUnderFailure: number;
  requiredCapacity: number;
  status: "NORMAL" | "CONSTRAINED" | "INSUFFICIENT" | "CRITICAL";
}

export class ContinuityCapacityPlanner {
  public static planCapacity(
    resourceType: CapacityPlanReport["resourceType"],
    totalCapacity: number,
    outageLossPercentage: number,
    requiredCapacity: number
  ): CapacityPlanReport {
    const available = Math.floor(totalCapacity * (1 - outageLossPercentage / 100));

    let status: CapacityPlanReport["status"] = "NORMAL";
    if (available < requiredCapacity * 0.7) status = "CRITICAL";
    else if (available < requiredCapacity) status = "INSUFFICIENT";
    else if (available < requiredCapacity * 1.2) status = "CONSTRAINED";

    return {
      resourceType,
      totalCapacity,
      outageLossPercentage,
      availableCapacityUnderFailure: available,
      requiredCapacity,
      status,
    };
  }
}
