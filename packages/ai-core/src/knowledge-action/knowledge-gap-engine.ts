/**
 * KnowledgeGapEngine
 *
 * Detects missing, stale, or incomplete telemetry and evidence, formulating governed research tasks.
 * Hard Invariant: UNKNOWN != NEGATIVE != POSITIVE != VERIFIED. Never fabricates missing knowledge.
 */

export type KnowledgeGapType =
  | "MISSING_EVIDENCE"
  | "CONFLICTING_EVIDENCE"
  | "STALE_EVIDENCE"
  | "MISSING_TELEMETRY"
  | "MISSING_OUTCOME"
  | "MISSING_OWNERSHIP"
  | "MISSING_DEPENDENCY"
  | "MISSING_BUSINESS_CONTEXT";

export interface KnowledgeGapReport {
  gapId: string;
  gapType: KnowledgeGapType;
  targetDomain: string;
  targetProject: string;
  description: string;
  recommendedInvestigationTask: string;
  detectedAt: string;
}

export class KnowledgeGapEngine {
  public static detectGap(
    domain: string,
    project: string,
    evidenceCount: number,
    telemetryPresent: boolean
  ): KnowledgeGapReport | null {
    if (!telemetryPresent) {
      return {
        gapId: `gap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        gapType: "MISSING_TELEMETRY",
        targetDomain: domain,
        targetProject: project,
        description: `Missing runtime telemetry streams for project ${project} in domain ${domain}.`,
        recommendedInvestigationTask: `Configure OpenTelemetry and Prometheus exporters on ${project}.`,
        detectedAt: new Date().toISOString(),
      };
    }

    if (evidenceCount === 0) {
      return {
        gapId: `gap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        gapType: "MISSING_EVIDENCE",
        targetDomain: domain,
        targetProject: project,
        description: `Zero empirical evidence sources attached to domain ${domain} in project ${project}.`,
        recommendedInvestigationTask: `Initiate controlled diagnostic run on ${project}.`,
        detectedAt: new Date().toISOString(),
      };
    }

    return null;
  }
}
