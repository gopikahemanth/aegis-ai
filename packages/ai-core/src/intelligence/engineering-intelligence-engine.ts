/**
 * EngineeringIntelligenceEngine
 *
 * Central intelligence layer correlating health, incidents, telemetry, release lineage,
 * contract changes, dependency shifts, and historical repairs.
 */

import { IncidentEngine, type IncidentRecord } from "../operations/incident-engine.js";
import { ProductionHealthMonitor, type ProductionHealthReport } from "../operations/production-health-monitor.js";
import { ReleaseLineageTracker, type LineageNode } from "../operations/release-lineage.js";

export interface IntelligenceInsight {
  insightId: string;
  projectId: string;
  category: "RELIABILITY" | "REGRESSION" | "PERFORMANCE" | "SECURITY" | "CONTRACT_DRIFT";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  hypothesis: string;
  introducedInRelease?: string;
  affectedContracts?: string[];
  recommendedAction: string;
  confidence: number;
}

export interface ProjectIntelligenceSummary {
  projectId: string;
  timestamp: string;
  health: ProductionHealthReport;
  activeIncidents: IncidentRecord[];
  lineage: LineageNode[];
  insights: IntelligenceInsight[];
  summary: string;
}

export class EngineeringIntelligenceEngine {
  /**
   * Correlate and synthesize comprehensive engineering intelligence for a project.
   */
  public static async analyzeProject(
    projectId: string,
    environment: any = "production",
    liveServerUrl?: string
  ): Promise<ProjectIntelligenceSummary> {
    const health = await ProductionHealthMonitor.evaluateHealth(projectId, environment, liveServerUrl);
    const incidents = IncidentEngine.listIncidents(projectId).filter((i) => i.environment === environment);
    const lineage = ReleaseLineageTracker.getLineage(projectId);
    const insights: IntelligenceInsight[] = [];

    // Correlate active incidents with release lineage
    for (const inc of incidents) {
      if (inc.status !== "RESOLVED") {
        const latestRelease = lineage.length > 0 ? lineage[lineage.length - 1].releaseId : "unknown";
        insights.push({
          insightId: `ins_${Date.now()}_${inc.incidentId}`,
          projectId,
          category: inc.classification === "DATABASE_FAILURE" ? "RELIABILITY" : "REGRESSION",
          severity: inc.severity,
          hypothesis: `Active incident ${inc.incidentId} detected in release ${latestRelease}: ${inc.symptoms[0] || "Unknown symptom"}`,
          introducedInRelease: latestRelease,
          recommendedAction: "Execute governed remediation plan or rollback to last known good release.",
          confidence: 0.92,
        });
      }
    }

    return {
      projectId,
      timestamp: new Date().toISOString(),
      health,
      activeIncidents: incidents,
      lineage,
      insights,
      summary: `Engineering Intelligence: ${insights.length} insight(s) correlated across ${lineage.length} generation(s) and ${incidents.length} incident(s).`,
    };
  }
}
