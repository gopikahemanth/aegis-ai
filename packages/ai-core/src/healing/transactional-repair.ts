import { existsSync, readFileSync, writeFileSync, copyFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";

export interface RepairCheckpoint {
  checkpointId: string;
  timestamp: string;
  backupFiles: Record<string, string>; // original file path -> backup content
}

export class TransactionalRepairSystem {
  private static checkpoints: Map<string, RepairCheckpoint> = new Map();

  public static createCheckpoint(projectPath: string, filesToModify: string[]): string {
    const checkpointId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const backupFiles: Record<string, string> = {};

    for (const relPath of filesToModify) {
      const fullPath = join(projectPath, relPath);
      if (existsSync(fullPath)) {
        try {
          backupFiles[relPath] = readFileSync(fullPath, "utf8");
        } catch {}
      } else {
        backupFiles[relPath] = "__NEW_FILE__";
      }
    }

    const checkpoint: RepairCheckpoint = {
      checkpointId,
      timestamp: new Date().toISOString(),
      backupFiles
    };

    this.checkpoints.set(checkpointId, checkpoint);
    console.log(`[TransactionalRepair] 💾 Created checkpoint ${checkpointId} (${Object.keys(backupFiles).length} files)`);
    return checkpointId;
  }

  public static commit(checkpointId: string): void {
    if (this.checkpoints.has(checkpointId)) {
      this.checkpoints.delete(checkpointId);
      console.log(`[TransactionalRepair] ✅ Committed repair checkpoint ${checkpointId}`);
    }
  }

  public static rollback(projectPath: string, checkpointId: string, reason: string): void {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      console.warn(`[TransactionalRepair] Warning: Checkpoint ${checkpointId} not found for rollback`);
      return;
    }

    console.warn(`[TransactionalRepair] 🔄 Rolling back checkpoint ${checkpointId} due to: ${reason}`);

    for (const [relPath, content] of Object.entries(checkpoint.backupFiles)) {
      const fullPath = join(projectPath, relPath);
      if (content === "__NEW_FILE__") {
        if (existsSync(fullPath)) {
          try { unlinkSync(fullPath); } catch {}
        }
      } else {
        try {
          writeFileSync(fullPath, content, "utf8");
        } catch {}
      }
    }

    this.checkpoints.delete(checkpointId);
    console.log(`[TransactionalRepair] ↺ Rollback complete for ${checkpointId}`);
  }
}
