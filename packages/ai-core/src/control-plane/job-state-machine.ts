/**
 * JobStateMachine
 *
 * Enforces deterministic allowed status transitions for GenerationJobs.
 */

import type { JobStatus } from "./job.js";

export class JobStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
    QUEUED: ["ANALYZING", "CANCELLED", "PAUSED"],
    ANALYZING: ["CLARIFYING", "PLANNING", "CONTRACTING", "GENERATING", "WAITING_FOR_AUTHORIZATION", "FAILED", "BLOCKED", "CANCELLED", "PAUSED"],
    CLARIFYING: ["PLANNING", "CONTRACTING", "GENERATING", "BLOCKED", "FAILED", "CANCELLED", "PAUSED"],
    WAITING_FOR_AUTHORIZATION: ["PLANNING", "CONTRACTING", "GENERATING", "BLOCKED", "CANCELLED", "PAUSED"],
    PLANNING: ["CONTRACTING", "GENERATING", "COMPLETED", "FAILED", "BLOCKED", "CANCELLED", "PAUSED"],
    CONTRACTING: ["GENERATING", "COMPLETED", "FAILED", "BLOCKED", "CANCELLED", "PAUSED"],

    GENERATING: ["VALIDATING", "BUILDING", "RUNNING", "VERIFYING", "REPAIRING", "COMPLETED", "FAILED", "BLOCKED", "CANCELLED", "PAUSED"],
    VALIDATING: ["BUILDING", "RUNNING", "VERIFYING", "REPAIRING", "COMPLETED", "FAILED", "BLOCKED", "CANCELLED", "PAUSED"],
    BUILDING: ["RUNNING", "VERIFYING", "REPAIRING", "COMPLETED", "FAILED", "BLOCKED", "CANCELLED", "PAUSED"],
    RUNNING: ["VERIFYING", "REGRESSION_TESTING", "REPAIRING", "COMPLETED", "FAILED", "BLOCKED", "CANCELLED", "PAUSED"],
    VERIFYING: ["REGRESSION_TESTING", "COMPLETED", "REPAIRING", "FAILED", "BLOCKED", "CANCELLED", "PAUSED"],

    REPAIRING: ["VALIDATING", "BUILDING", "RUNNING", "VERIFYING", "FAILED", "BLOCKED", "CANCELLED", "PAUSED"],
    REGRESSION_TESTING: ["COMPLETED", "FAILED", "BLOCKED", "CANCELLED", "PAUSED"],
    PAUSED: ["RESUMING", "CANCELLED"],
    RESUMING: [
      "ANALYZING",
      "PLANNING",
      "CONTRACTING",
      "GENERATING",
      "VALIDATING",
      "BUILDING",
      "RUNNING",
      "VERIFYING",
      "REGRESSION_TESTING",
      "FAILED",
      "CANCELLED",
    ],
    COMPLETED: [],
    FAILED: ["RESUMING", "QUEUED"],
    BLOCKED: ["RESUMING", "WAITING_FOR_AUTHORIZATION", "CANCELLED"],
    CANCELLED: [],
  };

  /**
   * Verify if transitioning from `from` to `to` is legally allowed.
   */
  public static canTransition(from: JobStatus, to: JobStatus): boolean {
    if (from === to) return true;
    const allowed = this.ALLOWED_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Validate and assert transition, throwing error if illegal.
   */
  public static transition(from: JobStatus, to: JobStatus): JobStatus {
    if (!this.canTransition(from, to)) {
      throw new Error(`[JobStateMachine] ❌ Illegal state transition from "${from}" to "${to}".`);
    }
    return to;
  }
}
