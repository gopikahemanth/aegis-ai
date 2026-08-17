/**
 * CausalAnalysisEngine
 *
 * Evaluates causal linkages across operational events, deployments, and business metrics.
 * Hard Invariant: Temporal correlation alone does NOT constitute verified causation.
 */

export type CausalConfidenceLevel =
  | "UNKNOWN"
  | "POSSIBLE"
  | "LIKELY"
  | "STRONGLY_SUPPORTED"
  | "VERIFIED";

export interface CausalChainLink {
  cause: string;
  effect: string;
  confidence: CausalConfidenceLevel;
  hasControlledExperimentEvidence: boolean;
  supportingEvidenceIds: string[];
}

export interface CausalAnalysisReport {
  analysisId: string;
  chainTitle: string;
  links: CausalChainLink[];
  overallConfidence: CausalConfidenceLevel;
  summary: string;
}

export class CausalAnalysisEngine {
  public static analyzeChain(
    title: string,
    links: Array<{ cause: string; effect: string; experimentVerified: boolean; evidence: string[] }>
  ): CausalAnalysisReport {
    const chainLinks: CausalChainLink[] = links.map((l) => {
      let conf: CausalConfidenceLevel = "POSSIBLE";
      if (l.experimentVerified && l.evidence.length >= 2) {
        conf = "VERIFIED";
      } else if (l.evidence.length >= 3) {
        conf = "STRONGLY_SUPPORTED";
      } else if (l.evidence.length >= 1) {
        conf = "LIKELY";
      }

      return {
        cause: l.cause,
        effect: l.effect,
        confidence: conf,
        hasControlledExperimentEvidence: l.experimentVerified,
        supportingEvidenceIds: l.evidence,
      };
    });

    const isAllVerified = chainLinks.every((l) => l.confidence === "VERIFIED");

    return {
      analysisId: `causal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      chainTitle: title,
      links: chainLinks,
      overallConfidence: isAllVerified ? "VERIFIED" : "STRONGLY_SUPPORTED",
      summary: `Causal analysis for "${title}" evaluated as ${isAllVerified ? "VERIFIED" : "STRONGLY_SUPPORTED"}.`,
    };
  }
}
