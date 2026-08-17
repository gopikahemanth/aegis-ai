/**
 * EnterpriseReliabilityStateEngine
 *
 * Tracks holistic reliability, SLO state, and recovery readiness across enterprise nodes.
 */

export type ReliabilityState =
  | "STABLE"
  | "DEGRADED"
  | "AT_RISK"
  | "INCIDENT"
  | "RECOVERING"
  | "PARTIALLY_RECOVERED"
  | "RECOVERED"
  | "BUSINESS_RECOVERED"
  | "CRITICAL"
  | "UNKNOWN";

export interface ProjectReliabilityRecord {
  projectId: string;
  organizationId: string;
  environment: string;
  state: ReliabilityState;
  activeIncidentsCount: number;
  rtoCompliancePercentage: number;
  rpoCompliancePercentage: number;
  lastVerifiedAt: string;
}

export class EnterpriseReliabilityStateEngine {
  private static states: Map<string, ProjectReliabilityRecord> = new Map();

  public static updateState(record: ProjectReliabilityRecord): void {
    this.states.set(record.projectId, record);
  }

  public static getState(projectId: string): ProjectReliabilityRecord {
    return (
      this.states.get(projectId) || {
        projectId,
        organizationId: "default_org",
        environment: "production",
        state: "STABLE",
        activeIncidentsCount: 0,
        rtoCompliancePercentage: 100,
        rpoCompliancePercentage: 100,
        lastVerifiedAt: new Date().toISOString(),
      }
    );
  }

  public static reset(): void {
    this.states.clear();
  }
}
