/**
 * AST Cache Hash — Aegis V2.3 Project 2 Phase 1
 *
 * Deterministic hashing utilities for files, manifests, and cache state.
 */

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { AstCacheManifest, CachedFileRecord } from "./ast-cache-contract.js";

export class AstCacheHash {
  /**
   * Computes SHA-256 hash of a string or Buffer.
   */
  public static sha256(content: string | Buffer): string {
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Computes SHA-256 hash of a file on disk. Returns empty string if file does not exist.
   */
  public static computeFileHash(filePath: string): string {
    if (!existsSync(filePath)) return "";
    try {
      const content = readFileSync(filePath);
      return this.sha256(content);
    } catch {
      return "";
    }
  }

  /**
   * Computes SHA-256 hash of a configuration file (e.g. tsconfig.json or package.json).
   */
  public static computeConfigHash(projectRoot: string, configFileName: string): string {
    const fullPath = join(projectRoot, configFileName);
    return this.computeFileHash(fullPath);
  }

  /**
   * Computes deterministic cache hash over canonical manifest and sorted file records.
   */
  public static computeDeterministicCacheHash(
    manifest: AstCacheManifest,
    fileRecords: CachedFileRecord[]
  ): string {
    const sortedFiles = [...fileRecords].sort((a, b) => a.filePath.localeCompare(b.filePath));
    const payload = JSON.stringify({
      version: manifest.version,
      compatibilityKey: manifest.compatibilityKey,
      aegisVersion: manifest.aegisVersion,
      tsVersion: manifest.tsVersion,
      tsconfigHash: manifest.tsconfigHash,
      packageJsonHash: manifest.packageJsonHash,
      files: sortedFiles.map(f => ({
        path: f.filePath.replace(/\\/g, "/"),
        hash: f.contentHash,
      })),
    });
    return this.sha256(payload);
  }
}
