/**
 * IncidentEngine
 *
 * Manages the lifecycle of production incidents with structured evidence,
 * classification, status progression, and audit trail integration.
 */

import { AuditLog } from "../control-plane/audit-log.js";
import type { EnvironmentType } from "./production-state.js";
import { ProductionStateManager } from "./production-state.js";

export type IncidentClassification =
  | "APPLICATION_FAILURE"
  | "DATABASE_FAILURE"
  | "API_FAILURE"
  | "AUTH_FAILURE"
  | "DEPENDENCY_FAILURE"
  | "PERFORMANCE_DEGRADATION"
  | "SECURITY_EVENT"
  | "RESOURCE_EXHAUSTION"
  | "DEPLOYMENT_FAILURE"
  | "ENVIRONMENT_FAILURE"
  | "UNKNOWN";

export type IncidentStatus = "DETECTED" | "INVESTIGATING" | "MITIGATED" | "RESOLVED";

export interface IncidentRecord {
  incidentId: string;
  projectId: string;
  environment: EnvironmentType;
  releaseId?: string;
  classification: IncidentClassification;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: IncidentStatus;
  detectedAt: string;
  symptoms: string[];
  evidence: Record<string, any>;
  timeline: Array<{ timestamp: string; event: string; actor: string }>;
  resolution?: string;
}

export class IncidentEngine {
  private static incidents: Map<string, IncidentRecord[]> = new Map(); // projectId -> incidents[]

  /**
   * Create and record a new production incident.
   */
  public static createIncident(
    projectPath: string,
    projectId: string,
    environment: EnvironmentType,
    classification: IncidentClassification,
    severity: IncidentRecord["severity"],
    symptoms: string[],
    evidence: Record<string, any> = {}
  ): IncidentRecord {
    const incidentId = `inc_${Date.now()}_${classification.toLowerCase()}`;
    const detectedAt = new Date().toISOString();

    const record: IncidentRecord = {
      incidentId,
      projectId,
      environment,
      classification,
      severity,
      status: "DETECTED",
      detectedAt,
      symptoms,
      evidence,
      timeline: [
        {
          timestamp: detectedAt,
          event: `Incident detected: ${classification} (Severity: ${severity})`,
          actor: "ProductionHealthMonitor",
        },
      ],
    };

    const list = this.incidents.get(projectId) || [];
    list.push(record);
    this.incidents.set(projectId, list);

    // Update active incident counter in state
    ProductionStateManager.updateState(projectId, environment, {
      activeIncidentsCount: list.filter((i) => i.status !== "RESOLVED").length,
    });

    // Record audit event
    AuditLog.record(projectPath, projectId, "SECURITY", "SECURITY", {
      incidentId,
      classification,
      severity,
      environment,
    });

    return record;
  }

  /**
   * Update incident status (e.g. to MITIGATED or RESOLVED).
   */
  public static updateIncidentStatus(
    projectId: string,
    incidentId: string,
    newStatus: IncidentStatus,
    resolutionNote?: string
  ): IncidentRecord | undefined {
    const list = this.incidents.get(projectId) || [];
    const inc = list.find((i) => i.incidentId === incidentId);
    if (!inc) return undefined;

    inc.status = newStatus;
    if (resolutionNote) inc.resolution = resolutionNote;

    inc.timeline.push({
      timestamp: new Date().toISOString(),
      event: `Status updated to ${newStatus}${resolutionNote ? `: ${resolutionNote}` : ""}`,
      actor: "OperationsController",
    });

    ProductionStateManager.updateState(projectId, inc.environment, {
      activeIncidentsCount: list.filter((i) => i.status !== "RESOLVED").length,
    });

    return inc;
  }

  public static listIncidents(projectId?: string): IncidentRecord[] {
    if (projectId) {
      return this.incidents.get(projectId) || [];
    }
    const all: IncidentRecord[] = [];
    for (const [_, list] of this.incidents) {
      all.push(...list);
    }
    return all;
  }


  public static getIncident(projectId: string, incidentId: string): IncidentRecord | undefined {
    const list = this.incidents.get(projectId) || [];
    return list.find((i) => i.incidentId === incidentId);
  }

  public static reset(): void {
    this.incidents.clear();
  }
}
