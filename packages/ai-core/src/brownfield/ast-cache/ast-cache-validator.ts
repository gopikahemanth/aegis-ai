/**
 * AST Cache Validator — Aegis V2.3 Project 2 Phase 1
 *
 * Implements hybrid cache record validation, manifest validation, secret exclusion,
 * and .gitignore auto-registration.
 */

import { existsSync, statSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import {
  AST_CACHE_SCHEMA_VERSION,
  AST_CACHE_COMPATIBILITY_KEY,
  type AstCacheManifest,
  type CachedFileRecord,
  type CacheValidationStatus,
} from "./ast-cache-contract.js";
import { AstCacheHash } from "./ast-cache-hash.js";

export class AstCacheValidator {
  /**
   * Validates manifest against current project state.
   */
  public static validateManifest(
    projectRoot: string,
    manifest: AstCacheManifest | null
  ): boolean {
    if (!manifest) return false;

    if (manifest.version !== AST_CACHE_SCHEMA_VERSION) return false;
    if (manifest.compatibilityKey !== AST_CACHE_COMPATIBILITY_KEY) return false;
    if (manifest.tsVersion !== ts.version) return false;

    const currentTsconfigHash = AstCacheHash.computeConfigHash(projectRoot, "tsconfig.json");
    if (manifest.tsconfigHash !== currentTsconfigHash) return false;

    const currentPackageJsonHash = AstCacheHash.computeConfigHash(projectRoot, "package.json");
    if (manifest.packageJsonHash !== currentPackageJsonHash) return false;

    return true;
  }

  /**
   * Validates a cached file record using hybrid mtime/size + content hash.
   */
  public static validateFileRecord(
    fullPath: string,
    cached: CachedFileRecord | null
  ): { status: CacheValidationStatus; currentHash?: string; mtimeMs?: number; sizeBytes?: number } {
    if (!cached || !existsSync(fullPath)) {
      return { status: "CACHE_MISS_NEW" };
    }

    try {
      const stat = statSync(fullPath);
      // Fast path: mtime and size match exactly
      if (stat.mtimeMs === cached.mtimeMs && stat.size === cached.sizeBytes) {
        return { status: "CACHE_HIT", currentHash: cached.contentHash, mtimeMs: stat.mtimeMs, sizeBytes: stat.size };
      }

      // Metadata changed: check actual content hash
      const currentHash = AstCacheHash.computeFileHash(fullPath);
      if (currentHash === cached.contentHash) {
        return {
          status: "CACHE_HIT_REVALIDATED",
          currentHash,
          mtimeMs: stat.mtimeMs,
          sizeBytes: stat.size,
        };
      }

      return {
        status: "CACHE_MISS_MODIFIED",
        currentHash,
        mtimeMs: stat.mtimeMs,
        sizeBytes: stat.size,
      };
    } catch {
      return { status: "CACHE_MISS_NEW" };
    }
  }

  /**
   * Asserts that a record contains no secret tokens, credentials, or .env data.
   */
  public static sanitizeAndValidateRecord(record: CachedFileRecord): void {
    if (record.filePath.includes(".env")) {
      throw new Error(`SECURITY_VIOLATION: Cannot cache environment file: ${record.filePath}`);
    }

    const payload = JSON.stringify(record);
    const secretPatterns = [
      /password\s*[:=]\s*["'][^"']+["']/i,
      /secret\s*[:=]\s*["'][^"']+["']/i,
      /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
      /token\s*[:=]\s*["'][^"']+["']/i,
      /postgres:\/\/[^:]+:[^@]+@/i,
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(payload)) {
        throw new Error(`SECURITY_VIOLATION: Cache record contains sensitive credential pattern: ${record.filePath}`);
      }
    }
  }

  /**
   * Ensures .aegis/cache/ is present in project .gitignore.
   */
  public static ensureGitIgnore(projectRoot: string): void {
    const gitignorePath = join(projectRoot, ".gitignore");
    const rule = ".aegis/cache/";

    if (!existsSync(gitignorePath)) {
      try {
        writeFileSync(gitignorePath, `${rule}\n`, "utf8");
      } catch {}
      return;
    }

    try {
      const content = readFileSync(gitignorePath, "utf8");
      if (!content.includes(".aegis/cache") && !content.includes(".aegis/")) {
        const separator = content.endsWith("\n") ? "" : "\n";
        appendFileSync(gitignorePath, `${separator}# Aegis local cache\n${rule}\n`, "utf8");
      }
    } catch {}
  }
}
