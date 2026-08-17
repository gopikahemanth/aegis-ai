/**
 * EvidenceConfidencePropagationEngine
 *
 * Propagates confidence through synthesized multi-domain evidence chains.
 * Hard Invariant: Weak Evidence + Weak Evidence != Strong Evidence.
 * Confidence does NOT increase merely because unverified sources agree.
 */

export interface SynthesizedEvidenceInput {
  evidenceId: string;
  sourceType: string;
  isEmpiricallyVerified: boolean;
  qualityScore: number; // 0 to 1
  isContradicted: boolean;
}

export interface PropagatedConfidenceReport {
  overallConfidenceScore: number; // 0 to 1
  isVerified: boolean;
  unverifiedSourcesCount: number;
  verifiedSourcesCount: number;
  contradictionPenaltyApplied: boolean;
  explanation: string;
}

export class EvidenceConfidencePropagationEngine {
  public static calculateConfidence(
    inputs: SynthesizedEvidenceInput[]
  ): PropagatedConfidenceReport {
    if (inputs.length === 0) {
      return {
        overallConfidenceScore: 0,
        isVerified: false,
        unverifiedSourcesCount: 0,
        verifiedSourcesCount: 0,
        contradictionPenaltyApplied: false,
        explanation: "Zero evidence inputs provided.",
      };
    }

    const verified = inputs.filter((i) => i.isEmpiricallyVerified);
    const unverified = inputs.filter((i) => !i.isEmpiricallyVerified);
    const hasContradiction = inputs.some((i) => i.isContradicted);

    // Baseline calculation anchored on verified evidence quality
    let score = verified.length > 0
      ? verified.reduce((acc, v) => acc + v.qualityScore, 0) / verified.length
      : Math.min(0.49, unverified.reduce((acc, u) => acc + u.qualityScore, 0) / unverified.length);

    if (hasContradiction) {
      score = Math.max(0.1, score - 0.4);
    }

    return {
      overallConfidenceScore: parseFloat(score.toFixed(2)),
      isVerified: verified.length > 0 && !hasContradiction && score >= 0.85,
      unverifiedSourcesCount: unverified.length,
      verifiedSourcesCount: verified.length,
      contradictionPenaltyApplied: hasContradiction,
      explanation: verified.length > 0
        ? `Propagated confidence supported by ${verified.length} verified evidence source(s).`
        : `Propagated confidence capped at unverified threshold (<0.50).`,
    };
  }
}
