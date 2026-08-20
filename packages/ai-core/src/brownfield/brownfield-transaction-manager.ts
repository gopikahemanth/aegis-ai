import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

export interface FileSnapshot {
  relativePath: string;
  existedBefore: boolean;
  contentBefore?: string;
}

export interface TransactionCheckpoint {
  checkpointId: string;
  createdAt: string;
  projectRoot: string;
  snapshots: Map<string, FileSnapshot>;
}

export class BrownfieldTransactionManager {
  private checkpoints: Map<string, TransactionCheckpoint> = new Map();

  /**
   * Captures the exact pre-change state of target files before any modifications occur.
   */
  public createCheckpoint(projectRoot: string, targetFiles: string[]): string {
    const checkpointId = `chk_bf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const snapshots = new Map<string, FileSnapshot>();

    for (const relPath of targetFiles) {
      const cleanPath = relPath.replace(/\\/g, "/").replace(/^(\.\/|\/)+/, "");
      const fullPath = join(projectRoot, cleanPath);
      const existed = existsSync(fullPath);

      snapshots.set(cleanPath, {
        relativePath: cleanPath,
        existedBefore: existed,
        contentBefore: existed ? readFileSync(fullPath, "utf8") : undefined,
      });
    }

    this.checkpoints.set(checkpointId, {
      checkpointId,
      createdAt: new Date().toISOString(),
      projectRoot,
      snapshots,
    });

    console.log(`[BrownfieldTransactionManager] 💾 Created checkpoint ${checkpointId} covering ${snapshots.size} file(s).`);
    return checkpointId;
  }

  /**
   * Restores all touched files to their exact pre-change contents and removes any newly created files.
   */
  public rollback(checkpointId: string): boolean {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      console.warn(`[BrownfieldTransactionManager] Warning: Checkpoint ${checkpointId} not found for rollback.`);
      return false;
    }

    console.log(`[BrownfieldTransactionManager] ↺ Rolling back checkpoint ${checkpointId}...`);
    let restoredCount = 0;
    let removedCount = 0;

    for (const [relPath, snapshot] of checkpoint.snapshots.entries()) {
      const fullPath = join(checkpoint.projectRoot, relPath);

      if (snapshot.existedBefore && snapshot.contentBefore !== undefined) {
        writeFileSync(fullPath, snapshot.contentBefore, "utf8");
        restoredCount++;
      } else if (!snapshot.existedBefore && existsSync(fullPath)) {
        try {
          unlinkSync(fullPath);
          removedCount++;
        } catch {}
      }
    }

    console.log(`[BrownfieldTransactionManager] ↺ Rollback complete: Restored ${restoredCount} modified file(s), Removed ${removedCount} new file(s).`);
    return true;
  }

  /**
   * Commits the checkpoint and releases snapshot memory.
   */
  public commit(checkpointId: string): void {
    this.checkpoints.delete(checkpointId);
    console.log(`[BrownfieldTransactionManager] ✅ Committed and released checkpoint ${checkpointId}.`);
  }
}
