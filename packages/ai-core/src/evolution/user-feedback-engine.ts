/**
 * UserFeedbackEngine
 *
 * Transforms natural-language user feedback into structured incremental evolution requests
 * with minimal blast radius, preserving untouched backend, database, and API layers.
 */

import { IncrementalChangeAnalyzer, type ChangeImpactReport } from "./incremental-change-analyzer.js";

export interface UserFeedbackReport {
  feedbackPrompt: string;
  impact: ChangeImpactReport;
  preservedLayers: string[];
  targetGenerationType: "UI_EVOLUTION" | "FEATURE_EVOLUTION" | "BUG_FIX_EVOLUTION";
  summary: string;
}

export class UserFeedbackEngine {
  public static processFeedback(
    feedback: string,
    existingFiles: string[],
    existingFeatures: string[]
  ): UserFeedbackReport {
    const impact = IncrementalChangeAnalyzer.analyzeRequest(feedback, existingFiles, existingFeatures);

    const preservedLayers: string[] = [];
    let targetGenerationType: UserFeedbackReport["targetGenerationType"] = "FEATURE_EVOLUTION";

    if (impact.category === "UI_CHANGE") {
      targetGenerationType = "UI_EVOLUTION";
      preservedLayers.push("Backend / Controllers", "Database Schema", "API Contracts", "Authentication");
    } else if (impact.category === "BUG_FIX") {
      targetGenerationType = "BUG_FIX_EVOLUTION";
      preservedLayers.push("Architecture", "Unrelated Features");
    } else {
      preservedLayers.push("Architecture Contract", "Unrelated Features");
    }

    return {
      feedbackPrompt: feedback,
      impact,
      preservedLayers,
      targetGenerationType,
      summary: `Feedback processed as ${targetGenerationType} with blast radius ${impact.blastRadius}. Preserving [${preservedLayers.join(", ")}].`,
    };
  }
}
