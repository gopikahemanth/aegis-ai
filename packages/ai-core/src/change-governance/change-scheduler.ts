/**
 * ChangeScheduler
 *
 * Coordinates execution scheduling considering maintenance windows, SLO health, and concurrent changes.
 */

export interface SchedulingContext {
  changeId: string;
  hasActiveIncidents: boolean;
  isSloExhausted: boolean;
  isInMaintenanceWindow: boolean;
  concurrentChangesCount: number;
}

export interface SchedulingDecision {
  changeId: string;
  decision: "EXECUTE_NOW" | "SCHEDULE" | "DEFER" | "BLOCK" | "REQUEST_REVIEW";
  reason: string;
}

export class ChangeScheduler {
  public static evaluateSchedule(ctx: SchedulingContext): SchedulingDecision {
    if (ctx.hasActiveIncidents) {
      return {
        changeId: ctx.changeId,
        decision: "BLOCK",
        reason: "ACTIVE_INCIDENT: Target environment has active unresolved incidents.",
      };
    }

    if (ctx.isSloExhausted) {
      return {
        changeId: ctx.changeId,
        decision: "DEFER",
        reason: "SLO_EXHAUSTION: Error budget is depleted. Change deferred to maintenance window.",
      };
    }

    if (ctx.concurrentChangesCount > 3) {
      return {
        changeId: ctx.changeId,
        decision: "SCHEDULE",
        reason: "CONCURRENCY_LIMIT: Staggering change execution to avoid resource contention.",
      };
    }

    return {
      changeId: ctx.changeId,
      decision: "EXECUTE_NOW",
      reason: "All environmental and SLO prerequisites satisfied for immediate execution.",
    };
  }
}
