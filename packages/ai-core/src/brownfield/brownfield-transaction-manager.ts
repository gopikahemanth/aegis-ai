/**
 * BrownfieldTransactionManager — Aegis V2.3 Project 2 Phase 4.6
 *
 * Transactional checkpointing and explicit journaling:
 * - Pre-change snapshotting of all target files
 * - Atomic rollback on partial failure
 * - Audit journal tracking execution stages
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

export interface FileSnapshot {
  relativePath: string;
  existedBefore: boolean;
  contentBefore?: string;
  hashBefore?: string;
}

export interface TransactionJournalEntry {
  transactionId: string;
  checkpointId: string;
  createdAt: string;
  projectRoot: string;
  repoHeadBefore?: string;
  branchName?: string;
  affectedFiles: string[];
  appliedOperations: string[];
  verificationStatus: "PENDING" | "PASSED" | "FAILED";
  rollbackStatus: "IDLE" | "ROLLED_BACK" | "COMMITTED";
}

export interface TransactionCheckpoint {
  checkpointId: string;
  createdAt: string;
  projectRoot: string;
  snapshots: Map<string, FileSnapshot>;
  journal: TransactionJournalEntry;
}

export class BrownfieldTransactionManager {
  private checkpoints: Map<string, TransactionCheckpoint> = new Map();

  /**
   * Captures the exact pre-change state of target files before any modifications occur.
   */
  public createCheckpoint(
    projectRoot: string,
    targetFiles: string[],
    metadata?: { repoHeadBefore?: string; branchName?: string }
  ): string {
    const checkpointId = `chk_bf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const snapshots = new Map<string, FileSnapshot>();

    for (const relPath of targetFiles) {
      const cleanPath = relPath.replace(/\\/g, "/").replace(/^(\.\/|\/)+/, "");
      const fullPath = join(projectRoot, cleanPath);
      const existed = existsSync(fullPath);
      const content = existed ? readFileSync(fullPath, "utf8") : undefined;
      const hash = content !== undefined ? createHash("sha256").update(content).digest("hex") : undefined;

      snapshots.set(cleanPath, {
        relativePath: cleanPath,
        existedBefore: existed,
        contentBefore: content,
        hashBefore: hash,
      });
    }

    const journal: TransactionJournalEntry = {
      transactionId,
      checkpointId,
      createdAt: new Date().toISOString(),
      projectRoot,
      repoHeadBefore: metadata?.repoHeadBefore,
      branchName: metadata?.branchName,
      affectedFiles: targetFiles,
      appliedOperations: [],
      verificationStatus: "PENDING",
      rollbackStatus: "IDLE",
    };

    this.checkpoints.set(checkpointId, {
      checkpointId,
      createdAt: journal.createdAt,
      projectRoot,
      snapshots,
      journal,
    });

    console.log(`[BrownfieldTransactionManager] 💾 Created checkpoint ${checkpointId} covering ${snapshots.size} file(s).`);
    return checkpointId;
  }

  /**
   * Records an applied operation to the transaction journal.
   */
  public recordOperation(checkpointId: string, operationDescription: string): void {
    const cp = this.checkpoints.get(checkpointId);
    if (cp) {
      cp.journal.appliedOperations.push(operationDescription);
    }
  }

  /**
   * Updates the verification status of a checkpoint journal.
   */
  public recordVerificationStatus(checkpointId: string, status: "PASSED" | "FAILED"): void {
    const cp = this.checkpoints.get(checkpointId);
    if (cp) {
      cp.journal.verificationStatus = status;
    }
  }

  /**
   * Returns the transaction journal for a checkpoint.
   */
  public getJournal(checkpointId: string): TransactionJournalEntry | undefined {
    return this.checkpoints.get(checkpointId)?.journal;
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

    checkpoint.journal.rollbackStatus = "ROLLED_BACK";
    console.log(`[BrownfieldTransactionManager] ↺ Rollback complete: Restored ${restoredCount} modified file(s), Removed ${removedCount} new file(s).`);
    return true;
  }

  /**
   * Commits the checkpoint and releases snapshot memory.
   */
  public commit(checkpointId: string): void {
    const cp = this.checkpoints.get(checkpointId);
    if (cp) {
      cp.journal.rollbackStatus = "COMMITTED";
    }
    this.checkpoints.delete(checkpointId);
    console.log(`[BrownfieldTransactionManager] ✅ Committed and released checkpoint ${checkpointId}.`);
  }
}
