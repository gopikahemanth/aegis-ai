/**
 * ChangedFileDetector — Aegis V2.3 Project 2 Phase 2
 *
 * Compares actual repository disk state against the persistent AST cache to classify
 * each file as UNCHANGED, MODIFIED, CREATED, DELETED, or UNKNOWN.
 *
 * Safety rule: rename is NEVER inferred from filename similarity.
 * If the status of a file cannot be determined conclusively → UNKNOWN.
 * UNKNOWN → INCREMENTAL_GRAPH_INCOMPLETE → safe full cold analysis.
 */

import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import type { PersistentAstCache } from "../ast-cache/persistent-ast-cache.js";
import { AstCacheHash } from "../ast-cache/ast-cache-hash.js";
import type { CachedFileRecord } from "../ast-cache/ast-cache-contract.js";
import type { FileChangeRecord, FileChangeStatus } from "./incremental-analysis-contract.js";

export class ChangedFileDetector {
  private readonly projectRoot: string;
  private readonly astCache: PersistentAstCache;

  constructor(projectRoot: string, astCache: PersistentAstCache) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.astCache = astCache;
  }

  /**
   * Detects file changes between the current disk state and the persistent cache.
   *
   * @param currentFiles - All source files currently on disk (relative paths)
   * @param cachedPaths - All file paths known to the persistent cache (relative paths)
   * @returns Sorted, deterministic list of FileChangeRecords
   */
  public detect(currentFiles: string[], cachedPaths: string[]): FileChangeRecord[] {
    const records: FileChangeRecord[] = [];

    const currentSet = new Set(currentFiles.map(f => this.normalize(f)));
    const cachedSet = new Set(cachedPaths.map(f => this.normalize(f)));

    // ── CREATED: on disk but not in cache ────────────────────────────────────
    for (const file of currentSet) {
      if (!cachedSet.has(file)) {
        const hash = this.safeHash(file);
        records.push({
          filePath: file,
          status: "CREATED",
          newContentHash: hash,
        });
      }
    }

    // ── DELETED: in cache but not on disk ────────────────────────────────────
    for (const cachedFile of cachedSet) {
      if (!currentSet.has(cachedFile)) {
        const cached = this.astCache.getFileRecord(cachedFile);
        records.push({
          filePath: cachedFile,
          status: "DELETED",
          oldContentHash: cached?.contentHash,
        });
      }
    }

    // ── UNCHANGED / MODIFIED: in both sets ───────────────────────────────────
    for (const file of currentSet) {
      if (!cachedSet.has(file)) continue; // Already classified as CREATED

      const result = this.classifyExistingFile(file);
      records.push(result);
    }

    // Sort deterministically by file path
    return records.sort((a, b) => a.filePath.localeCompare(b.filePath));
  }

  /**
   * Detects changes for a specific subset of files only.
   * Used when only certain files are suspected to have changed.
   */
  public detectSubset(files: string[]): FileChangeRecord[] {
    const records: FileChangeRecord[] = [];

    for (const file of files) {
      const normalized = this.normalize(file);
      const fullPath = join(this.projectRoot, normalized);

      if (!existsSync(fullPath)) {
        const cached = this.astCache.getFileRecord(normalized);
        records.push({
          filePath: normalized,
          status: cached ? "DELETED" : "UNKNOWN",
          oldContentHash: cached?.contentHash,
          reason: cached ? undefined : "File missing and not in cache",
        });
      } else {
        records.push(this.classifyExistingFile(normalized));
      }
    }

    return records.sort((a, b) => a.filePath.localeCompare(b.filePath));
  }

  /**
   * Returns whether the detected changes require a full cold analysis.
   * True if any file is classified as UNKNOWN.
   */
  public requiresFullAnalysis(records: FileChangeRecord[]): boolean {
    return records.some(r => r.status === "UNKNOWN");
  }

  /**
   * Returns only the changed records (MODIFIED, CREATED, DELETED, UNKNOWN).
   */
  public getChangedRecords(records: FileChangeRecord[]): FileChangeRecord[] {
    return records.filter(r => r.status !== "UNCHANGED");
  }

  /**
   * Returns true if there are no changes at all.
   */
  public isClean(records: FileChangeRecord[]): boolean {
    return records.every(r => r.status === "UNCHANGED");
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private classifyExistingFile(relPath: string): FileChangeRecord {
    const fullPath = join(this.projectRoot, relPath);

    try {
      const cached: CachedFileRecord | null = this.astCache.getFileRecord(relPath);

      if (!cached) {
        return {
          filePath: relPath,
          status: "CREATED",
          newContentHash: this.safeHash(relPath),
        };
      }

      const stat = statSync(fullPath);

      // Fast path: mtime and size match → UNCHANGED
      if (stat.mtimeMs === cached.mtimeMs && stat.size === cached.sizeBytes) {
        return {
          filePath: relPath,
          status: "UNCHANGED",
          oldContentHash: cached.contentHash,
          newContentHash: cached.contentHash,
        };
      }

      // Slow path: content hash comparison
      const currentHash = AstCacheHash.computeFileHash(fullPath);

      if (!currentHash) {
        return {
          filePath: relPath,
          status: "UNKNOWN",
          reason: "Failed to compute content hash",
          oldContentHash: cached.contentHash,
        };
      }

      if (currentHash === cached.contentHash) {
        return {
          filePath: relPath,
          status: "UNCHANGED",
          oldContentHash: cached.contentHash,
          newContentHash: currentHash,
        };
      }

      return {
        filePath: relPath,
        status: "MODIFIED",
        oldContentHash: cached.contentHash,
        newContentHash: currentHash,
      };
    } catch {
      return {
        filePath: relPath,
        status: "UNKNOWN",
        reason: "Exception during classification",
      };
    }
  }

  private safeHash(relPath: string): string {
    try {
      return AstCacheHash.computeFileHash(join(this.projectRoot, relPath));
    } catch {
      return "";
    }
  }

  private normalize(p: string): string {
    return p.replace(/\\/g, "/").replace(/^[/\\]+/, "");
  }
}
