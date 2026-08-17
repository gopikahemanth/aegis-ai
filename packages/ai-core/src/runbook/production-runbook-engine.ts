/**
 * ProductionRunbookEngine
 *
 * Machine-readable operational incident runbooks with structured steps:
 * Detection -> Diagnosis -> Evidence -> Authorization -> Remediation -> Verification -> Rollback -> Closure.
 */

export interface RunbookStep {
  step: "DETECTION" | "DIAGNOSIS" | "EVIDENCE" | "AUTHORIZATION" | "REMEDIATION" | "VERIFICATION" | "ROLLBACK" | "CLOSURE";
  action: string;
  automated: boolean;
}

export interface ProductionRunbook {
  runbookId: string;
  name: string;
  incidentClassification: string;
  steps: RunbookStep[];
}

export class ProductionRunbookEngine {
  private static runbooks: Map<string, ProductionRunbook> = new Map();

  static {
    this.registerDefaultRunbooks();
  }

  private static registerDefaultRunbooks(): void {
    this.runbooks.set("DATABASE_FAILURE", {
      runbookId: "rb_db_fail",
      name: "Database Connection Pool Outage Runbook",
      incidentClassification: "DATABASE_FAILURE",
      steps: [
        { step: "DETECTION", action: "Inspect PostgreSQL Prisma timeout errors", automated: true },
        { step: "DIAGNOSIS", action: "Evaluate connection saturation via RootCauseAnalyzer", automated: true },
        { step: "EVIDENCE", action: "Capture active PIDs and DB pool utilization metrics", automated: true },
        { step: "AUTHORIZATION", action: "Request human release manager approval for pool migration", automated: false },
        { step: "REMEDIATION", action: "Scale connection pool parameters in schema/config", automated: true },
        { step: "VERIFICATION", action: "Run live API query roundtrip against database", automated: true },
        { step: "ROLLBACK", action: "Atomic rollback to previous verified checkpoint if query fails", automated: true },
        { step: "CLOSURE", action: "Record verified resolution in EngineeringKnowledgeIndex", automated: true },
      ],
    });

    this.runbooks.set("DEPLOYMENT_FAILURE", {
      runbookId: "rb_deploy_fail",
      name: "Canary Deployment Health Degradation Runbook",
      incidentClassification: "DEPLOYMENT_FAILURE",
      steps: [
        { step: "DETECTION", action: "Detect 5xx spike or health probe UNAVAILABLE", automated: true },
        { step: "DIAGNOSIS", action: "Compare candidate release against baseline", automated: true },
        { step: "EVIDENCE", action: "Extract HTTP access logs and stack traces", automated: true },
        { step: "AUTHORIZATION", action: "Autonomous rollback approved under SAFE_REMEDATION", automated: true },
        { step: "REMEDIATION", action: "Execute atomic canary rollback to superseded release", automated: true },
        { step: "VERIFICATION", action: "Verify baseline release health recovers to HEALTHY", automated: true },
        { step: "CLOSURE", action: "Update release lineage and incident engine status", automated: true },
      ],
    });
  }

  public static getRunbook(classification: string): ProductionRunbook | undefined {
    return this.runbooks.get(classification);
  }

  public static listRunbooks(): ProductionRunbook[] {
    return Array.from(this.runbooks.values());
  }
}
