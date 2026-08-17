/**
 * EscalationEngine
 *
 * Automatically escalates critical engineering bottlenecks (unresolved incidents, expired approvals, SLO breaches).
 */

export interface EscalationRecord {
  escalationId: string;
  sourceType: "APPROVAL_EXPIRED" | "INCIDENT_UNRESOLVED" | "SLO_ERROR_BUDGET_DEPLETED";
  sourceId: string;
  escalatedToRole: "PROJECT_ADMIN" | "RELEASE_MANAGER" | "SECURITY_OFFICER" | "PLATFORM_ADMIN";
  reason: string;
  timestamp: string;
}

export class EscalationEngine {
  private static escalations: EscalationRecord[] = [];

  public static triggerEscalation(
    sourceType: EscalationRecord["sourceType"],
    sourceId: string,
    reason: string,
    role: EscalationRecord["escalatedToRole"] = "PLATFORM_ADMIN"
  ): EscalationRecord {
    const record: EscalationRecord = {
      escalationId: `esc_${Date.now()}`,
      sourceType,
      sourceId,
      escalatedToRole: role,
      reason,
      timestamp: new Date().toISOString(),
    };
    this.escalations.push(record);
    return record;
  }

  public static listEscalations(): EscalationRecord[] {
    return [...this.escalations];
  }

  public static reset(): void {
    this.escalations = [];
  }
}
