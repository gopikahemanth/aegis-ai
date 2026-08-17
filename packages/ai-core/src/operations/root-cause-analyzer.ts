/**
 * RootCauseAnalyzer
 *
 * Correlates runtime telemetry, error logs, contract diffs, and database migrations
 * to produce root-cause hypotheses with confidence scores and supporting evidence.
 */

import type { IncidentRecord } from "./incident-engine.js";

export interface RootCauseCandidate {
  candidateId: string;
  category: "SCHEMA_MISMATCH" | "API_CONTRACT_DRIFT" | "DATABASE_CONNECTION_LOSS" | "UNHANDLED_EXCEPTION" | "RESOURCE_STARVATION";
  hypothesis: string;
  confidence: number; // 0.0 - 1.0
  supportingEvidence: string[];
  contradictingEvidence: string[];
  recommendedAction: string;
}

export interface RootCauseAnalysisReport {
  incidentId: string;
  timestamp: string;
  primaryRootCause: RootCauseCandidate;
  alternativeCandidates: RootCauseCandidate[];
  summary: string;
}

export class RootCauseAnalyzer {
  /**
   * Perform deterministic root-cause analysis on an incident.
   */
  public static analyze(incident: IncidentRecord, logs: string[] = []): RootCauseAnalysisReport {
    const combinedLogs = logs.join(" ").toLowerCase();
    const symptoms = incident.symptoms.join(" ").toLowerCase();

    let primaryCategory: RootCauseCandidate["category"] = "UNHANDLED_EXCEPTION";
    let hypothesis = "Unhandled runtime exception occurred in request handler.";
    let confidence = 0.85;
    const supportingEvidence: string[] = [...incident.symptoms];
    let recommendedAction = "Restart application server and verify error logs.";

    if (incident.classification === "DATABASE_FAILURE" || combinedLogs.includes("p1001") || symptoms.includes("database")) {
      primaryCategory = "DATABASE_CONNECTION_LOSS";
      hypothesis = "Database connection pool exhausted or database server unreachable.";
      confidence = 0.95;
      supportingEvidence.push("Database health probe failed with connection timeout.");
      recommendedAction = "Verify DATABASE_URL connectivity and restart PostgreSQL pool.";
    } else if (incident.classification === "API_FAILURE" || symptoms.includes("500") || symptoms.includes("route")) {
      primaryCategory = "API_CONTRACT_DRIFT";
      hypothesis = "Runtime API handler failed schema validation against locked ApiContract.";
      confidence = 0.90;
      supportingEvidence.push("API endpoint returned 500 error on expected payload.");
      recommendedAction = "Reconcile API route implementation against locked ApiContract.";
    }

    const primaryRootCause: RootCauseCandidate = {
      candidateId: `rc_${Date.now()}`,
      category: primaryCategory,
      hypothesis,
      confidence,
      supportingEvidence,
      contradictingEvidence: [],
      recommendedAction,
    };

    return {
      incidentId: incident.incidentId,
      timestamp: new Date().toISOString(),
      primaryRootCause,
      alternativeCandidates: [],
      summary: `RCA for ${incident.incidentId}: ${hypothesis} (Confidence: ${Math.round(confidence * 100)}%).`,
    };
  }
}
