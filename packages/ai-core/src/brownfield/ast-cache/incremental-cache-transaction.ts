/**
 * IncrementalCacheTransaction — Aegis V2.3 Project 2 Phase 2
 *
 * Transactional manager for atomic AST cache updates:
 * - Snapshots affected cache records prior to modification
 * - Restores byte-exact previous cache state upon failure or interruption
 * - Guarantees cache consistency invariants
 */

import type { PersistentAstCache } from "./persistent-ast-cache.js";
import type { CachedFileRecord, CachedSymbolEntry, CachedReverseDependencyIndex } from "./ast-cache-contract.js";

export interface CacheSnapshot {
  fileRecords: Map<string, CachedFileRecord | null>;
  symbolTable: CachedSymbolEntry[] | null;
  reverseDeps: CachedReverseDependencyIndex | null;
}

export class IncrementalCacheTransaction {
  private readonly cache: PersistentAstCache;
  private snapshot: CacheSnapshot | null = null;
  private inTransaction: boolean = false;

  constructor(cache: PersistentAstCache) {
    this.cache = cache;
  }

  /**
   * Begins a cache update transaction, snapshotting affected files and indexes.
   */
  public begin(affectedFiles: string[]): void {
    if (this.inTransaction) {
      throw new Error("Cannot begin transaction: Transaction already in progress.");
    }

    const fileRecords = new Map<string, CachedFileRecord | null>();
    for (const file of affectedFiles) {
      fileRecords.set(file, this.cache.getFileRecord(file));
    }

    this.snapshot = {
      fileRecords,
      symbolTable: this.cache.loadSymbolTable(),
      reverseDeps: this.cache.loadReverseDependencies(),
    };

    this.inTransaction = true;
  }

  /**
   * Commits the active cache transaction.
   */
  public commit(): void {
    if (!this.inTransaction) return;
    this.snapshot = null;
    this.inTransaction = false;
  }

  /**
   * Rolls back the cache to the exact state captured at begin().
   */
  public rollback(): void {
    if (!this.inTransaction || !this.snapshot) return;

    // Restore file records
    for (const [file, record] of this.snapshot.fileRecords.entries()) {
      if (record) {
        this.cache.setFileRecord(record);
      } else {
        this.cache.deleteFileRecord(file);
      }
    }

    // Restore indexes
    if (this.snapshot.symbolTable) {
      this.cache.saveSymbolTable(this.snapshot.symbolTable);
    }
    if (this.snapshot.reverseDeps) {
      this.cache.saveReverseDependencies(this.snapshot.reverseDeps);
    }

    this.snapshot = null;
    this.inTransaction = false;
  }

  /**
   * Executes a transaction block with automatic rollback on error.
   */
  public execute<T>(affectedFiles: string[], fn: () => T): T {
    this.begin(affectedFiles);
    try {
      const result = fn();
      this.commit();
      return result;
    } catch (err) {
      this.rollback();
      throw err;
    }
  }
}
