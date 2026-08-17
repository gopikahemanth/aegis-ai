/**
 * EnterpriseChangeRegistry
 *
 * Authoritative registry of all enterprise engineering changes and their complete lifecycles:
 * PROPOSED -> ANALYZING -> SIMULATED -> REVIEW_REQUIRED -> AUTHORIZED -> SCHEDULED -> EXECUTING -> VERIFYING -> COMPLETED
 * Failure paths: BLOCKED, REJECTED, ROLLBACK_REQUIRED, ROLLED_BACK, FAILED
 */

export type EnterpriseChangeLifecycleState =
  | "PROPOSED"
  | "ANALYZING"
  | "SIMULATED"
  | "REVIEW_REQUIRED"
  | "AUTHORIZED"
  | "SCHEDULED"
  | "EXECUTING"
  | "VERIFYING"
  | "COMPLETED"
  | "BLOCKED"
  | "REJECTED"
  | "ROLLBACK_REQUIRED"
  | "ROLLED_BACK"
  | "FAILED";

export interface EnterpriseChangeRecord {
  changeId: string;
  projectId: string;
  organizationId: string;
  teamId: string;
  environment: string;
  sourceExecutionId: string;
  sourceDecisionId: string;
  sourceAuthorizationId?: string;
  title: string;
  affectedFiles: string[];
  affectedServices: string[];
  affectedDatabases: string[];
  dependencies: string[];
  riskClassification: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "BLOCKED";
  expectedOutcome: string;
  actualOutcome?: string;
  verificationStatus: "PENDING" | "PASSED" | "FAILED";
  rollbackStatus: "NOT_REQUIRED" | "READY" | "EXECUTED";
  createdAt: string;
  actor: string;
  status: EnterpriseChangeLifecycleState;
}

export class EnterpriseChangeRegistry {
  private static changes: Map<string, EnterpriseChangeRecord> = new Map();

  public static registerChange(
    record: Omit<EnterpriseChangeRecord, "changeId" | "createdAt" | "status" | "verificationStatus" | "rollbackStatus">
  ): EnterpriseChangeRecord {
    if (!record.sourceExecutionId || !record.sourceDecisionId) {
      throw new Error("INVALID_CHANGE_LINEAGE: Enterprise change must reference sourceExecutionId and sourceDecisionId.");
    }

    const changeId = `chg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullRecord: EnterpriseChangeRecord = {
      ...record,
      changeId,
      createdAt: new Date().toISOString(),
      status: "PROPOSED",
      verificationStatus: "PENDING",
      rollbackStatus: "READY",
    };

    this.changes.set(changeId, fullRecord);
    return fullRecord;
  }

  public static transitionState(changeId: string, newState: EnterpriseChangeLifecycleState): EnterpriseChangeRecord {
    const change = this.changes.get(changeId);
    if (!change) throw new Error(`Change record ${changeId} not found.`);

    change.status = newState;
    this.changes.set(changeId, change);
    return change;
  }

  public static getChange(changeId: string): EnterpriseChangeRecord | undefined {
    return this.changes.get(changeId);
  }

  public static listChanges(): EnterpriseChangeRecord[] {
    return Array.from(this.changes.values());
  }

  public static reset(): void {
    this.changes.clear();
  }
}
