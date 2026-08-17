/**
 * CapacityDemandForecaster
 *
 * Forecasts human, worker, infrastructure, and CI capacity constraints.
 */

export interface CapacityForecastReport {
  resourceType: "HUMAN_ENGINEERING" | "AI_WORKERS" | "DATABASE_CONNECTIONS" | "CI_COMPUTE";
  availableUnits: number;
  forecastDemandUnits: number;
  headroomUnits: number;
  status: "NO_CONSTRAINT" | "WATCH" | "CAPACITY_RISK" | "CAPACITY_CRITICAL";
  utilizationPercentage: number;
}

export class CapacityDemandForecaster {
  public static forecastCapacity(
    resourceType: CapacityForecastReport["resourceType"],
    available: number,
    demand: number
  ): CapacityForecastReport {
    const headroom = available - demand;
    const utilization = Math.round((demand / (available || 1)) * 100);

    let status: CapacityForecastReport["status"] = "NO_CONSTRAINT";
    if (headroom < 0 || utilization > 95) status = "CAPACITY_CRITICAL";
    else if (utilization > 80) status = "CAPACITY_RISK";
    else if (utilization > 65) status = "WATCH";

    return {
      resourceType,
      availableUnits: available,
      forecastDemandUnits: demand,
      headroomUnits: headroom,
      status,
      utilizationPercentage: utilization,
    };
  }
}
