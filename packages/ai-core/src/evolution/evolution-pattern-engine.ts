/**
 * EvolutionPatternEngine
 *
 * Discovers recurring systemic patterns across architectural components, dependencies, and regressions.
 */

export type EvolutionPatternType =
  | "REPEATED_ARCHITECTURAL_FAILURE"
  | "REPEATED_DEPENDENCY_PROBLEM"
  | "REPEATED_PERFORMANCE_REGRESSION"
  | "REPEATED_SECURITY_FINDING"
  | "REPEATED_ROLLBACK"
  | "REPEATED_MANUAL_REMEDIATION"
  | "REPEATED_TECHNICAL_DEBT"
  | "REPEATED_COST_OVERHEAD";

export interface EvolutionPatternFinding {
  patternId: string;
  patternType: EvolutionPatternType;
  component: string;
  occurrenceCount: number;
  systemicSeverity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recommendation: string;
}

export class EvolutionPatternEngine {
  public static detectPatterns(
    componentName: string,
    incidentsCount: number,
    rollbackCount: number
  ): EvolutionPatternFinding {
    if (rollbackCount >= 2) {
      return {
        patternId: `pat_${Date.now()}_rb`,
        patternType: "REPEATED_ROLLBACK",
        component: componentName,
        occurrenceCount: rollbackCount,
        systemicSeverity: "HIGH",
        recommendation: `Component ${componentName} has rolled back ${rollbackCount} times. Prioritize decoupled evolution plan.`,
      };
    }

    if (incidentsCount >= 3) {
      return {
        patternId: `pat_${Date.now()}_arch`,
        patternType: "REPEATED_ARCHITECTURAL_FAILURE",
        component: componentName,
        occurrenceCount: incidentsCount,
        systemicSeverity: "CRITICAL",
        recommendation: `Component ${componentName} is experiencing systemic failures (${incidentsCount} incidents). Recommend architectural refactoring.`,
      };
    }

    return {
      patternId: `pat_${Date.now()}_td`,
      patternType: "REPEATED_TECHNICAL_DEBT",
      component: componentName,
      occurrenceCount: 1,
      systemicSeverity: "LOW",
      recommendation: `Component ${componentName} is stable with minor technical debt.`,
    };
  }
}
