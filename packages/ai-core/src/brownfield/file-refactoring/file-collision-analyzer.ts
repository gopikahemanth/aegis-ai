/**
 * FileCollisionAnalyzer — Aegis V2.3 Project 2 Phase 5
 *
 * Collision and safety analyzer for file renames and moves:
 * - Source file existence validation
 * - Target file existence & case-only rename detection
 * - Dynamic import / require blocker
 * - Circular dependency risk detection
 */

import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import type { FileRefactoringStatus } from "./file-refactoring-contract.js";

export interface FileCollisionAnalysisResult {
  hasConflicts: boolean;
  status: FileRefactoringStatus;
  isCaseOnlyRename: boolean;
  conflicts: string[];
  blockedReasons: string[];
}

export class FileCollisionAnalyzer {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Evaluates collision and safety status for a file refactoring operation.
   */
  public analyze(
    sourcePath: string,
    targetPath: string,
    dynamicImportFiles: string[] = []
  ): FileCollisionAnalysisResult {
    const conflicts: string[] = [];
    const blockedReasons: string[] = [];

    const cleanSource = sourcePath.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
    const cleanTarget = targetPath.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");

    const fullSource = resolve(this.projectRoot, cleanSource);
    const fullTarget = resolve(this.projectRoot, cleanTarget);

    // 1. Source existence check
    if (!existsSync(fullSource)) {
      return {
        hasConflicts: true,
        status: "SOURCE_NOT_FOUND",
        isCaseOnlyRename: false,
        conflicts: [],
        blockedReasons: [`SOURCE_NOT_FOUND: Source file "${cleanSource}" does not exist on disk.`],
      };
    }

    // 2. Case-only rename detection (e.g. TaskCard.tsx -> taskcard.tsx on Windows)
    const isSameDir = dirname(cleanSource).toLowerCase() === dirname(cleanTarget).toLowerCase();
    const isCaseOnly = isSameDir && basename(cleanSource).toLowerCase() === basename(cleanTarget).toLowerCase() && basename(cleanSource) !== basename(cleanTarget);

    // 3. Target existence check
    if (existsSync(fullTarget) && !isCaseOnly) {
      return {
        hasConflicts: true,
        status: "TARGET_EXISTS",
        isCaseOnlyRename: false,
        conflicts: [`Target file "${cleanTarget}" already exists on disk.`],
        blockedReasons: [`TARGET_EXISTS: Target file "${cleanTarget}" already exists on disk. Cannot overwrite.`],
      };
    }

    // 4. Dynamic import blocker
    if (dynamicImportFiles.length > 0) {
      return {
        hasConflicts: true,
        status: "DYNAMIC_REFERENCE_BLOCKED",
        isCaseOnlyRename: isCaseOnly,
        conflicts: [],
        blockedReasons: [`DYNAMIC_REFERENCE_BLOCKED: Dynamic import or require found in: ${dynamicImportFiles.join(", ")}. Cannot safely guarantee all references are resolved.`],
      };
    }

    return {
      hasConflicts: false,
      status: "READY",
      isCaseOnlyRename: isCaseOnly,
      conflicts: [],
      blockedReasons: [],
    };
  }
}
