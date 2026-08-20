import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { BrownfieldProjectContract, PlannedPatch } from "./brownfield-contract.js";

export interface PatchPlanningResult {
  success: boolean;
  plannedPatches: PlannedPatch[];
  collisionDetected?: boolean;
  routerUnparseable?: boolean;
  error?: string;
}

export class SurgicalPatchPlanner {
  /**
   * Scans target file for existing symbol declarations to prevent collisions.
   */
  public static checkSymbolCollision(projectRoot: string, filePath: string, newSymbols: string[]): boolean {
    const fullPath = join(projectRoot, filePath);
    if (!existsSync(fullPath)) return false;

    try {
      const content = readFileSync(fullPath, "utf8");
      for (const symbol of newSymbols) {
        const regex = new RegExp(`\\b(const|let|var|function|class|type|interface)\\s+${symbol}\\b`, "g");
        if (regex.test(content)) {
          return true;
        }
      }
    } catch {}

    return false;
  }

  /**
   * Creates a surgical search-and-replace patch block format string.
   */
  public static formatSearchReplaceBlock(filePath: string, search: string, replace: string): string {
    const cleanPath = filePath.replace(/\\/g, "/").replace(/^(\.\/|\/)+/, "");
    return `===PATCH: ${cleanPath}===\n<<<<<<< SEARCH\n${search}\n=======\n${replace}\n>>>>>>> REPLACE\n`;
  }

  /**
   * Plans surgical patches for an additive feature.
   */
  public static planPatches(
    contract: BrownfieldProjectContract,
    newFiles: { path: string; content: string; symbols?: string[] }[],
    surgicalEdits: { path: string; search: string; replace: string; reason: string; symbols?: string[] }[]
  ): PatchPlanningResult {
    const projectRoot = contract.repository.rootPath;
    const plannedPatches: PlannedPatch[] = [];

    // 1. Validate new files (must not exist as user files)
    for (const nf of newFiles) {
      const cleanPath = nf.path.replace(/\\/g, "/").replace(/^(\.\/|\/)+/, "");
      if (existsSync(join(projectRoot, cleanPath))) {
        return {
          success: false,
          plannedPatches: [],
          error: `WRITE_BLOCKED: Planned new file "${cleanPath}" already exists on disk. Use SURGICAL_PATCH instead of full-file CREATE.`,
        };
      }

      plannedPatches.push({
        filePath: cleanPath,
        operation: "CREATE",
        newContent: nf.content,
        reason: "Isolated new feature module",
        targetSymbols: nf.symbols,
      });
    }

    // 2. Validate surgical edits
    for (const edit of surgicalEdits) {
      const cleanPath = edit.path.replace(/\\/g, "/").replace(/^(\.\/|\/)+/, "");
      const fullPath = join(projectRoot, cleanPath);

      if (!existsSync(fullPath)) {
        return {
          success: false,
          plannedPatches: [],
          error: `PATCH_TARGET_MISSING: Cannot apply surgical patch to non-existent file "${cleanPath}".`,
        };
      }

      // Check for symbol collision
      if (edit.symbols && this.checkSymbolCollision(projectRoot, cleanPath, edit.symbols)) {
        return {
          success: false,
          plannedPatches: [],
          collisionDetected: true,
          error: `SYMBOL_COLLISION: Symbol(s) [${edit.symbols.join(", ")}] already exist in "${cleanPath}". Operation halted for safety.`,
        };
      }

      // Verify search block exists in target file
      const currentContent = readFileSync(fullPath, "utf8");
      if (!currentContent.includes(edit.search) && !currentContent.includes(edit.search.trim())) {
        return {
          success: false,
          plannedPatches: [],
          routerUnparseable: cleanPath.includes("route") || cleanPath.includes("App"),
          error: `SEARCH_BLOCK_NOT_FOUND: Search block not found in "${cleanPath}". Surgical patch cannot be safely applied.`,
        };
      }

      plannedPatches.push({
        filePath: cleanPath,
        operation: "SURGICAL_PATCH",
        patchBlocks: [{ search: edit.search, replace: edit.replace, description: edit.reason }],
        reason: edit.reason,
        targetSymbols: edit.symbols,
      });
    }

    return {
      success: true,
      plannedPatches,
    };
  }
}
