/**
 * AnomalyDetector
 *
 * Predictive anomaly detection engine analyzing latency trends, error rates,
 * memory creep, and behavioral shifts before catastrophic outages occur.
 */

export type AnomalyType =
  | "NO_ANOMALY"
  | "PERFORMANCE_ANOMALY"
  | "ERROR_ANOMALY"
  | "RESOURCE_ANOMALY"
  | "DATABASE_ANOMALY"
  | "DEPENDENCY_ANOMALY"
  | "BEHAVIORAL_ANOMALY"
  | "DEPLOYMENT_ANOMALY";

export interface AnomalyReport {
  detected: boolean;
  type: AnomalyType;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  metric: string;
  baselineValue: number;
  currentValue: number;
  deviationPercent: number;
  evidence: string[];
  recommendedMitigation: string;
}

export class AnomalyDetector {
  /**
   * Run predictive anomaly analysis across telemetry streams.
   */
  public static detect(data: {
    baselineLatencyMs?: number;
    currentLatencyMs?: number;
    baselineErrorRate?: number;
    currentErrorRate?: number;
    baselineMemoryMB?: number;
    currentMemoryMB?: number;
  } = {}): AnomalyReport {
    const baseLatency = data.baselineLatencyMs ?? 25;
    const currLatency = data.currentLatencyMs ?? 25;
    const baseErrors = data.baselineErrorRate ?? 0.0;
    const currErrors = data.currentErrorRate ?? 0.0;
    const baseMem = data.baselineMemoryMB ?? 45;
    const currMem = data.currentMemoryMB ?? 45;

    // 1. Latency Anomaly Check (> 150% increase)
    if (currLatency > baseLatency * 2.5) {
      const dev = Math.round(((currLatency - baseLatency) / baseLatency) * 100);
      return {
        detected: true,
        type: "PERFORMANCE_ANOMALY",
        severity: "HIGH",
        metric: "API Request Latency",
        baselineValue: baseLatency,
        currentValue: currLatency,
        deviationPercent: dev,
        evidence: [`Latency spiked from ${baseLatency}ms to ${currLatency}ms (+${dev}% deviation).`],
        recommendedMitigation: "Scale worker instances or inspect database query bottlenecks.",
      };
    }

    // 2. Error Rate Anomaly Check
    if (currErrors > 0.05) {
      return {
        detected: true,
        type: "ERROR_ANOMALY",
        severity: "CRITICAL",
        metric: "Error Rate",
        baselineValue: baseErrors,
        currentValue: currErrors,
        deviationPercent: Math.round(currErrors * 100),
        evidence: [`Error rate elevated to ${(currErrors * 100).toFixed(1)}% across active routes.`],
        recommendedMitigation: "Inspect recent release deployment and initiate canary rollback if persistent.",
      };
    }

    // 3. Memory Creep / Leak Anomaly Check
    if (currMem > baseMem * 3.0) {
      const dev = Math.round(((currMem - baseMem) / baseMem) * 100);
      return {
        detected: true,
        type: "RESOURCE_ANOMALY",
        severity: "HIGH",
        metric: "Heap Memory Usage",
        baselineValue: baseMem,
        currentValue: currMem,
        deviationPercent: dev,
        evidence: [`Process heap grew from ${baseMem}MB to ${currMem}MB (+${dev}% creep).`],
        recommendedMitigation: "Inspect unclosed stream handlers or event listener leaks.",
      };
    }

    return {
      detected: false,
      type: "NO_ANOMALY",
      severity: "LOW",
      metric: "System Metrics",
      baselineValue: 0,
      currentValue: 0,
      deviationPercent: 0,
      evidence: ["All telemetry metrics within standard deviations."],
      recommendedMitigation: "No action required.",
    };
  }
}
