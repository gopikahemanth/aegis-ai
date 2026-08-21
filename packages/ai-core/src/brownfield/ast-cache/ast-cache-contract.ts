/**
 * AST Cache Contract — Aegis V2.3 Project 2 Phase 1
 *
 * Types and interfaces for the persistent, versioned AST and symbol reference cache.
 */

import type { SymbolIdentifier, ImportBinding, ExportBinding } from "../symbol-reference-resolver.js";
import type { CallerGraphEdge } from "../call-graph-resolver.js";

export const AST_CACHE_SCHEMA_VERSION = 1;
export const AST_CACHE_COMPATIBILITY_KEY = "aegis-v2.3.0-ast-v1";

export interface AstCacheManifest {
  version: number;
  compatibilityKey: string;
  aegisVersion: string;
  tsVersion: string;
  tsconfigHash: string;
  packageJsonHash: string;
  createdAt: number;
  lastUpdated: number;
}

export interface CachedFileRecord {
  filePath: string;
  contentHash: string;
  mtimeMs: number;
  sizeBytes: number;
  symbols: SymbolIdentifier[];
  imports: ImportBinding[];
  exports: ExportBinding[];
  unresolvedDynamicImports: string[];
  callGraphEdges: CallerGraphEdge[];
}

export interface CachedSymbolEntry {
  symbolId: string;
  filePath: string;
  symbolName: string;
  kind: string;
  isExported: boolean;
  isDefaultExport: boolean;
  line: number;
  col: number;
}

export interface CachedReverseDependencyIndex {
  // target relative file -> array of importer relative files
  fileDependents: Record<string, string[]>;
  // target symbol ID -> array of caller/referencer symbol IDs
  symbolDependents: Record<string, string[]>;
}

export type CacheValidationStatus =
  | "CACHE_HIT"
  | "CACHE_HIT_REVALIDATED"
  | "CACHE_MISS_MODIFIED"
  | "CACHE_MISS_NEW"
  | "CACHE_INVALID"
  | "CACHE_LOCKED";
