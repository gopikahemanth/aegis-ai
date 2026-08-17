/**
 * ClosedLoopLearningEngine
 *
 * Calibrates prediction confidence and decision heuristics based on measured outcomes.
 * Hard Invariants:
 * 1. LEARNING -> MODEL CALIBRATION
 * 2. LEARNING != SAFETY POLICY MUTATION
 * 3. LEARNING != AUTHORIZATION BYPASS
 */

export interface ModelCalibrationUpdate {
  modelDomain: string;
  previousConfidenceMultiplier: number;
  newConfidenceMultiplier: number;
  sampleSize: number;
  safetyPoliciesMutated: 0; // Strictly 0
  authorizationBypassesAttempted: 0; // Strictly 0
}

export class ClosedLoopLearningEngine {
  private static calibrations: Map<string, number> = new Map();

  public static calibrateModel(
    domain: string,
    outcomeWasAccurate: boolean
  ): ModelCalibrationUpdate {
    const current = this.calibrations.get(domain) || 1.0;
    const adjusted = outcomeWasAccurate
      ? Math.min(1.2, parseFloat((current + 0.05).toFixed(2)))
      : Math.max(0.7, parseFloat((current - 0.1).toFixed(2)));

    this.calibrations.set(domain, adjusted);

    return {
      modelDomain: domain,
      previousConfidenceMultiplier: current,
      newConfidenceMultiplier: adjusted,
      sampleSize: 1,
      safetyPoliciesMutated: 0,
      authorizationBypassesAttempted: 0,
    };
  }

  public static getCalibration(domain: string): number {
    return this.calibrations.get(domain) || 1.0;
  }

  public static reset(): void {
    this.calibrations.clear();
  }
}
