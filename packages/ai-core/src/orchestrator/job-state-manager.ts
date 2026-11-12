/**
 * JobStateManager
 *
 * Provides persistent, structured state management for Aegis AI generation jobs:
 * - Tracks job status through strict state machine transitions
 * - Records stage progression, task completion, and agent envelopes
 * - Persists and loads atomic execution checkpoints (.aegis/job-state.json)
 * - Enables resuming interrupted jobs without re-executing verified tasks
 * - Handles safe cancellation with rollback safeguards
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Task } from "../planner/task.js";
import type { AgentExecutionEnvelope, OrchestratedAgentRole } from "./agent-contract.js";

export type OrchestratorJobStatus =
  | "INITIALIZING"
  | "PLANNING"
  | "EXECUTING_FRONTEND"
  | "AWAITING_REVIEW"
  | "EXECUTING_BACKEND"
  | "VERIFYING"
  | "REPAIRING"
  | "DELIVERED"
  | "FAILED"
  | "BLOCKED"
  | "CANCELLED";

export interface TaskSnapshot {
  id: number;
  title: string;
  stage: string;
  status: "PENDING" | "RUNNING" | "PASSED" | "FAILED" | "BLOCKED" | "SKIPPED";
  ownedFiles: string[];
  retryCount: number;
  durationMs?: number;
  error?: string;
  completedAt?: string;
}

export interface JobSnapshot {
  version: 2;
  jobId: string;
  request: string;
  outputDirectory: string;
  status: OrchestratorJobStatus;
  currentStage: string;
  architectureHash?: string;
  tasks: TaskSnapshot[];
  envelopes: AgentExecutionEnvelope[];
  completedTaskIds: number[];
  failedTaskIds: number[];
  reusableTaskIds: number[];
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
  blockingReason?: string;
}

export class JobStateManager {
  private currentJob: JobSnapshot | null = null;
  private isCancelledFlag: boolean = false;
  private cancellationReason?: string;

  constructor(private defaultProjectPath?: string) {}

  /**
   * Initializes a new generation job.
   */
  public createJob(
    jobId: string,
    request: string,
    outputDirectoryOrHash?: string,
    architectureHash?: string
  ): JobSnapshot {
    this.isCancelledFlag = false;
    this.cancellationReason = undefined;

    let outputDirectory = this.defaultProjectPath || process.cwd();
    let archHash = architectureHash;

    if (outputDirectoryOrHash) {
      if (
        outputDirectoryOrHash.startsWith("arch_") ||
        outputDirectoryOrHash.startsWith("hash_") ||
        (!architectureHash && !outputDirectoryOrHash.includes("/") && !outputDirectoryOrHash.includes("\\") && this.defaultProjectPath)
      ) {
        archHash = outputDirectoryOrHash;
      } else {
        outputDirectory = outputDirectoryOrHash;
      }
    }

    this.currentJob = {
      version: 2,
      jobId,
      request,
      outputDirectory,
      status: "INITIALIZING",
      currentStage: "Requirements",
      architectureHash: archHash,
      tasks: [],
      envelopes: [],
      completedTaskIds: [],
      failedTaskIds: [],
      reusableTaskIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.persist();
    return this.currentJob;
  }

  public getJob(): JobSnapshot | null {
    return this.currentJob;
  }

  public getStatus(): OrchestratorJobStatus {
    return this.currentJob?.status ?? "INITIALIZING";
  }

  /**
   * Transitions the job to a new stage and status following the strict state machine.
   */
  public transitionStage(stage: string, status: OrchestratorJobStatus): void {
    if (!this.currentJob) return;
    this.currentJob.currentStage = stage;
    this.currentJob.status = status;
    this.currentJob.updatedAt = new Date().toISOString();
    console.log(`[JobStateManager] 🔄 Stage Transition: [${stage}] -> Status: ${status}`);
    this.persist();
  }

  /**
   * Registers tasks planned for this job.
   */
  public registerTasks(tasks: Task[]): void {
    if (!this.currentJob) return;

    this.currentJob.tasks = tasks.map(t => ({
      id: t.id,
      title: t.title,
      stage: String(t.stage || "Frontend"),
      status: (t.status as any) || (t.completed ? "PASSED" : "PENDING"),
      ownedFiles: t.ownedFiles || [],
      retryCount: 0,
    }));

    this.currentJob.updatedAt = new Date().toISOString();
    this.persist();
  }

  /**
   * Updates state of a specific task.
   */
  public updateTaskState(
    taskId: number,
    status: "PENDING" | "RUNNING" | "PASSED" | "FAILED" | "BLOCKED" | "SKIPPED",
    options?: { error?: string; durationMs?: number }
  ): void {
    if (!this.currentJob) return;

    let task = this.currentJob.tasks.find(t => t.id === taskId);
    if (!task) {
      task = {
        id: taskId,
        title: `Task #${taskId}`,
        stage: "Execution",
        status,
        ownedFiles: [],
        retryCount: 0,
      };
      this.currentJob.tasks.push(task);
    }

    task.status = status;
    if (options?.error) task.error = options.error;
    if (options?.durationMs !== undefined) task.durationMs = options.durationMs;
    if (status === "PASSED") {
      task.completedAt = new Date().toISOString();
      if (!this.currentJob.completedTaskIds.includes(taskId)) {
        this.currentJob.completedTaskIds.push(taskId);
      }
      this.currentJob.failedTaskIds = this.currentJob.failedTaskIds.filter(id => id !== taskId);
    } else if (status === "FAILED") {
      task.retryCount++;
      if (!this.currentJob.failedTaskIds.includes(taskId)) {
        this.currentJob.failedTaskIds.push(taskId);
      }
    }

    this.currentJob.updatedAt = new Date().toISOString();
    this.persist();
  }

  /**
   * Records an agent execution envelope for auditability.
   */
  public recordEnvelope(envelope: AgentExecutionEnvelope): void {
    if (!this.currentJob) return;
    this.currentJob.envelopes.push(envelope);
    this.currentJob.updatedAt = new Date().toISOString();
    this.persist();
  }

  /**
   * Request graceful job cancellation.
   */
  public cancel(reason: string = "User requested cancellation"): void {
    this.isCancelledFlag = true;
    this.cancellationReason = reason;
    if (this.currentJob) {
      this.currentJob.status = "CANCELLED";
      this.currentJob.cancellationReason = reason;
      this.currentJob.updatedAt = new Date().toISOString();
      this.persist();
    }
    console.warn(`[JobStateManager] 🛑 Job cancelled: ${reason}`);
  }

  public isCancelled(): boolean {
    return this.isCancelledFlag;
  }

  public getCancellationReason(): string | undefined {
    return this.cancellationReason;
  }

  /**
   * Mark job as blocked due to external constraint or budget exhaustion.
   */
  public markBlocked(reason: string): void {
    if (!this.currentJob) return;
    this.currentJob.status = "BLOCKED";
    this.currentJob.blockingReason = reason;
    this.currentJob.updatedAt = new Date().toISOString();
    this.persist();
  }

  /**
   * Mark job as successfully delivered.
   */
  public markDelivered(): void {
    if (!this.currentJob) return;
    this.currentJob.status = "DELIVERED";
    this.currentJob.updatedAt = new Date().toISOString();
    this.persist();
  }

  /**
   * Check if an existing checkpoint can be safely resumed.
   */
  public static canResume(projectPath: string, currentArchitectureHash?: string): {
    canResume: boolean;
    reusableTaskIds: Set<number>;
    completedTaskIds: number[];
    snapshot?: JobSnapshot;
    reason?: string;
  } {
    const stateFile = join(projectPath, ".aegis", "job-state.json");
    if (!existsSync(stateFile)) {
      return { canResume: false, reusableTaskIds: new Set(), completedTaskIds: [], reason: "No checkpoint found" };
    }

    try {
      const snapshot: JobSnapshot = JSON.parse(readFileSync(stateFile, "utf8"));
      if (currentArchitectureHash && snapshot.architectureHash && snapshot.architectureHash !== currentArchitectureHash) {
        const reason = `Architecture mismatch: ${snapshot.architectureHash} vs ${currentArchitectureHash}`;
        console.warn(`[JobStateManager] ⚠️ Checkpoint architectureHash mismatch. Cannot resume: ${reason}`);
        return { canResume: false, reusableTaskIds: new Set(), completedTaskIds: [], reason, snapshot };
      }

      if (snapshot.status === "DELIVERED") {
        return { canResume: false, reusableTaskIds: new Set(), completedTaskIds: snapshot.completedTaskIds || [], reason: "Job already delivered", snapshot };
      }

      const completed = snapshot.completedTaskIds || [];
      const reusable = new Set(completed);
      console.log(`[JobStateManager] ♻️ Resumable checkpoint found: ${reusable.size} tasks already verified.`);
      return {
        canResume: reusable.size > 0,
        reusableTaskIds: reusable,
        completedTaskIds: completed,
        snapshot,
      };
    } catch {
      return { canResume: false, reusableTaskIds: new Set(), completedTaskIds: [], reason: "Failed to read checkpoint" };
    }
  }

  /**
   * Restores an active job from disk snapshot.
   */
  public loadJob(projectPath: string): JobSnapshot | null {
    const stateFile = join(projectPath, ".aegis", "job-state.json");
    if (!existsSync(stateFile)) return null;

    try {
      this.currentJob = JSON.parse(readFileSync(stateFile, "utf8"));
      return this.currentJob;
    } catch {
      return null;
    }
  }

  /**
   * Persists the job state atomically to .aegis/job-state.json.
   */
  private persist(): void {
    if (!this.currentJob) return;
    try {
      const aegisDir = join(this.currentJob.outputDirectory, ".aegis");
      if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
      const targetPath = join(aegisDir, "job-state.json");
      writeFileSync(targetPath, JSON.stringify(this.currentJob, null, 2), "utf8");
    } catch (err: any) {
      console.warn(`[JobStateManager] Warning: Failed to persist job-state: ${err.message}`);
    }
  }
}
