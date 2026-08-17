/**
 * ExecutionPreflightEngine
 *
 * Performs comprehensive pre-execution safety and readiness verification.
 */

export interface PreflightCheckContext {
  projectId: string;
  environment: string;
  hasActiveIncidents: boolean;
  isSloBreached: boolean;
  hasRollbackPlan: boolean;
  isBackupFresh: boolean;
  hasDependencyFailures: boolean;
  isReleaseMatched: boolean;
}

export interface PreflightCheckResult {
  status: "READY" | "BLOCKED" | "REQUIRES_REVIEW";
  passed: boolean;
  blockingFailures: string[];
  warnings: string[];
  summary: string;
}

export class ExecutionPreflightEngine {
  public static runPreflight(ctx: PreflightCheckContext): PreflightCheckResult {
    const blockingFailures: string[] = [];
    const warnings: string[] = [];

    if (ctx.hasActiveIncidents) {
      blockingFailures.push("ACTIVE_INCIDENT: Target environment has unresolved active incidents.");
    }
    if (!ctx.hasRollbackPlan) {
      blockingFailures.push("ROLLBACK_NOT_READY: No verified rollback procedure configured.");
    }
    if (!ctx.isBackupFresh) {
      blockingFailures.push("STALE_BACKUP: Database backup snapshot is older than the allowed RPO threshold.");
    }
    if (ctx.hasDependencyFailures) {
      blockingFailures.push("DEPENDENCY_FAILURE: Upstream dependent services are currently degraded or unreachable.");
    }
    if (!ctx.isReleaseMatched) {
      blockingFailures.push("RELEASE_MISMATCH: Target environment version does not match expected baseline release.");
    }
    if (ctx.isSloBreached) {
      warnings.push("SLO_BREACH: Error budget is exhausted. Execution requires elevated review.");
    }

    const passed = blockingFailures.length === 0;
    const status: PreflightCheckResult["status"] = !passed
      ? "BLOCKED"
      : warnings.length > 0
      ? "REQUIRES_REVIEW"
      : "READY";

    return {
      status,
      passed,
      blockingFailures,
      warnings,
      summary: passed
        ? "All preflight safety checks passed. Execution is clear to proceed."
        : `Preflight safety checks BLOCKED by ${blockingFailures.length} critical issue(s).`,
    };
  }
}
