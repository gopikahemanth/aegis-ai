/**
 * ProductionDiagnosisEngine
 *
 * Performs automated root cause analysis on active incidents.
 * Invariant: DIAGNOSIS ≠ FACT
 * Certainty: PROBABLE | CONFIRMED | VERIFIED
 */

import { ProductionIncident } from "./production-incident-detector.js";
import { UnifiedProductionState } from "./production-state-engine.js";

export type DiagnosisCertainty = "PROBABLE" | "CONFIRMED" | "VERIFIED";

export interface RootCauseDiagnosis {
  diagnosisId: string;
  incidentId: string;
  certainty: DiagnosisCertainty;
  confidenceScore: number; // 0.0 to 1.0
  rootCause: string;
  evidence: string[];
  affectedComponents: string[];
  recommendedActionType: string;
  detail: string;
  diagnosedAt: string;
}

export class ProductionDiagnosisEngine {
  public static diagnose(
    incident: ProductionIncident,
    state: UnifiedProductionState
  ): RootCauseDiagnosis {
    const isDbImpacted = incident.affectedComponents.some((c) => c.toLowerCase().includes("database") || c.toLowerCase().includes("postgresql"));
    const isBackendImpacted = incident.affectedComponents.some((c) => c.toLowerCase().includes("backend") || c.toLowerCase().includes("api"));
    const isFrontendImpacted = incident.affectedComponents.some((c) => c.toLowerCase().includes("frontend"));

    let rootCause = "Transient compute overload";
    let actionType = "RESTART_SERVICE";
    let confidence = 0.85;

    if (isDbImpacted && state.metrics.errorRatePercentage > 3.0) {
      rootCause = "Database connection pool exhaustion & connection timeout under load";
      actionType = "RESTART_DATABASE_POOL";
      confidence = 0.94;
    } else if (isBackendImpacted && state.metrics.memoryUsageMb > 380) {
      rootCause = "Memory leak in API worker process resulting in high latency and 500 responses";
      actionType = "ROTATE_PROCESS";
      confidence = 0.91;
    } else if (isFrontendImpacted) {
      rootCause = "Frontend CDN edge cache stale or origin unavailable";
      actionType = "CLEAR_SAFE_CACHE";
      confidence = 0.88;
    }

    return {
      diagnosisId: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      incidentId: incident.incidentId,
      certainty: confidence > 0.9 ? "CONFIRMED" : "PROBABLE",
      confidenceScore: confidence,
      rootCause,
      evidence: incident.correlatedSignals,
      affectedComponents: incident.affectedComponents,
      recommendedActionType: actionType,
      detail: `RCA identified probable cause: ${rootCause} (Confidence: ${Math.round(confidence * 100)}%).`,
      diagnosedAt: new Date().toISOString(),
    };
  }
}
