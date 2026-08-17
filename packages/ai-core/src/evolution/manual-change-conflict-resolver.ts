/**
 * ManualChangeConflictResolver
 *
 * Detects manual user edits against recorded baseline file hashes.
 * Distinguishes VALID_MANUAL_CHANGE from USER_CHANGE_CONFLICT to prevent silent clobbering.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ManualChangeStatus = "CLEAN" | "VALID_MANUAL_CHANGE" | "USER_CHANGE_CONFLICT";

export interface FileConflictReport {
  file: string;
  status: ManualChangeStatus;
  baselineHash?: string;
  diskHash?: string;
  proposedHash?: string;
  resolutionStrategy: "PRESERVE_DISK" | "MERGE_REQUIRED" | "PROCEED_SAFE";
  message: string;
}

export class ManualChangeConflictResolver {
  /**
   * Compute sha256 hash of a file on disk.
   */
  public static getFileHash(projectPath: string, relativePath: string): string | null {
    const fullPath = join(projectPath, relativePath);
    if (!existsSync(fullPath)) return null;
    try {
      const content = readFileSync(fullPath, "utf8");
      return createHash("sha256").update(content).digest("hex").slice(0, 16);
    } catch {
      return null;
    }
  }

  /**
   * Evaluate a proposed file write against recorded baseline and current disk state.
   */
  public static evaluateFileChange(
    projectPath: string,
    relativePath: string,
    baselineHash: string | undefined,
    proposedContent: string
  ): FileConflictReport {
    const currentDiskHash = this.getFileHash(projectPath, relativePath);
    const proposedHash = createHash("sha256").update(proposedContent).digest("hex").slice(0, 16);

    // 1. File doesn't exist on disk yet
    if (!currentDiskHash) {
      return {
        file: relativePath,
        status: "CLEAN",
        proposedHash,
        resolutionStrategy: "PROCEED_SAFE",
        message: `New file "${relativePath}" to be created.`,
      };
    }

    // 2. No baseline recorded -> assume clean
    if (!baselineHash) {
      return {
        file: relativePath,
        status: "CLEAN",
        diskHash: currentDiskHash,
        proposedHash,
        resolutionStrategy: "PROCEED_SAFE",
        message: `No baseline hash recorded for "${relativePath}".`,
      };
    }

    // 3. Disk equals baseline -> clean
    if (currentDiskHash === baselineHash) {
      return {
        file: relativePath,
        status: "CLEAN",
        baselineHash,
        diskHash: currentDiskHash,
        proposedHash,
        resolutionStrategy: "PROCEED_SAFE",
        message: `File "${relativePath}" matches baseline hash. Safe to modify.`,
      };
    }

    // 4. Disk differs from baseline -> user manually modified the file
    // Check if proposed write matches current disk anyway
    if (currentDiskHash === proposedHash) {
      return {
        file: relativePath,
        status: "VALID_MANUAL_CHANGE",
        baselineHash,
        diskHash: currentDiskHash,
        proposedHash,
        resolutionStrategy: "PRESERVE_DISK",
        message: `Manual user edit on "${relativePath}" already satisfies proposed change.`,
      };
    }

    // 5. Conflict: User edited file from A to B, AEGIS wants to write C
    return {
      file: relativePath,
      status: "USER_CHANGE_CONFLICT",
      baselineHash,
      diskHash: currentDiskHash,
      proposedHash,
      resolutionStrategy: "MERGE_REQUIRED",
      message: `USER_CHANGE_CONFLICT: Manual modifications detected on "${relativePath}" (baseline: ${baselineHash}, disk: ${currentDiskHash}). AEGIS will not silently overwrite user edits.`,
    };
  }
}
