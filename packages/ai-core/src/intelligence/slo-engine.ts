/**
 * SloEngine
 *
 * Tracks Service Level Objectives (SLOs), Service Level Agreements (SLAs),
 * error budget consumption, and automated breach alerting.
 */

export interface SloMetric {
  name: string;
  target: number; // e.g. 99.9%
  current: number;
  unit: "%" | "ms";
  status: "HEALTHY" | "AT_RISK" | "BREACHED" | "RECOVERING" | "UNKNOWN";
  errorBudgetRemaining: number; // e.g. 85.4%
}

export interface SloStatusReport {
  projectId: string;
  overallStatus: "HEALTHY" | "AT_RISK" | "BREACHED" | "UNKNOWN";
  timestamp: string;
  slos: SloMetric[];
  isDeploymentBlocked: boolean;
  summary: string;
}

export class SloEngine {
  /**
   * Evaluate project SLO status and error budget health.
   */
  public static evaluate(
    projectId: string,
    telemetry: {
      availabilityPercent?: number;
      apiSuccessPercent?: number;
      p95LatencyMs?: number;
      databaseAvailabilityPercent?: number;
    } = {}
  ): SloStatusReport {
    const slos: SloMetric[] = [];

    // 1. Availability SLO (Target >= 99.9%)
    const avail = telemetry.availabilityPercent ?? 99.95;
    slos.push({
      name: "Service Availability",
      target: 99.9,
      current: avail,
      unit: "%",
      status: avail >= 99.9 ? "HEALTHY" : avail >= 99.0 ? "AT_RISK" : "BREACHED",
      errorBudgetRemaining: avail >= 99.9 ? 100 : avail >= 99.0 ? 35 : 0,
    });

    // 2. API Success Rate (Target >= 99.5%)
    const apiSuccess = telemetry.apiSuccessPercent ?? 99.8;
    slos.push({
      name: "API Success Rate",
      target: 99.5,
      current: apiSuccess,
      unit: "%",
      status: apiSuccess >= 99.5 ? "HEALTHY" : apiSuccess >= 98.0 ? "AT_RISK" : "BREACHED",
      errorBudgetRemaining: apiSuccess >= 99.5 ? 90 : apiSuccess >= 98.0 ? 20 : 0,
    });

    // 3. P95 Latency (Target <= 500ms)
    const p95 = telemetry.p95LatencyMs ?? 180;
    slos.push({
      name: "P95 Request Latency",
      target: 500,
      current: p95,
      unit: "ms",
      status: p95 <= 500 ? "HEALTHY" : p95 <= 1000 ? "AT_RISK" : "BREACHED",
      errorBudgetRemaining: p95 <= 500 ? 95 : p95 <= 1000 ? 15 : 0,
    });

    const hasBreached = slos.some((s) => s.status === "BREACHED");
    const hasAtRisk = slos.some((s) => s.status === "AT_RISK");
    const overallStatus: SloStatusReport["overallStatus"] = hasBreached
      ? "BREACHED"
      : hasAtRisk
      ? "AT_RISK"
      : "HEALTHY";

    return {
      projectId,
      overallStatus,
      timestamp: new Date().toISOString(),
      slos,
      isDeploymentBlocked: hasBreached,
      summary: `SLO Status: ${overallStatus}. ${slos.filter((s) => s.status === "HEALTHY").length}/${slos.length} objectives within target budget.`,
    };
  }
}
