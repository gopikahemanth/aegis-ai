/**
 * TaskFileLockManager
 *
 * Enforces strict file write locks and partitioned file ownership during parallel execution.
 * Guarantees that two concurrent tasks can never write to the same file simultaneously.
 */

export interface FileLock {
  file: string;
  ownerTaskId: number;
  acquiredAt: string;
}

export class TaskFileLockManager {
  private static instance: TaskFileLockManager;
  private activeLocks: Map<string, FileLock> = new Map(); // normalizedPath -> FileLock
  private taskOwnedFiles: Map<number, Set<string>> = new Map(); // taskId -> set of owned files

  public static getInstance(): TaskFileLockManager {
    if (!TaskFileLockManager.instance) {
      TaskFileLockManager.instance = new TaskFileLockManager();
    }
    return TaskFileLockManager.instance;
  }

  public reset(): void {
    this.activeLocks.clear();
    this.taskOwnedFiles.clear();
  }

  /**
   * Register static ownership for a task from DAG planning.
   */
  public registerTaskOwnership(taskId: number, files: string[]): void {
    const set = this.taskOwnedFiles.get(taskId) || new Set();
    for (const f of files) {
      set.add(f.replace(/\\/g, "/"));
    }
    this.taskOwnedFiles.set(taskId, set);
  }

  /**
   * Check if all required files for a task can be locked without conflict.
   */
  public canAcquireLocks(taskId: number, files: string[]): { canLock: boolean; conflictingFiles: string[] } {
    const conflictingFiles: string[] = [];

    for (const rawFile of files) {
      const file = rawFile.replace(/\\/g, "/");
      const existing = this.activeLocks.get(file);
      if (existing && existing.ownerTaskId !== taskId) {
        conflictingFiles.push(file);
      }
    }

    return {
      canLock: conflictingFiles.length === 0,
      conflictingFiles,
    };
  }

  /**
   * Acquire exclusive write locks for task files.
   */
  public acquireLocks(taskId: number, files: string[]): boolean {
    const check = this.canAcquireLocks(taskId, files);
    if (!check.canLock) {
      console.warn(
        `[TaskFileLockManager] ⚠️ Task #${taskId} cannot acquire locks due to active lock on: [${check.conflictingFiles.join(", ")}]`
      );
      return false;
    }

    for (const rawFile of files) {
      const file = rawFile.replace(/\\/g, "/");
      this.activeLocks.set(file, {
        file,
        ownerTaskId: taskId,
        acquiredAt: new Date().toISOString(),
      });
    }

    return true;
  }

  /**
   * Release all locks held by a task upon completion or failure.
   */
  public releaseLocks(taskId: number): void {
    const toDelete: string[] = [];
    for (const [file, lock] of this.activeLocks.entries()) {
      if (lock.ownerTaskId === taskId) {
        toDelete.push(file);
      }
    }
    for (const file of toDelete) {
      this.activeLocks.delete(file);
    }
  }

  public getActiveLocks(): FileLock[] {
    return Array.from(this.activeLocks.values());
  }
}

export { TaskFileLockManager as FileLockManager };
