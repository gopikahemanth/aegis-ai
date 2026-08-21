/**
 * Persistent AST Cache — Aegis V2.3 Project 2 Phase 1
 *
 * Core engine for persisting, loading, and managing versioned AST records,
 * symbol lookup tables, and reverse dependency indexes under .aegis/cache/ast/.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import ts from "typescript";
import {
  AST_CACHE_SCHEMA_VERSION,
  AST_CACHE_COMPATIBILITY_KEY,
  type AstCacheManifest,
  type CachedFileRecord,
  type CachedSymbolEntry,
  type CachedReverseDependencyIndex,
} from "./ast-cache-contract.js";
import { AstCacheHash } from "./ast-cache-hash.js";
import { AstCacheLock } from "./ast-cache-lock.js";
import { AstCacheValidator } from "./ast-cache-validator.js";

export class PersistentAstCache {
  public readonly projectRoot: string;
  public readonly cacheDir: string;
  public readonly filesDir: string;
  public readonly indexDir: string;
  private readonly lock: AstCacheLock;
  private manifest: AstCacheManifest | null = null;
  private isInitialized: boolean = false;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.cacheDir = join(this.projectRoot, ".aegis", "cache", "ast");
    this.filesDir = join(this.cacheDir, "files");
    this.indexDir = join(this.cacheDir, "index");
    this.lock = new AstCacheLock(this.cacheDir);
  }

  /**
   * Initializes the persistent cache directory structure and validates the manifest.
   * If the cache is missing, corrupted, or incompatible, it is safely reset.
   */
  public init(): boolean {
    if (this.isInitialized) return true;

    try {
      AstCacheValidator.ensureGitIgnore(this.projectRoot);

      if (!existsSync(this.cacheDir)) {
        this.reset();
        this.isInitialized = true;
        return true;
      }

      this.manifest = this.loadManifest();
      if (!AstCacheValidator.validateManifest(this.projectRoot, this.manifest)) {
        this.reset();
        this.isInitialized = true;
        return true;
      }

      if (!existsSync(this.filesDir)) mkdirSync(this.filesDir, { recursive: true });
      if (!existsSync(this.indexDir)) mkdirSync(this.indexDir, { recursive: true });

      this.isInitialized = true;
      return true;
    } catch {
      this.reset();
      this.isInitialized = true;
      return true;
    }
  }

  /**
   * Loads a cached file record by relative path. Returns null if missing or corrupted.
   */
  public getFileRecord(relPath: string): CachedFileRecord | null {
    if (!this.init()) return null;

    const recordPath = this.getRecordPath(relPath);
    if (!existsSync(recordPath)) return null;

    try {
      const raw = readFileSync(recordPath, "utf8");
      const record = JSON.parse(raw) as CachedFileRecord;
      if (!record.filePath || !record.contentHash || !Array.isArray(record.symbols)) {
        return null;
      }
      return record;
    } catch {
      return null;
    }
  }

  /**
   * Persists a single file record atomically.
   */
  public setFileRecord(record: CachedFileRecord): void {
    if (!this.init()) return;

    try {
      AstCacheValidator.sanitizeAndValidateRecord(record);
      const recordPath = this.getRecordPath(record.filePath);
      const dir = dirname(recordPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

      this.writeAtomically(recordPath, JSON.stringify(record, null, 2));
    } catch (err: any) {
      // Ignore write errors to guarantee safety
    }
  }

  /**
   * Saves the global symbol table index.
   */
  public saveSymbolTable(symbols: CachedSymbolEntry[]): void {
    if (!this.init()) return;
    try {
      if (!existsSync(this.indexDir)) mkdirSync(this.indexDir, { recursive: true });
      const targetPath = join(this.indexDir, "symbol-table.json");
      this.writeAtomically(targetPath, JSON.stringify(symbols, null, 2));
    } catch {}
  }

  /**
   * Loads the global symbol table index.
   */
  public loadSymbolTable(): CachedSymbolEntry[] | null {
    if (!this.init()) return null;
    const targetPath = join(this.indexDir, "symbol-table.json");
    if (!existsSync(targetPath)) return null;
    try {
      return JSON.parse(readFileSync(targetPath, "utf8"));
    } catch {
      return null;
    }
  }

  /**
   * Saves the reverse dependency index.
   */
  public saveReverseDependencies(index: CachedReverseDependencyIndex): void {
    if (!this.init()) return;
    try {
      if (!existsSync(this.indexDir)) mkdirSync(this.indexDir, { recursive: true });
      const targetPath = join(this.indexDir, "reverse-deps.json");
      this.writeAtomically(targetPath, JSON.stringify(index, null, 2));
    } catch {}
  }

  /**
   * Loads the reverse dependency index.
   */
  public loadReverseDependencies(): CachedReverseDependencyIndex | null {
    if (!this.init()) return null;
    const targetPath = join(this.indexDir, "reverse-deps.json");
    if (!existsSync(targetPath)) return null;
    try {
      return JSON.parse(readFileSync(targetPath, "utf8"));
    } catch {
      return null;
    }
  }

  /**
   * Deletes a file record from cache.
   */
  public deleteFileRecord(relPath: string): void {
    const recordPath = this.getRecordPath(relPath);
    if (existsSync(recordPath)) {
      try {
        rmSync(recordPath, { force: true });
      } catch {}
    }
  }

  /**
   * Clears and resets the entire AST cache.
   */
  public reset(): void {
    try {
      if (existsSync(this.cacheDir)) {
        rmSync(this.cacheDir, { recursive: true, force: true });
      }
      mkdirSync(this.filesDir, { recursive: true });
      mkdirSync(this.indexDir, { recursive: true });

      const now = Date.now();
      const manifest: AstCacheManifest = {
        version: AST_CACHE_SCHEMA_VERSION,
        compatibilityKey: AST_CACHE_COMPATIBILITY_KEY,
        aegisVersion: "2.3.0",
        tsVersion: ts.version,
        tsconfigHash: AstCacheHash.computeConfigHash(this.projectRoot, "tsconfig.json"),
        packageJsonHash: AstCacheHash.computeConfigHash(this.projectRoot, "package.json"),
        createdAt: now,
        lastUpdated: now,
      };

      this.manifest = manifest;
      this.writeAtomically(join(this.cacheDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    } catch {}
  }

  /**
   * Executes a callback within exclusive cache lock. If lock acquisition fails,
   * continues safely in-memory without persistent updates.
   */
  public withLock<T>(fn: () => T): T {
    const acquired = this.lock.acquire();
    try {
      return fn();
    } finally {
      if (acquired) {
        this.lock.release();
      }
    }
  }

  /**
   * Loads manifest from manifest.json.
   */
  public loadManifest(): AstCacheManifest | null {
    const manifestPath = join(this.cacheDir, "manifest.json");
    if (!existsSync(manifestPath)) return null;
    try {
      return JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch {
      return null;
    }
  }

  private getRecordPath(relPath: string): string {
    const normalized = relPath.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
    const safeEncoded = normalized.replace(/\//g, "__") + ".json";
    return join(this.filesDir, safeEncoded);
  }

  private writeAtomically(targetPath: string, content: string): void {
    const tmpPath = `${targetPath}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}.tmp`;
    writeFileSync(tmpPath, content, "utf8");
    renameSync(tmpPath, targetPath);
  }
}
