/**
 * ResilienceDegradationDetector
 *
 * Continuously tracks SLO burn rates, replica lag, and resource headroom
 * to detect operational degradation before incidents occur.
 */

export interface DegradationReport {
  projectId: string;
  sloBurnRate: number; // e.g. 1.5x normal
  memoryCreepPercentage: number;
  replicaLagSeconds: number;
  status: "STABLE" | "WATCH" | "DEGRADING" | "HIGH_RISK" | "CRITICAL";
  leadTimeMinutes: number;
}

export class ResilienceDegradationDetector {
  public static evaluateDegradation(
    projectId: string,
    sloBurnRate: number,
    memoryCreepPercentage: number,
    replicaLagSeconds: number
  ): DegradationReport {
    let status: DegradationReport["status"] = "STABLE";
    let leadTime = 120;

    if (sloBurnRate > 3.0 || memoryCreepPercentage > 85 || replicaLagSeconds > 60) {
      status = "HIGH_RISK";
      leadTime = 15;
    } else if (sloBurnRate > 1.8 || memoryCreepPercentage > 70 || replicaLagSeconds > 15) {
      status = "DEGRADING";
      leadTime = 45;
    } else if (sloBurnRate > 1.2 || memoryCreepPercentage > 50) {
      status = "WATCH";
      leadTime = 90;
    }

    return {
      projectId,
      sloBurnRate,
      memoryCreepPercentage,
      replicaLagSeconds,
      status,
      leadTimeMinutes: leadTime,
    };
  }
}
