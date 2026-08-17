/**
 * OutcomeLearningEngine
 *
 * Compares predicted outcomes against actual verified outcomes to calibrate prediction confidence.
 * HARD INVARIANT: LEARNING CAN NEVER MUTATE SAFETY, GOVERNANCE, OR SECURITY POLICIES.
 */

export interface OutcomeLearningRecord {
  initiativeId: string;
  predictedMetricValue: number;
  actualMetricValue: number;
  predictionError: number;
  predictionAccuracy: number; // 0 - 100%
  timestamp: string;
}

export class OutcomeLearningEngine {
  private static records: OutcomeLearningRecord[] = [];

  public static recordCalibration(initiativeId: string, predicted: number, actual: number): OutcomeLearningRecord {
    const error = Math.abs(predicted - actual);
    const accuracy = Math.max(0, Math.min(100, 100 - (error / (predicted || 1)) * 100));

    const record: OutcomeLearningRecord = {
      initiativeId,
      predictedMetricValue: predicted,
      actualMetricValue: actual,
      predictionError: error,
      predictionAccuracy: Math.round(accuracy),
      timestamp: new Date().toISOString(),
    };
    this.records.push(record);
    return record;
  }

  public static getCalibrationHistory(): OutcomeLearningRecord[] {
    return [...this.records];
  }

  public static reset(): void {
    this.records = [];
  }
}
