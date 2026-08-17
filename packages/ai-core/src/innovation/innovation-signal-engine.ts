/**
 * InnovationSignalEngine
 *
 * Discovers innovation signals from telemetry, verified incidents, customer feedback, and architectural evidence.
 * Hard Invariant: SIGNAL != OPPORTUNITY != PROPOSAL != DECISION != AUTHORIZATION.
 */

export type InnovationSignalType =
  | "CUSTOMER_DEMAND"
  | "PRODUCT_GAP"
  | "RELIABILITY_OPPORTUNITY"
  | "PERFORMANCE_OPPORTUNITY"
  | "SECURITY_OPPORTUNITY"
  | "COST_OPPORTUNITY"
  | "AUTOMATION_OPPORTUNITY"
  | "ARCHITECTURAL_OPPORTUNITY"
  | "TECHNICAL_DEBT_OPPORTUNITY"
  | "COMPETITIVE_OPPORTUNITY"
  | "OPERATIONAL_OPPORTUNITY";

export interface InnovationSignal {
  signalId: string;
  projectId: string;
  type: InnovationSignalType;
  title: string;
  sourceEvidenceSummary: string;
  strengthScore: number; // 0 to 1
  observedAt: string;
}

export class InnovationSignalEngine {
  public static discoverSignals(
    projectId: string,
    userRequestCount: number,
    latencySpikesCount: number,
    costTrendSlope: number
  ): InnovationSignal[] {
    const signals: InnovationSignal[] = [];
    const now = new Date().toISOString();

    if (userRequestCount >= 5) {
      signals.push({
        signalId: `sig_${Date.now()}_demand`,
        projectId,
        type: "CUSTOMER_DEMAND",
        title: "High Demand for Real-Time Member Attendance Analytics",
        sourceEvidenceSummary: `${userRequestCount} explicit user feature requests recorded in product telemetry.`,
        strengthScore: 0.94,
        observedAt: now,
      });
    }

    if (latencySpikesCount > 0) {
      signals.push({
        signalId: `sig_${Date.now()}_perf`,
        projectId,
        type: "PERFORMANCE_OPPORTUNITY",
        title: "Query Optimization for Large Attendance Datasets",
        sourceEvidenceSummary: `${latencySpikesCount} peak-hour query latency degradation events observed.`,
        strengthScore: 0.88,
        observedAt: now,
      });
    }

    if (costTrendSlope > 0.2) {
      signals.push({
        signalId: `sig_${Date.now()}_cost`,
        projectId,
        type: "COST_OPPORTUNITY",
        title: "Cache Warming for High-Frequency Read Paths",
        sourceEvidenceSummary: "Compute cost trend increased by >20% during peak read windows.",
        strengthScore: 0.82,
        observedAt: now,
      });
    }

    return signals;
  }
}
