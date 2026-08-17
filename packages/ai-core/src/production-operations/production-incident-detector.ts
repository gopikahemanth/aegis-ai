/**
 * ProductionIncidentDetector
 *
 * Correlates multiple anomaly signals into actionable incidents.
 * Tracks lifecycle: DETECTED → TRIAGING → DIAGNOSING → REMEDIATING → RECOVERING → VERIFIED → ESCALATED → CLOSED.
 */

import { AnomalyDetectionSummary } from "./production-anomaly-detector.js";
import { UnifiedProductionState } from "./production-state-engine.js";

export type IncidentLifecycleState =
  | "DETECTED"
  | "TRIAGING"
  | "DIAGNOSING"
  | "REMEDIATING"
  | "RECOVERING"
  | "VERIFIED"
  | "ESCALATED"
  | "CLOSED";

export type IncidentSeverity = "SEV1_CRITICAL" | "SEV2_MAJOR" | "SEV3_MINOR";

export interface ProductionIncident {
  incidentId: string;
  title: string;
  severity: IncidentSeverity;
  state: IncidentLifecycleState;
  detectedAt: string;
  affectedComponents: string[];
  correlatedSignals: string[];
  requiresHumanIntervention: boolean;
  resolutionAttempts: number;
  summary: string;
}

export class ProductionIncidentDetector {
  public static evaluate(
    state: UnifiedProductionState,
    anomalySummary: AnomalyDetectionSummary
  ): ProductionIncident | null {
    if (!anomalySummary.hasAnomalies) {
      return null;
    }

    const criticalAnomalies = anomalySummary.anomalies.filter((a) => a.severity === "CRITICAL");
    const correlatedSignals = anomalySummary.anomalies.map((a) => `${a.metricName} (${a.severity}): ${a.detail}`);
    const affectedComponents = Array.from(
      new Set(
        anomalySummary.anomalies.map((a) => a.metricName.split(" ")[0])
      )
    );

    let severity: IncidentSeverity = "SEV3_MINOR";
    if (criticalAnomalies.length >= 2 || state.metrics.errorRatePercentage > 5.0) {
      severity = "SEV1_CRITICAL";
    } else if (criticalAnomalies.length === 1 || state.metrics.p95LatencyMs > 500) {
      severity = "SEV2_MAJOR";
    }

    const title = severity === "SEV1_CRITICAL"
      ? `High-Severity Service Outage / Degradation on ${affectedComponents.join(", ")}`
      : `Performance Anomaly Detected on ${affectedComponents.join(", ")}`;

    return {
      incidentId: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      severity,
      state: "DETECTED",
      detectedAt: new Date().toISOString(),
      affectedComponents,
      correlatedSignals,
      requiresHumanIntervention: false,
      resolutionAttempts: 0,
      summary: `Incident ${severity}: ${title}. Correlated ${correlatedSignals.length} anomalous signals.`,
    };
  }
}
