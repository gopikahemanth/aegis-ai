/**
 * SelfCapacityEngine
 *
 * Evaluates internal platform load, worker utilization, and queue depth
 * to produce controlled scaling recommendations.
 */

export interface CapacityState {
  status: "UNDERUTILIZED" | "HEALTHY" | "HIGH_LOAD" | "SATURATED";
  activeWorkers: number;
  queuedJobs: number;
  recommendation: "ADD_WORKER" | "REMOVE_WORKER" | "MAINTAIN" | "THROTTLE_QUEUE";
}

export class SelfCapacityEngine {
  public static evaluateCapacity(activeWorkers: number = 4, queuedJobs: number = 0): CapacityState {
    if (queuedJobs > activeWorkers * 3) {
      return {
        status: "HIGH_LOAD",
        activeWorkers,
        queuedJobs,
        recommendation: "ADD_WORKER",
      };
    }
    return {
      status: "HEALTHY",
      activeWorkers,
      queuedJobs,
      recommendation: "MAINTAIN",
    };
  }
}
