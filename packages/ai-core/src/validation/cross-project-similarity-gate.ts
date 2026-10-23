/**
 * Aegis AI — Phase 3 Cross-Project Similarity Gate
 *
 * Enforces the Originality Gate across projects:
 * Compares with recent projects (hue, fonts, layout, section sequence).
 * If similarity exceeds threshold, guides bounded regeneration (max 3 retries)
 * with an actionable avoid list to ensure every site has its own distinctive identity.
 */

import {
  CrossProjectSimilarityDetector,
  type ProjectDesignSignature,
  type SimilarityEvaluationResult,
} from "../design/similarity-detector.js";
import {
  DesignBriefGenerator,
  type AegisDesignBriefV2,
} from "../design/design-brief-generator.js";

export interface SimilarityGateReport {
  status: "PASSED" | "FAILED" | "INSUFFICIENT_HISTORY";
  attempts: number;
  finalSimilarity: number;
  threshold: number;
  evaluation: SimilarityEvaluationResult;
  regenerationHistory: Array<{
    attempt: number;
    similarity: number;
    reason: string;
    avoidedTokens: string[];
  }>;
}

export class CrossProjectSimilarityGate {
  private static readonly MAX_REPAIR_RETRIES = 3;

  /**
   * Evaluates candidate brief against historical project signatures with bounded regeneration.
   */
  public static execute(options: {
    candidateBrief: AegisDesignBriefV2;
    historySignatures: ProjectDesignSignature[];
    prompt: string;
    domain?: string;
    routes?: string[];
  }): {
    resolvedBrief: AegisDesignBriefV2;
    report: SimilarityGateReport;
  } {
    const { historySignatures, prompt, domain, routes } = options;
    let currentBrief = options.candidateBrief;

    const history: SimilarityGateReport["regenerationHistory"] = [];
    let attempts = 1;
    const avoidList: string[] = [...currentBrief.choicesToAvoid];

    let evalResult = CrossProjectSimilarityDetector.evaluate(currentBrief, historySignatures);

    if (!evalResult.isHistorySufficient) {
      return {
        resolvedBrief: currentBrief,
        report: {
          status: "INSUFFICIENT_HISTORY",
          attempts: 1,
          finalSimilarity: 0.0,
          threshold: evalResult.threshold,
          evaluation: evalResult,
          regenerationHistory: [],
        },
      };
    }

    while (!evalResult.passed && attempts <= this.MAX_REPAIR_RETRIES) {
      const reason = `Similarity ${Math.round(evalResult.overallSimilarity * 100)}% exceeded threshold ${Math.round(
        evalResult.threshold * 100
      )}% against project '${evalResult.mostSimilarProject?.domain}'.`;

      // Record what to avoid in next attempt
      avoidList.push(currentBrief.typography.fontPairingId);
      for (const rec of evalResult.recommendations) {
        if (!avoidList.includes(rec)) avoidList.push(rec);
      }

      history.push({
        attempt: attempts,
        similarity: evalResult.overallSimilarity,
        reason,
        avoidedTokens: [...avoidList],
      });

      console.log(
        `[SimilarityGate] ⚠️ Attempt ${attempts} rejected (${Math.round(
          evalResult.overallSimilarity * 100
        )}% similarity). Regenerating with avoid list...`
      );

      // Regenerate with shifted seed and avoid list
      currentBrief = DesignBriefGenerator.generateBrief({
        prompt,
        domain,
        seed: Date.now() + attempts * 101,
        avoidList,
        routes,
      });

      attempts++;
      evalResult = CrossProjectSimilarityDetector.evaluate(currentBrief, historySignatures);
    }

    return {
      resolvedBrief: currentBrief,
      report: {
        status: evalResult.passed ? "PASSED" : "FAILED",
        attempts,
        finalSimilarity: evalResult.overallSimilarity,
        threshold: evalResult.threshold,
        evaluation: evalResult,
        regenerationHistory: history,
      },
    };
  }
}
