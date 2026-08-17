/**
 * ProjectGenerationLock
 *
 * Project-level exclusive lock preventing concurrent colliding generations
 * on the same project workspace.
 */

import { existsSync, writeFileSync, unlinkSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface GenerationLockInfo {
  generationId: string;
  projectId: string;
  lockedAt: string;
  pid: number;
  requestPrompt: string;
}

export class ProjectGenerationLock {
  private static memoryLocks: Map<string, GenerationLockInfo> = new Map();

  public static getLockFilePath(projectPath: string): string {
    return join(projectPath, ".aegis", "generation.lock");
  }

  /**
   * Attempt to acquire exclusive mutation lock for a generation.
   */
  public static acquireLock(
    projectPath: string,
    generationId: string,
    projectId: string,
    requestPrompt: string = ""
  ): { acquired: boolean; currentLock?: GenerationLockInfo; error?: string } {
    const lockFile = this.getLockFilePath(projectPath);

    // 1. Check in-memory lock
    const memLock = this.memoryLocks.get(projectPath);
    if (memLock && memLock.generationId !== generationId) {
      return {
        acquired: false,
        currentLock: memLock,
        error: `PROJECT_GENERATION_LOCKED: Project "${projectId}" is already locked by generation "${memLock.generationId}".`,
      };
    }

    // 2. Check disk lock file
    if (existsSync(lockFile)) {
      try {
        const diskLock: GenerationLockInfo = JSON.parse(readFileSync(lockFile, "utf8"));
        if (diskLock.generationId !== generationId) {
          return {
            acquired: false,
            currentLock: diskLock,
            error: `PROJECT_GENERATION_LOCKED: Project is locked by active generation "${diskLock.generationId}".`,
          };
        }
      } catch {
        // Corrupt lock file -> treat as unlocked
      }
    }

    const lockInfo: GenerationLockInfo = {
      generationId,
      projectId,
      lockedAt: new Date().toISOString(),
      pid: process.pid,
      requestPrompt,
    };

    const aegisDir = join(projectPath, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }

    try {
      writeFileSync(lockFile, JSON.stringify(lockInfo, null, 2), "utf8");
    } catch {}

    this.memoryLocks.set(projectPath, lockInfo);
    return { acquired: true, currentLock: lockInfo };
  }

  /**
   * Release the project generation lock.
   */
  public static releaseLock(projectPath: string, generationId: string): boolean {
    const memLock = this.memoryLocks.get(projectPath);
    if (memLock && memLock.generationId === generationId) {
      this.memoryLocks.delete(projectPath);
    }

    const lockFile = this.getLockFilePath(projectPath);
    if (existsSync(lockFile)) {
      try {
        const diskLock: GenerationLockInfo = JSON.parse(readFileSync(lockFile, "utf8"));
        if (diskLock.generationId === generationId) {
          unlinkSync(lockFile);
        }
      } catch {
        try {
          unlinkSync(lockFile);
        } catch {}
      }
    }
    return true;
  }

  public static isLocked(projectPath: string): boolean {
    if (this.memoryLocks.has(projectPath)) return true;
    return existsSync(this.getLockFilePath(projectPath));
  }

  public static reset(): void {
    this.memoryLocks.clear();
  }
}
