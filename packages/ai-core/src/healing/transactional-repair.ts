/**
 * TransactionalRepairSystem (Phase 3 Upgrade)
 *
 * Provides atomic, multi-file checkpoints and rollback guarantees for all repairs.
 * Tracks repair attempt history, detects repeated identical failures (REPEATED_REPAIR_FAILURE),
 * and prevents unbounded repair loops.
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";

export interface RepairMetadata {
  repairId: string;
  generationId?: string;
  taskId?: number | string;
  failureId?: string;
  checkpointId: string;
  attemptNumber: number;
  failureType?: string;
  rootCause?: string;
  strategy?: string;
  affectedFiles: string[];
}

export interface RepairCheckpoint {
  checkpointId: string;
  repairId: string;
  timestamp: string;
  metadata: RepairMetadata;
  backupFiles: Record<string, string>; // original file path -> backup content (or "__NEW_FILE__")
}

export interface RepairAttemptRecord {
  repairId: string;
  checkpointId: string;
  timestamp: string;
  failureType: string;
  rootCause: string;
  affectedFiles: string[];
  patchHash: string;
  result: "COMMITTED" | "ROLLED_BACK" | "REJECTED";
  reason?: string;
}

export class TransactionalRepairSystem {
  private static checkpoints: Map<string, RepairCheckpoint> = new Map();
  private static history: RepairAttemptRecord[] = [];
  private static readonly MAX_REPEATED_ATTEMPTS = 2;

  /**
   * Create an atomic multi-file checkpoint before applying a repair.
   * Returns the unique checkpointId string.
   */
  public static createCheckpoint(
    projectPath: string,
    filesToModify: string[],
    metadata?: Partial<RepairMetadata>
  ): string {
    const checkpointId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const repairId = metadata?.repairId || `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const backupFiles: Record<string, string> = {};

    for (const rawRelPath of filesToModify) {
      const relPath = rawRelPath.replace(/\\/g, "/");
      const fullPath = join(projectPath, relPath);

      if (existsSync(fullPath)) {
        try {
          backupFiles[relPath] = readFileSync(fullPath, "utf8");
        } catch {
          backupFiles[relPath] = "";
        }
      } else {
        backupFiles[relPath] = "__NEW_FILE__";
      }
    }

    const fullMetadata: RepairMetadata = {
      repairId,
      checkpointId,
      attemptNumber: metadata?.attemptNumber || 1,
      generationId: metadata?.generationId,
      taskId: metadata?.taskId,
      failureId: metadata?.failureId,
      failureType: metadata?.failureType || "BUILD_ERROR",
      rootCause: metadata?.rootCause || "Generic compilation error",
      strategy: metadata?.strategy || "Targeted patch",
      affectedFiles: Object.keys(backupFiles),
    };

    const checkpoint: RepairCheckpoint = {
      checkpointId,
      repairId,
      timestamp: new Date().toISOString(),
      metadata: fullMetadata,
      backupFiles,
    };

    this.checkpoints.set(checkpointId, checkpoint);
    console.log(
      `[TransactionalRepair] 💾 Created Checkpoint [${checkpointId}] for Repair [${repairId}] ` +
      `(Attempt: ${fullMetadata.attemptNumber}, Files: ${Object.keys(backupFiles).length})`
    );

    return checkpointId;
  }

  public static getCheckpoint(checkpointId: string): RepairCheckpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  /**
   * Check if this repair is a repeated failure on the exact same root cause & files.
   */
  public static checkRepeatedRepair(
    rootCause: string,
    affectedFiles: string[],
    patchText?: string
  ): { isRepeated: boolean; attemptCount: number; reason?: string } {
    const normFiles = [...affectedFiles].map(f => f.replace(/\\/g, "/")).sort().join(",");
    const patchHash = patchText ? createHash("sha256").update(patchText).digest("hex").slice(0, 10) : "";

    let matchCount = 0;
    for (const record of this.history) {
      const recordFiles = [...record.affectedFiles].map(f => f.replace(/\\/g, "/")).sort().join(",");
      if (record.rootCause === rootCause && recordFiles === normFiles) {
        matchCount++;
      }
    }

    if (matchCount >= this.MAX_REPEATED_ATTEMPTS) {
      return {
        isRepeated: true,
        attemptCount: matchCount,
        reason: `REPEATED_REPAIR_FAILURE: Attempted repair for root cause "${rootCause}" on [${normFiles}] ${matchCount} times without success. Escalating to alternative strategy.`,
      };
    }

    return { isRepeated: false, attemptCount: matchCount };
  }

  /**
   * Commit a checkpoint when the repair passes verification.
   */
  public static commit(checkpointOrId: string | { checkpointId: string }): void {
    const checkpointId = typeof checkpointOrId === "string" ? checkpointOrId : checkpointOrId?.checkpointId;
    const cp = this.checkpoints.get(checkpointId);
    if (cp) {
      this.history.push({
        repairId: cp.repairId,
        checkpointId: cp.checkpointId,
        timestamp: new Date().toISOString(),
        failureType: cp.metadata.failureType || "UNKNOWN",
        rootCause: cp.metadata.rootCause || "UNKNOWN",
        affectedFiles: cp.metadata.affectedFiles,
        patchHash: "COMMITTED",
        result: "COMMITTED",
      });
      this.checkpoints.delete(checkpointId);
      console.log(`[TransactionalRepair] ✅ Committed repair checkpoint ${checkpointId} (Repair: ${cp.repairId})`);
    }
  }

  /**
   * Atomically rollback all files in the checkpoint if repair verification fails.
   */
  public static rollback(projectPath: string, checkpointOrId: string | { checkpointId: string }, reason: string): boolean {
    const checkpointId = typeof checkpointOrId === "string" ? checkpointOrId : checkpointOrId?.checkpointId;
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      console.warn(`[TransactionalRepair] Warning: Checkpoint ${checkpointId} not found for rollback`);
      return false;
    }


    console.warn(`[TransactionalRepair] 🔄 Rolling back checkpoint ${checkpointId} due to: ${reason}`);

    let restoredCount = 0;
    let deletedCount = 0;

    for (const [relPath, content] of Object.entries(checkpoint.backupFiles)) {
      const fullPath = join(projectPath, relPath);
      if (content === "__NEW_FILE__") {
        if (existsSync(fullPath)) {
          try {
            unlinkSync(fullPath);
            deletedCount++;
          } catch {}
        }
      } else {
        try {
          const parent = dirname(fullPath);
          if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
          writeFileSync(fullPath, content, "utf8");
          restoredCount++;
        } catch (e: any) {
          console.error(`[TransactionalRepair] Error restoring file ${relPath}: ${e.message}`);
        }
      }
    }

    this.history.push({
      repairId: checkpoint.repairId,
      checkpointId: checkpoint.checkpointId,
      timestamp: new Date().toISOString(),
      failureType: checkpoint.metadata.failureType || "UNKNOWN",
      rootCause: checkpoint.metadata.rootCause || "UNKNOWN",
      affectedFiles: checkpoint.metadata.affectedFiles,
      patchHash: "ROLLED_BACK",
      result: "ROLLED_BACK",
      reason,
    });

    this.checkpoints.delete(checkpointId);
    console.log(`[TransactionalRepair] ↺ Rollback complete for ${checkpointId}: Restored ${restoredCount} file(s), Removed ${deletedCount} new file(s).`);
    return true;
  }

  /**
   * Get history of repair attempts.
   */
  public static getHistory(): readonly RepairAttemptRecord[] {
    return this.history;
  }

  /**
   * Reset all checkpoints and history (for test isolation).
   */
  public static reset(): void {
    this.checkpoints.clear();
    this.history = [];
  }
}
