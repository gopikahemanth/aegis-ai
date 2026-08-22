/**
 * IncrementalChangeDetector — Aegis V2.3 Project 2 Phase 2
 *
 * Detects filesystem modifications against PersistentAstCache records:
 * - Checks existence, size, mtime, and SHA-256 content hashes
 * - Classifies change kinds: ADDED, REMOVED, MODIFIED, UNCHANGED
 * - Classifies structural impact: CONTENT_ONLY, SYMBOLS_CHANGED, IMPORTS_CHANGED, EXPORTS_CHANGED, SIGNATURE_CHANGED
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { AstCacheHash } from "./ast-cache-hash.js";
import type { PersistentAstCache } from "./persistent-ast-cache.js";
import type { CachedFileRecord } from "./ast-cache-contract.js";

export type FileChangeKind = "ADDED" | "REMOVED" | "MODIFIED" | "UNCHANGED";

export type FileChangeImpact =
  | "CONTENT_ONLY"
  | "SYMBOLS_CHANGED"
  | "IMPORTS_CHANGED"
  | "EXPORTS_CHANGED"
  | "SIGNATURE_CHANGED"
  | "UNKNOWN";

export interface FileChangeDetail {
  filePath: string;
  kind: FileChangeKind;
  impact: FileChangeImpact;
  oldHash?: string;
  newHash?: string;
  oldMtimeMs?: number;
  newMtimeMs?: number;
  oldSizeBytes?: number;
  newSizeBytes?: number;
}

export interface IncrementalChangeReport {
  timestamp: number;
  changes: FileChangeDetail[];
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
  hasChanges: boolean;
}

export class IncrementalChangeDetector {
  private readonly projectRoot: string;
  private readonly cache: PersistentAstCache;

  constructor(projectRoot: string, cache: PersistentAstCache) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.cache = cache;
  }

  /**
   * Scans repository files and compares them against cached AST file records.
   */
  public detectChanges(): IncrementalChangeReport {
    const diskFiles = this.discoverSourceFiles(this.projectRoot);
    const diskFileSet = new Set(diskFiles);
    const changes: FileChangeDetail[] = [];

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];
    const unchanged: string[] = [];

    // 1. Check existing & modified disk files
    for (const relPath of diskFiles) {
      const fullPath = resolve(this.projectRoot, relPath);
      const cached = this.cache.getFileRecord(relPath);

      if (!cached) {
        const contentHash = AstCacheHash.computeFileHash(fullPath);
        const stats = statSync(fullPath);
        changes.push({
          filePath: relPath,
          kind: "ADDED",
          impact: "UNKNOWN",
          newHash: contentHash,
          newMtimeMs: stats.mtimeMs,
          newSizeBytes: stats.size,
        });
        added.push(relPath);
        continue;
      }

      const stats = statSync(fullPath);

      // Fast mtime + size check
      if (Math.abs(stats.mtimeMs - cached.mtimeMs) < 1 && stats.size === cached.sizeBytes) {
        changes.push({
          filePath: relPath,
          kind: "UNCHANGED",
          impact: "CONTENT_ONLY",
          oldHash: cached.contentHash,
          newHash: cached.contentHash,
          oldMtimeMs: cached.mtimeMs,
          newMtimeMs: stats.mtimeMs,
          oldSizeBytes: cached.sizeBytes,
          newSizeBytes: stats.size,
        });
        unchanged.push(relPath);
        continue;
      }

      // Hash comparison if mtime/size differs
      const contentHash = AstCacheHash.computeFileHash(fullPath);
      if (contentHash === cached.contentHash) {
        changes.push({
          filePath: relPath,
          kind: "UNCHANGED",
          impact: "CONTENT_ONLY",
          oldHash: cached.contentHash,
          newHash: contentHash,
          oldMtimeMs: cached.mtimeMs,
          newMtimeMs: stats.mtimeMs,
          oldSizeBytes: cached.sizeBytes,
          newSizeBytes: stats.size,
        });
        unchanged.push(relPath);
      } else {
        const impact = this.classifyImpact(cached, fullPath);
        changes.push({
          filePath: relPath,
          kind: "MODIFIED",
          impact,
          oldHash: cached.contentHash,
          newHash: contentHash,
          oldMtimeMs: cached.mtimeMs,
          newMtimeMs: stats.mtimeMs,
          oldSizeBytes: cached.sizeBytes,
          newSizeBytes: stats.size,
        });
        modified.push(relPath);
      }
    }

    // 2. Check deleted files present in cache index
    const reverseIndex = this.cache.loadReverseDependencies();
    const indexedFiles = new Set<string>();
    if (reverseIndex) {
      Object.keys(reverseIndex.fileDependents).forEach(f => indexedFiles.add(f));
      Object.values(reverseIndex.fileDependents).forEach(deps => deps.forEach(d => indexedFiles.add(d)));
    }

    for (const cachedPath of indexedFiles) {
      if (!diskFileSet.has(cachedPath)) {
        const cached = this.cache.getFileRecord(cachedPath);
        changes.push({
          filePath: cachedPath,
          kind: "REMOVED",
          impact: "UNKNOWN",
          oldHash: cached?.contentHash,
        });
        removed.push(cachedPath);
      }
    }

    return {
      timestamp: Date.now(),
      changes,
      added,
      removed,
      modified,
      unchanged,
      hasChanges: added.length > 0 || removed.length > 0 || modified.length > 0,
    };
  }

  private classifyImpact(cached: CachedFileRecord, fullPath: string): FileChangeImpact {
    try {
      const content = readFileSync(fullPath, "utf8");
      // Check if imports changed textually
      const hasImportDiff = !cached.imports.every(imp => content.includes(imp.sourceModuleSpecifier));
      if (hasImportDiff) return "IMPORTS_CHANGED";

      // Check if exported symbol names still present
      const hasExportDiff = !cached.exports.every(exp => content.includes(exp.exportedName));
      if (hasExportDiff) return "EXPORTS_CHANGED";

      return "SYMBOLS_CHANGED";
    } catch {
      return "UNKNOWN";
    }
  }

  private discoverSourceFiles(dir: string, baseDir: string = dir): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name === "node_modules" ||
          entry.name === ".git" ||
          entry.name === ".aegis" ||
          entry.name === "dist" ||
          entry.name === "build" ||
          entry.name === "coverage"
        ) {
          continue;
        }
        results.push(...this.discoverSourceFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
          const rel = fullPath.replace(/\\/g, "/").replace(baseDir.replace(/\\/g, "/") + "/", "");
          results.push(rel);
        }
      }
    }
    return results;
  }
}
