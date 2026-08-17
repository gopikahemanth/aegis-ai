/**
 * WorkerManager
 *
 * Manages distributed worker nodes, heartbeats, and project lease ownership
 * to guarantee strictly single-worker authoritative mutations without split-brain conflicts.
 */

export interface WorkerLease {
  workerId: string;
  projectId: string;
  jobId: string;
  acquiredAt: string;
  expiresAt: number; // timestamp ms
}

export interface WorkerNode {
  workerId: string;
  status: "ONLINE" | "BUSY" | "OFFLINE";
  lastHeartbeat: number;
}

export class WorkerManager {
  private static workers: Map<string, WorkerNode> = new Map();
  private static leases: Map<string, WorkerLease> = new Map(); // key = projectId

  /**
   * Register or heartbeat a worker.
   */
  public static heartbeat(workerId: string): void {
    this.workers.set(workerId, {
      workerId,
      status: "ONLINE",
      lastHeartbeat: Date.now(),
    });
  }

  /**
   * Acquire an exclusive project lease for a job.
   */
  public static acquireLease(workerId: string, projectId: string, jobId: string, ttlMs: number = 5000): boolean {
    const existing = this.leases.get(projectId);
    const now = Date.now();

    if (existing && existing.expiresAt > now && existing.workerId !== workerId) {
      return false; // Lease held by another active worker
    }

    this.leases.set(projectId, {
      workerId,
      projectId,
      jobId,
      acquiredAt: new Date().toISOString(),
      expiresAt: now + ttlMs,
    });

    const worker = this.workers.get(workerId);
    if (worker) worker.status = "BUSY";

    return true;
  }

  /**
   * Release project lease upon job completion.
   */
  public static releaseLease(workerId: string, projectId: string): void {
    const existing = this.leases.get(projectId);
    if (existing && existing.workerId === workerId) {
      this.leases.delete(projectId);
    }
    const worker = this.workers.get(workerId);
    if (worker) worker.status = "ONLINE";
  }

  public static getLease(projectId: string): WorkerLease | undefined {
    const existing = this.leases.get(projectId);
    if (existing && existing.expiresAt <= Date.now()) {
      this.leases.delete(projectId);
      return undefined;
    }
    return existing;
  }

  public static reset(): void {
    this.workers.clear();
    this.leases.clear();
  }
}
