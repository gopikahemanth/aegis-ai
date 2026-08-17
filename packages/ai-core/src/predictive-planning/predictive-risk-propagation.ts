/**
 * PredictiveRiskPropagationEngine
 *
 * Models how upstream infrastructure/code risks propagate downstream to business capabilities.
 */

export interface PropagatedRiskReport {
  riskId: string;
  sourceComponent: string;
  affectedProjects: string[];
  affectedCapabilities: string[];
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  probabilityPercentage: number;
  classification: "FORECAST";
  summary: string;
}

export class PredictiveRiskPropagationEngine {
  public static propagateRisk(
    source: string,
    projects: string[],
    capabilities: string[],
    probability: number
  ): PropagatedRiskReport {
    const severity: PropagatedRiskReport["severity"] =
      capabilities.length >= 3 ? "CRITICAL" : capabilities.length >= 2 ? "HIGH" : "MODERATE";

    return {
      riskId: `risk_prop_${Date.now()}`,
      sourceComponent: source,
      affectedProjects: projects,
      affectedCapabilities: capabilities,
      severity,
      probabilityPercentage: probability,
      classification: "FORECAST",
      summary: `Risk from ${source} propagates to ${projects.length} project(s) and ${capabilities.length} business capability(ies).`,
    };
  }
}
