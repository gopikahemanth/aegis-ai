/**
 * TaskCacheManager
 *
 * Deterministic task result caching based on task hash, contract hashes, input file hashes,
 * and environment fingerprint. Guarantees safe reuse and granular invalidation.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Task } from "../planner/task.js";

export interface TaskCacheEntry {
  cacheKey: string;
  taskId: number;
  taskHash: string;
  contractHashes: Record<string, string>;
  inputFileHashes: Record<string, string>;
  outputFiles: string[];
  cachedAt: string;
}

export interface TaskCacheStore {
  version: 1;
  entries: Record<string, TaskCacheEntry>; // cacheKey -> TaskCacheEntry
}

export class TaskCacheManager {
  private static stores: Map<string, TaskCacheStore> = new Map();

  public static clear(): void {
    this.stores.clear();
  }


  public static computeCacheKey(
    projectPath: string,
    task: Task,
    promptVersion: string = "v1"
  ): string {
    const taskPayload = {
      id: task.id,
      title: task.title,
      description: task.description,
      ownedFiles: [...(task.ownedFiles || [])].sort(),
      allowedFiles: [...(task.allowedFiles || [])].sort(),
      requiredExports: [...(task.requiredExports || [])].sort(),
      requiredImports: [...(task.requiredImports || [])].sort(),
      dependencies: [...(task.dependencies || [])].sort(),
    };
    const taskHash = createHash("sha256").update(JSON.stringify(taskPayload)).digest("hex").slice(0, 10);

    const contractHashes = task.contractHashes || {};
    const stableContractStr = JSON.stringify(contractHashes, Object.keys(contractHashes).sort());

    // Hash all allowed (read) input files on disk
    const inputFileHashes: Record<string, string> = {};
    for (const rawFile of task.allowedFiles || []) {
      const fullPath = join(projectPath, rawFile);
      if (existsSync(fullPath)) {
        try {
          const content = readFileSync(fullPath, "utf8");
          inputFileHashes[rawFile] = createHash("sha256").update(content).digest("hex").slice(0, 8);
        } catch {
          inputFileHashes[rawFile] = "read_error";
        }
      } else {
        inputFileHashes[rawFile] = "missing";
      }
    }
    const inputFilesStr = JSON.stringify(inputFileHashes, Object.keys(inputFileHashes).sort());

    const envFingerprint = `${process.platform}_${process.arch}_node${process.version.split(".")[0]}`;

    return createHash("sha256")
      .update(`${taskHash}::${stableContractStr}::${inputFilesStr}::${envFingerprint}::${promptVersion}`)
      .digest("hex")
      .slice(0, 16);
  }

  public static get(projectPath: string, task: Task): TaskCacheEntry | null {
    const store = this.loadStore(projectPath);
    const key = this.computeCacheKey(projectPath, task);
    return store.entries[key] || null;
  }

  public static set(projectPath: string, task: Task, outputFiles: string[]): void {
    const store = this.loadStore(projectPath);
    const key = this.computeCacheKey(projectPath, task);

    const inputFileHashes: Record<string, string> = {};
    for (const rawFile of task.allowedFiles || []) {
      const fullPath = join(projectPath, rawFile);
      if (existsSync(fullPath)) {
        try {
          const content = readFileSync(fullPath, "utf8");
          inputFileHashes[rawFile] = createHash("sha256").update(content).digest("hex").slice(0, 8);
        } catch {}
      }
    }

    store.entries[key] = {
      cacheKey: key,
      taskId: task.id,
      taskHash: key.slice(0, 8),
      contractHashes: (task.contractHashes as any) || {},
      inputFileHashes,
      outputFiles,
      cachedAt: new Date().toISOString(),
    };

    this.saveStore(projectPath, store);
  }

  public static invalidateContract(projectPath: string, changedContractKey: string): number {
    const store = this.loadStore(projectPath);
    let invalidatedCount = 0;

    for (const [key, entry] of Object.entries(store.entries)) {
      if (entry.contractHashes && entry.contractHashes[changedContractKey]) {
        delete store.entries[key];
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      this.saveStore(projectPath, store);
    }
    return invalidatedCount;
  }

  public static invalidateAll(projectPath: string): void {
    const aegisCacheDir = join(projectPath, ".aegis", "cache");
    const cacheFile = join(aegisCacheDir, "task-cache.json");
    if (existsSync(cacheFile)) {
      try {
        writeFileSync(cacheFile, JSON.stringify({ version: 1, entries: {} }, null, 2), "utf8");
      } catch {}
    }
    this.stores.set(projectPath, { version: 1, entries: {} });
  }

  private static loadStore(projectPath: string): TaskCacheStore {
    const memStore = this.stores.get(projectPath);
    if (memStore) return memStore;

    const cacheFile = join(projectPath, ".aegis", "cache", "task-cache.json");
    if (existsSync(cacheFile)) {
      try {
        const diskStore: TaskCacheStore = JSON.parse(readFileSync(cacheFile, "utf8"));
        this.stores.set(projectPath, diskStore);
        return diskStore;
      } catch {}
    }

    const freshStore: TaskCacheStore = { version: 1, entries: {} };
    this.stores.set(projectPath, freshStore);
    return freshStore;
  }

  private static saveStore(projectPath: string, store: TaskCacheStore): void {
    this.stores.set(projectPath, store);
    try {
      const cacheDir = join(projectPath, ".aegis", "cache");
      if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
      writeFileSync(join(cacheDir, "task-cache.json"), JSON.stringify(store, null, 2), "utf8");
    } catch {}
  }
}

