/**
 * CapacityAllocationEngine
 *
 * Evaluates organizational engineering workload, worker availability, and capacity constraints.
 */

export interface TeamCapacity {
  teamId: string;
  totalCapacityHours: number;
  allocatedHours: number;
  utilizationPercentage: number;
  status: "UNDER_ALLOCATED" | "BALANCED" | "HIGH_UTILIZATION" | "OVER_ALLOCATED";
}

export class CapacityAllocationEngine {
  public static evaluateTeamCapacity(teamId: string, totalCapacity: number, allocated: number): TeamCapacity {
    const util = (allocated / (totalCapacity || 1)) * 100;
    let status: TeamCapacity["status"] = "BALANCED";

    if (util > 100) status = "OVER_ALLOCATED";
    else if (util > 80) status = "HIGH_UTILIZATION";
    else if (util < 50) status = "UNDER_ALLOCATED";

    return {
      teamId,
      totalCapacityHours: totalCapacity,
      allocatedHours: allocated,
      utilizationPercentage: Math.round(util),
      status,
    };
  }
}
