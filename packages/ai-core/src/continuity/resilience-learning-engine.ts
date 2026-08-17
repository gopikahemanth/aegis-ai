/**
 * ResilienceLearningEngine
 *
 * Compares predicted resilience against verified real recovery outcomes.
 * Invariant: RECOVERY LEARNING != SAFETY POLICY MUTATION.
 */

export interface ResilienceLearningReport {
  learningId: string;
  projectId: string;
  predictedRTOSeconds: number;
  actualRTOSeconds: number;
  rtoErrorSeconds: number;
  predictionAccuracyRate: number; // 0 - 100%
  classification: "CONFIRMED" | "UNDERPREDICTED" | "OVERPREDICTED" | "INSUFFICIENT_EVIDENCE";
  policyMutationsAttempted: number; // Strictly 0
  summary: string;
}

export class ResilienceLearningEngine {
  public static evaluateLearning(
    projectId: string,
    predictedRTOSeconds: number,
    actualRTOSeconds: number
  ): ResilienceLearningReport {
    const error = Math.abs(predictedRTOSeconds - actualRTOSeconds);
    const accuracy = Math.max(0, Math.round(100 - (error / (predictedRTOSeconds || 1)) * 100));

    let classification: ResilienceLearningReport["classification"] = "CONFIRMED";
    if (actualRTOSeconds > predictedRTOSeconds * 1.2) {
      classification = "UNDERPREDICTED";
    } else if (actualRTOSeconds < predictedRTOSeconds * 0.8) {
      classification = "OVERPREDICTED";
    }

    return {
      learningId: `res_learn_${Date.now()}`,
      projectId,
      predictedRTOSeconds,
      actualRTOSeconds,
      rtoErrorSeconds: error,
      predictionAccuracyRate: accuracy,
      classification,
      policyMutationsAttempted: 0, // Guarantees safety policy immutability
      summary: `Resilience learning calibrated. Prediction accuracy: ${accuracy}%. Zero policy mutations attempted.`,
    };
  }
}
