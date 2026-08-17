/**
 * ChangePatternEngine
 *
 * Detects systemic enterprise change failure, coupling, and hotspot patterns.
 */

export type DetectedChangePatternType =
  | "REPEATED_FAILURE"
  | "REPEATED_ROLLBACK"
  | "REPEATED_SUCCESS"
  | "DEPENDENCY_HOTSPOT"
  | "HIGH_RISK_COMPONENT"
  | "CHANGE_COUPLING"
  | "FREQUENT_INCIDENT_TRIGGER";

export interface ChangePatternFinding {
  patternId: string;
  patternType: DetectedChangePatternType;
  targetComponent: string;
  frequency: number;
  riskSeverity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recommendation: string;
}

export class ChangePatternEngine {
  public static detectPatterns(
    componentName: string,
    successCount: number,
    failureCount: number
  ): ChangePatternFinding {
    if (failureCount >= 3) {
      return {
        patternId: `pat_${Date.now()}`,
        patternType: "HIGH_RISK_COMPONENT",
        targetComponent: componentName,
        frequency: failureCount,
        riskSeverity: "HIGH",
        recommendation: `Component ${componentName} exhibits repeated failures (${failureCount}). Recommend modular refactoring and elevated preflight requirements.`,
      };
    }

    return {
      patternId: `pat_${Date.now()}`,
      patternType: "REPEATED_SUCCESS",
      targetComponent: componentName,
      frequency: successCount,
      riskSeverity: "LOW",
      recommendation: `Component ${componentName} maintains strong change reliability (${successCount} successful changes).`,
    };
  }
}
