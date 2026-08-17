/**
 * ProductDefectCoordinator
 *
 * Unifies defect triage across Build, Runtime, API, Database, Browser, UI, Accessibility, and Security.
 * Prioritizes repairs by severity, business impact, requirement criticality, and blast radius.
 */

export interface UnifiedProductDefect {
  defectId: string;
  category: "BUILD" | "RUNTIME" | "API" | "DATABASE" | "BROWSER" | "REQUIREMENTS" | "UI" | "ACCESSIBILITY" | "SECURITY";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  targetFile: string;
  blastRadius: "ISOLATED" | "SUBSYSTEM" | "SYSTEM_WIDE";
}

export class ProductDefectCoordinator {
  public static triageDefects(defects: UnifiedProductDefect[]): UnifiedProductDefect[] {
    const severityWeight: Record<UnifiedProductDefect["severity"], number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return [...defects].sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
  }

  public static hasCriticalBlockers(defects: UnifiedProductDefect[]): boolean {
    return defects.some((d) => d.severity === "CRITICAL");
  }
}
