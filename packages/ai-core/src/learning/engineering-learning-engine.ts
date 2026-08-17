/**
 * EngineeringLearningEngine
 *
 * Measures prediction accuracy against verified outcomes, continuously calibrating
 * confidence heuristics without mutating immutable safety policies.
 */

export interface LearningObservation {
  observationId: string;
  predictionType: string;
  predictedOutcome: string;
  actualOutcome: string;
  accuracy: number; // 0.0 - 1.0
  calibratedConfidence: number;
  timestamp: string;
}

export class EngineeringLearningEngine {
  private static observations: LearningObservation[] = [];

  /**
   * Record prediction outcome comparison and calibrate confidence.
   */
  public static recordOutcome(
    predictionType: string,
    predictedOutcome: string,
    actualOutcome: string
  ): LearningObservation {
    const isAccurate = predictedOutcome === actualOutcome;
    const accuracy = isAccurate ? 1.0 : 0.0;
    const calibratedConfidence = isAccurate ? 0.95 : 0.70;

    const record: LearningObservation = {
      observationId: `learn_${Date.now()}`,
      predictionType,
      predictedOutcome,
      actualOutcome,
      accuracy,
      calibratedConfidence,
      timestamp: new Date().toISOString(),
    };

    this.observations.push(record);
    return record;
  }

  public static getAverageAccuracy(): number {
    if (this.observations.length === 0) return 1.0;
    const sum = this.observations.reduce((acc, curr) => acc + curr.accuracy, 0);
    return Math.round((sum / this.observations.length) * 100) / 100;
  }

  public static listObservations(): LearningObservation[] {
    return [...this.observations];
  }

  public static clear(): void {
    this.observations = [];
  }
}
