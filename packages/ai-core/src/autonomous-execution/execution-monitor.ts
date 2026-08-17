/**
 * ExecutionMonitor
 *
 * Real-time monitoring of live execution runs, health metrics, and timeout detection.
 */

export interface ExecutionHealthState {
  executionId: string;
  status: "HEALTHY" | "DEGRADED" | "AT_RISK" | "FAILED" | "UNKNOWN";
  durationMs: number;
  cpuUsagePercentage: number;
  memoryUsageMb: number;
  isTimedOut: boolean;
  activeIncidentsCount: number;
  lastHeartbeatAt: string;
}

export class ExecutionMonitor {
  public static assessHealth(
    executionId: string,
    durationMs: number,
    timeoutThresholdMs: number,
    activeIncidents: number,
    cpuPercentage: number
  ): ExecutionHealthState {
    const isTimedOut = durationMs > timeoutThresholdMs;

    let status: ExecutionHealthState["status"] = "HEALTHY";
    if (isTimedOut || activeIncidents > 0) {
      status = "FAILED";
    } else if (cpuPercentage > 90) {
      status = "AT_RISK";
    } else if (cpuPercentage > 75) {
      status = "DEGRADED";
    }

    return {
      executionId,
      status,
      durationMs,
      cpuUsagePercentage: cpuPercentage,
      memoryUsageMb: 256,
      isTimedOut,
      activeIncidentsCount: activeIncidents,
      lastHeartbeatAt: new Date().toISOString(),
    };
  }
}
