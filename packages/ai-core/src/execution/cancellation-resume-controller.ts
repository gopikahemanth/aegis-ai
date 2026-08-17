/**
 * CancellationResumeController
 *
 * Manages graceful cancellation tokens and state checkpoint persistence
 * allowing safe resumption of paused/failed project generations.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Task } from "../planner/task.js";

export interface ExecutionStateCheckpoint {
  version: 1;
  generationId: string;
  projectId: string;
  architectureHash: string;
  completedTaskIds: number[];
  failedTaskIds: number[];
  taskStates: Record<number, string>;
  savedAt: string;
}

export class CancellationResumeController {
  private cancelled: boolean = false;
  private reason?: string;

  public cancel(reason: string = "User cancellation"): void {
    this.cancelled = true;
    this.reason = reason;
    console.warn(`[CancellationResume] 🛑 Execution cancelled: ${reason}`);
  }

  public isCancelled(): boolean {
    return this.cancelled;
  }

  public getCancellationReason(): string | undefined {
    return this.reason;
  }

  /**
   * Save current execution checkpoint to disk.
   */
  public static saveCheckpoint(
    projectPath: string,
    generationId: string,
    architectureHash: string,
    tasks: Task[]
  ): void {
    const aegisDir = join(projectPath, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    const completedTaskIds = tasks.filter(t => t.completed || t.status === "PASSED" || t.status === "completed").map(t => t.id);
    const failedTaskIds = tasks.filter(t => t.status === "FAILED" || t.status === "failed").map(t => t.id);
    const taskStates: Record<number, string> = {};

    for (const t of tasks) {
      taskStates[t.id] = (t.status as string) || (t.completed ? "PASSED" : "PENDING");
    }

    const state: ExecutionStateCheckpoint = {
      version: 1,
      generationId,
      projectId: "project",
      architectureHash,
      completedTaskIds,
      failedTaskIds,
      taskStates,
      savedAt: new Date().toISOString(),
    };

    writeFileSync(join(aegisDir, "execution-state.json"), JSON.stringify(state, null, 2), "utf8");
    console.log(`[CancellationResume] 💾 Persisted execution state: ${completedTaskIds.length} passed, ${failedTaskIds.length} failed.`);
  }

  /**
   * Load checkpoint and determine which tasks can be reused on resume.
   */
  public static loadCheckpoint(
    projectPath: string,
    currentArchitectureHash: string
  ): { canResume: boolean; reusableTaskIds: Set<number>; checkpoint?: ExecutionStateCheckpoint } {
    const stateFile = join(projectPath, ".aegis", "execution-state.json");
    if (!existsSync(stateFile)) {
      return { canResume: false, reusableTaskIds: new Set() };
    }

    try {
      const state: ExecutionStateCheckpoint = JSON.parse(readFileSync(stateFile, "utf8"));
      if (state.architectureHash !== currentArchitectureHash) {
        console.warn(`[CancellationResume] ⚠️ Cannot resume from checkpoint: architectureHash mismatch (${state.architectureHash} vs ${currentArchitectureHash})`);
        return { canResume: false, reusableTaskIds: new Set() };
      }

      console.log(`[CancellationResume] ♻️ Resuming generation from checkpoint: ${state.completedTaskIds.length} previous tasks verified.`);
      return {
        canResume: true,
        reusableTaskIds: new Set(state.completedTaskIds),
        checkpoint: state,
      };
    } catch {
      return { canResume: false, reusableTaskIds: new Set() };
    }
  }
}
