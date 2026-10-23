/**
 * Aegis AI — Phase 5 Undo Manager
 *
 * Implements atomic checkpointing, rollback, and undo capabilities:
 * - Persists pre-change file snapshots in `.aegis/checkpoints/<checkpointId>.json`
 * - Maintains chronological `.aegis/edit-history.json`
 * - Restores prior states safely without discarding unrelated user work
 * - Deletes newly created files on undo
 * - Restores deleted or modified files exactly as they were
 * - Restores FeatureMatrix and Theme specifications
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { EditCheckpointData, EditOperationType, FileSnapshotData } from "./edit-types.js";

export interface UndoResult {
  success: boolean;
  checkpointId?: string;
  userRequest?: string;
  restoredFiles: string[];
  removedCreatedFiles: string[];
  error?: string;
}

export class UndoManager {
  private static getCheckpointsDir(projectRoot: string): string {
    const dir = join(projectRoot, ".aegis", "checkpoints");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  private static getHistoryFilePath(projectRoot: string): string {
    const aegisDir = join(projectRoot, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    return join(aegisDir, "edit-history.json");
  }

  /**
   * Captures a pre-change checkpoint for candidate files before an edit is applied.
   */
  public static createCheckpoint(
    projectRoot: string,
    userRequest: string,
    operationType: EditOperationType,
    candidateFiles: string[]
  ): EditCheckpointData {
    const cleanRoot = projectRoot.replace(/\\/g, "/");
    const checkpointId = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const snapshots: Record<string, FileSnapshotData> = {};

    // Snapshot candidate files
    for (const rel of candidateFiles) {
      const full = join(cleanRoot, rel);
      if (existsSync(full)) {
        try {
          const content = readFileSync(full, "utf8");
          snapshots[rel] = {
            relativePath: rel,
            existedBefore: true,
            contentBefore: content,
          };
        } catch {
          snapshots[rel] = { relativePath: rel, existedBefore: true };
        }
      } else {
        snapshots[rel] = {
          relativePath: rel,
          existedBefore: false,
        };
      }
    }

    // Snapshot FeatureMatrix & Theme if they exist
    let featureMatrixSnapshot: string | undefined;
    const matrixPath = join(cleanRoot, ".aegis", "feature-matrix.json");
    if (existsSync(matrixPath)) {
      try {
        featureMatrixSnapshot = readFileSync(matrixPath, "utf8");
      } catch {}
    }

    let themeSnapshot: string | undefined;
    const themePath = join(cleanRoot, ".aegis", "theme.json");
    if (existsSync(themePath)) {
      try {
        themeSnapshot = readFileSync(themePath, "utf8");
      } catch {}
    }

    const checkpoint: EditCheckpointData = {
      checkpointId,
      createdAt: new Date().toISOString(),
      userRequest,
      operationType,
      projectRoot: cleanRoot,
      touchedFiles: [],
      createdFiles: [],
      modifiedFiles: [],
      deletedFiles: [],
      snapshots,
      featureMatrixSnapshot,
      themeSnapshot,
      status: "APPLIED",
    };

    // Save checkpoint file
    const checkpointsDir = this.getCheckpointsDir(cleanRoot);
    writeFileSync(join(checkpointsDir, `${checkpointId}.json`), JSON.stringify(checkpoint, null, 2), "utf8");

    // Record in history
    this.recordInHistory(cleanRoot, checkpoint);

    return checkpoint;
  }

  /**
   * Finalizes checkpoint with the actual outcome of the edit operation.
   */
  public static finalizeCheckpoint(
    projectRoot: string,
    checkpointId: string,
    updates: {
      touchedFiles: string[];
      createdFiles: string[];
      modifiedFiles: string[];
      deletedFiles: string[];
      status: "APPLIED" | "ROLLED_BACK" | "FAILED";
    }
  ): void {
    const cleanRoot = projectRoot.replace(/\\/g, "/");
    const checkpointsDir = this.getCheckpointsDir(cleanRoot);
    const file = join(checkpointsDir, `${checkpointId}.json`);

    let checkpoint: EditCheckpointData;
    if (existsSync(file)) {
      checkpoint = JSON.parse(readFileSync(file, "utf8"));
    } else {
      return;
    }

    // Update snapshots for any newly touched files not captured initially
    for (const rel of updates.touchedFiles) {
      if (!checkpoint.snapshots[rel]) {
        checkpoint.snapshots[rel] = {
          relativePath: rel,
          existedBefore: false,
        };
      }
    }

    checkpoint.touchedFiles = updates.touchedFiles;
    checkpoint.createdFiles = updates.createdFiles;
    checkpoint.modifiedFiles = updates.modifiedFiles;
    checkpoint.deletedFiles = updates.deletedFiles;
    checkpoint.status = updates.status;

    writeFileSync(file, JSON.stringify(checkpoint, null, 2), "utf8");
    this.updateHistoryItem(cleanRoot, checkpoint);
  }

  /**
   * Reverts the most recent applied edit, restoring previous file states.
   */
  public static undo(projectRoot: string): UndoResult {
    const cleanRoot = projectRoot.replace(/\\/g, "/");
    const history = this.getHistory(cleanRoot);

    // Find the latest APPLIED checkpoint
    const targetItem = [...history].reverse().find((h) => h.status === "APPLIED");
    if (!targetItem) {
      return {
        success: false,
        restoredFiles: [],
        removedCreatedFiles: [],
        error: "No eligible Aegis edit found to undo.",
      };
    }

    const checkpointsDir = this.getCheckpointsDir(cleanRoot);
    const checkpointPath = join(checkpointsDir, `${targetItem.checkpointId}.json`);
    if (!existsSync(checkpointPath)) {
      return {
        success: false,
        restoredFiles: [],
        removedCreatedFiles: [],
        error: `Checkpoint file not found: ${targetItem.checkpointId}`,
      };
    }

    const checkpoint: EditCheckpointData = JSON.parse(readFileSync(checkpointPath, "utf8"));
    const restoredFiles: string[] = [];
    const removedCreatedFiles: string[] = [];

    // 1. Remove files that were created by this edit (or candidate files created after checkpoint)
    const filesToRemove = new Set<string>(checkpoint.createdFiles);
    for (const [rel, snap] of Object.entries(checkpoint.snapshots)) {
      if (!snap.existedBefore) {
        filesToRemove.add(rel);
      }
    }
    for (const rel of filesToRemove) {
      const full = join(cleanRoot, rel);
      if (existsSync(full)) {
        try {
          unlinkSync(full);
          removedCreatedFiles.push(rel);
        } catch (e: any) {
          console.warn(`[UndoManager] Failed to remove created file ${rel}: ${e.message}`);
        }
      }
    }

    // 2. Restore modified files to their previous content
    for (const rel of checkpoint.modifiedFiles) {
      const snap = checkpoint.snapshots[rel];
      if (snap && snap.existedBefore && snap.contentBefore !== undefined) {
        const full = join(cleanRoot, rel);
        try {
          writeFileSync(full, snap.contentBefore, "utf8");
          restoredFiles.push(rel);
        } catch (e: any) {
          console.warn(`[UndoManager] Failed to restore file ${rel}: ${e.message}`);
        }
      }
    }

    // 3. Recreate deleted files
    for (const rel of checkpoint.deletedFiles) {
      const snap = checkpoint.snapshots[rel];
      if (snap && snap.existedBefore && snap.contentBefore !== undefined) {
        const full = join(cleanRoot, rel);
        try {
          writeFileSync(full, snap.contentBefore, "utf8");
          restoredFiles.push(rel);
        } catch (e: any) {
          console.warn(`[UndoManager] Failed to recreate deleted file ${rel}: ${e.message}`);
        }
      }
    }

    // 4. Restore FeatureMatrix
    const matrixPath = join(cleanRoot, ".aegis", "feature-matrix.json");
    if (checkpoint.featureMatrixSnapshot !== undefined) {
      writeFileSync(matrixPath, checkpoint.featureMatrixSnapshot, "utf8");
      restoredFiles.push(".aegis/feature-matrix.json");
    } else if (existsSync(matrixPath) && checkpoint.createdFiles.includes(".aegis/feature-matrix.json")) {
      try {
        unlinkSync(matrixPath);
      } catch {}
    }

    // 5. Restore Theme
    const themePath = join(cleanRoot, ".aegis", "theme.json");
    if (checkpoint.themeSnapshot !== undefined) {
      writeFileSync(themePath, checkpoint.themeSnapshot, "utf8");
      restoredFiles.push(".aegis/theme.json");
    }

    // 6. Mark checkpoint as ROLLED_BACK
    checkpoint.status = "ROLLED_BACK";
    writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2), "utf8");
    this.updateHistoryItem(cleanRoot, checkpoint);

    return {
      success: true,
      checkpointId: checkpoint.checkpointId,
      userRequest: checkpoint.userRequest,
      restoredFiles,
      removedCreatedFiles,
    };
  }

  public static getHistory(projectRoot: string): EditCheckpointData[] {
    const historyPath = this.getHistoryFilePath(projectRoot);
    if (!existsSync(historyPath)) return [];
    try {
      return JSON.parse(readFileSync(historyPath, "utf8"));
    } catch {
      return [];
    }
  }

  private static recordInHistory(projectRoot: string, checkpoint: EditCheckpointData): void {
    const history = this.getHistory(projectRoot);
    history.push(checkpoint);
    const historyPath = this.getHistoryFilePath(projectRoot);
    writeFileSync(historyPath, JSON.stringify(history, null, 2), "utf8");
  }

  private static updateHistoryItem(projectRoot: string, checkpoint: EditCheckpointData): void {
    const history = this.getHistory(projectRoot);
    const index = history.findIndex((h) => h.checkpointId === checkpoint.checkpointId);
    if (index >= 0) {
      history[index] = checkpoint;
    } else {
      history.push(checkpoint);
    }
    const historyPath = this.getHistoryFilePath(projectRoot);
    writeFileSync(historyPath, JSON.stringify(history, null, 2), "utf8");
  }
}
