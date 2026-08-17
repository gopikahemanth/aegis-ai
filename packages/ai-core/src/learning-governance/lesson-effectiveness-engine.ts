/**
 * LessonEffectivenessEngine
 *
 * Measures whether institutional lessons improve future decisions and outcomes.
 * Hard Invariant: Reuse frequency alone does NOT equate to verified effectiveness.
 */

export type LessonEffectivenessRating =
  | "HIGHLY_EFFECTIVE"
  | "EFFECTIVE"
  | "PARTIALLY_EFFECTIVE"
  | "INEFFECTIVE"
  | "HARMFUL"
  | "UNKNOWN"
  | "INSUFFICIENT_EVIDENCE";

export interface LessonEffectivenessReport {
  lessonId: string;
  rating: LessonEffectivenessRating;
  reuseCount: number;
  successfulApplicationsCount: number;
  failedApplicationsCount: number;
  avoidedFailuresCount: number;
  recommendationAccuracyPct: number;
  summary: string;
}

export class LessonEffectivenessEngine {
  public static evaluateLesson(
    lessonId: string,
    reuseCount: number,
    successes: number,
    failures: number,
    avoidedFailures: number = 0
  ): LessonEffectivenessReport {
    if (reuseCount === 0) {
      return {
        lessonId,
        rating: "UNKNOWN",
        reuseCount: 0,
        successfulApplicationsCount: 0,
        failedApplicationsCount: 0,
        avoidedFailuresCount: 0,
        recommendationAccuracyPct: 0,
        summary: `Lesson ${lessonId} has not yet been applied in operational decisions.`,
      };
    }

    const accuracy = parseFloat(((successes / reuseCount) * 100).toFixed(1));
    let rating: LessonEffectivenessRating = "PARTIALLY_EFFECTIVE";

    if (failures > successes) {
      rating = "HARMFUL";
    } else if (accuracy >= 90 && avoidedFailures >= 1) {
      rating = "HIGHLY_EFFECTIVE";
    } else if (accuracy >= 75) {
      rating = "EFFECTIVE";
    } else if (accuracy < 50) {
      rating = "INEFFECTIVE";
    }

    return {
      lessonId,
      rating,
      reuseCount,
      successfulApplicationsCount: successes,
      failedApplicationsCount: failures,
      avoidedFailuresCount: avoidedFailures,
      recommendationAccuracyPct: accuracy,
      summary: `Lesson ${lessonId} evaluated as ${rating} (${accuracy}% accuracy across ${reuseCount} applications).`,
    };
  }
}
