/**
 * ProductionAnomalyDetector
 *
 * Evaluates production telemetry against statistical baselines.
 * Invariant: ANOMALY ≠ INCIDENT
 * States: NORMAL | WARNING | ANOMALY | CRITICAL
 */

import { UnifiedProductionState } from "./production-state-engine.js";

export type AnomalySeverity = "NORMAL" | "WARNING" | "ANOMALY" | "CRITICAL";

export interface AnomalyReport {
  id: string;
  metricName: string;
  severity: AnomalySeverity;
  observedValue: number | string;
  expectedBaseline: string;
  deviationScore: number;
  detectedAt: string;
  detail: string;
}

export interface AnomalyDetectionSummary {
  overallSeverity: AnomalySeverity;
  hasAnomalies: boolean;
  anomalies: AnomalyReport[];
  criticalCount: number;
  summary: string;
}

export class ProductionAnomalyDetector {
  public static detect(state: UnifiedProductionState): AnomalyDetectionSummary {
    const anomalies: AnomalyReport[] = [];
    const metrics = state.metrics;

    // 1. Error Rate
    if (metrics.errorRatePercentage > 5.0) {
      anomalies.push({
        id: `anom_err_${Date.now()}`,
        metricName: "Error Rate (5xx)",
        severity: "CRITICAL",
        observedValue: `${metrics.errorRatePercentage}%`,
        expectedBaseline: "< 0.5%",
        deviationScore: 9.2,
        detectedAt: new Date().toISOString(),
        detail: `Error rate surged to ${metrics.errorRatePercentage}% (> 5% critical threshold)`,
      });
    } else if (metrics.errorRatePercentage > 1.0) {
      anomalies.push({
        id: `anom_err_${Date.now()}`,
        metricName: "Error Rate (5xx)",
        severity: "ANOMALY",
        observedValue: `${metrics.errorRatePercentage}%`,
        expectedBaseline: "< 0.5%",
        deviationScore: 6.5,
        detectedAt: new Date().toISOString(),
        detail: `Error rate elevated at ${metrics.errorRatePercentage}%`,
      });
    }

    // 2. Latency
    if (metrics.p95LatencyMs > 800) {
      anomalies.push({
        id: `anom_lat_${Date.now()}`,
        metricName: "P95 Latency",
        severity: "CRITICAL",
        observedValue: `${metrics.p95LatencyMs}ms`,
        expectedBaseline: "< 300ms",
        deviationScore: 8.7,
        detectedAt: new Date().toISOString(),
        detail: `P95 latency severely degraded to ${metrics.p95LatencyMs}ms`,
      });
    } else if (metrics.p95LatencyMs > 350) {
      anomalies.push({
        id: `anom_lat_${Date.now()}`,
        metricName: "P95 Latency",
        severity: "WARNING",
        observedValue: `${metrics.p95LatencyMs}ms`,
        expectedBaseline: "< 300ms",
        deviationScore: 4.2,
        detectedAt: new Date().toISOString(),
        detail: `P95 latency elevated at ${metrics.p95LatencyMs}ms`,
      });
    }

    // 3. Database & Compute Component Status
    for (const [key, comp] of Object.entries(state.components)) {
      if (comp.state === "CRITICAL" || comp.state === "FAILED") {
        anomalies.push({
          id: `anom_comp_${key}_${Date.now()}`,
          metricName: comp.name,
          severity: "CRITICAL",
          observedValue: comp.state,
          expectedBaseline: "HEALTHY",
          deviationScore: 10.0,
          detectedAt: new Date().toISOString(),
          detail: `${comp.name} reported ${comp.state} state (${comp.latencyMs}ms latency)`,
        });
      } else if (comp.state === "DEGRADED") {
        anomalies.push({
          id: `anom_comp_${key}_${Date.now()}`,
          metricName: comp.name,
          severity: "ANOMALY",
          observedValue: comp.state,
          expectedBaseline: "HEALTHY",
          deviationScore: 5.8,
          detectedAt: new Date().toISOString(),
          detail: `${comp.name} reported ${comp.state} state`,
        });
      }
    }

    const criticalCount = anomalies.filter((a) => a.severity === "CRITICAL").length;
    const hasAnomalies = anomalies.length > 0;

    let overallSeverity: AnomalySeverity = "NORMAL";
    if (criticalCount > 0) overallSeverity = "CRITICAL";
    else if (anomalies.some((a) => a.severity === "ANOMALY")) overallSeverity = "ANOMALY";
    else if (anomalies.some((a) => a.severity === "WARNING")) overallSeverity = "WARNING";

    return {
      overallSeverity,
      hasAnomalies,
      anomalies,
      criticalCount,
      summary: hasAnomalies
        ? `Anomaly detection: ${anomalies.length} anomaly/anomalies detected (Severity: ${overallSeverity}).`
        : "Anomaly detection: All metrics operating within normal baseline limits.",
    };
  }
}
