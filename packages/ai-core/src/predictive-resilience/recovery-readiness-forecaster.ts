/**
 * RecoveryReadinessForecaster
 *
 * Forecasts recovery capabilities across backups, restores, failover targets, and capacity.
 */

export interface RecoveryReadinessForecast {
  projectId: string;
  backupReadinessScore: number;
  restoreReadinessScore: number;
  failoverReadinessScore: number;
  capacityReadinessScore: number;
  status: "READY" | "AT_RISK" | "NOT_READY";
  confidence: number;
}

export class RecoveryReadinessForecaster {
  public static forecastReadiness(
    projectId: string,
    backupScore: number,
    restoreScore: number,
    failoverScore: number,
    capacityScore: number
  ): RecoveryReadinessForecast {
    const avg = (backupScore + restoreScore + failoverScore + capacityScore) / 4;

    let status: RecoveryReadinessForecast["status"] = "READY";
    if (avg < 60) status = "NOT_READY";
    else if (avg < 85) status = "AT_RISK";

    return {
      projectId,
      backupReadinessScore: backupScore,
      restoreReadinessScore: restoreScore,
      failoverReadinessScore: failoverScore,
      capacityReadinessScore: capacityScore,
      status,
      confidence: 0.95,
    };
  }
}
