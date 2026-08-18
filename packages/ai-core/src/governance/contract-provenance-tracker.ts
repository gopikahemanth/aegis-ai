/**
 * ContractProvenanceTracker
 *
 * Tracks and verifies the lineage and contract provenance of every generated artifact.
 *
 * Rules:
 * - Every generated file records:
 *   - file path
 *   - source contract version and architecture hash
 *   - generation stage
 *   - agent name
 *   - task name or ID
 *   - associated domain models / features
 *   - timestamp
 * - Persisted in `.aegis/provenance.json`
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ArchitectureContractV1 } from "./architecture-resolver.js";

export interface ProvenanceEntry {
  file: string;
  sourceContract: string;
  architectureHash: string;
  contractVersion: number;
  generationStage: string;
  agent: string;
  task?: string;
  sourceModels?: string[];
  sourceFeatures?: string[];
  timestamp: string;
}

export interface ProvenanceStore {
  version: 1;
  architectureHash: string;
  entries: Record<string, ProvenanceEntry>;
  lastUpdated: string;
}

export class ContractProvenanceTracker {
  private static readonly PROVENANCE_FILE = ".aegis/provenance.json";

  /**
   * Records provenance for a generated artifact.
   */
  public static recordArtifact(
    projectRoot: string,
    entry: Omit<ProvenanceEntry, "timestamp">,
    contract?: ArchitectureContractV1
  ): void {
    const store = ContractProvenanceTracker.loadStore(projectRoot, contract);
    const normalizedFile = entry.file.replace(/\\/g, "/");

    store.entries[normalizedFile] = {
      ...entry,
      file: normalizedFile,
      timestamp: new Date().toISOString(),
    };
    store.lastUpdated = new Date().toISOString();

    ContractProvenanceTracker.saveStore(projectRoot, store);
  }

  /**
   * Records batch provenance for multiple files from a task execution.
   */
  public static recordBatch(
    projectRoot: string,
    files: string[],
    meta: {
      stage: string;
      agent: string;
      task?: string;
      models?: string[];
      features?: string[];
    },
    contract?: ArchitectureContractV1
  ): void {
    const store = ContractProvenanceTracker.loadStore(projectRoot, contract);
    const now = new Date().toISOString();
    const archHash = contract?.architectureHash || store.architectureHash || "unversioned";
    const contractVer = contract?.version || 1;

    for (const f of files) {
      const normalized = f.replace(/\\/g, "/");
      store.entries[normalized] = {
        file: normalized,
        sourceContract: `contract_v${contractVer}`,
        architectureHash: archHash,
        contractVersion: contractVer,
        generationStage: meta.stage,
        agent: meta.agent,
        task: meta.task,
        sourceModels: meta.models,
        sourceFeatures: meta.features,
        timestamp: now,
      };
    }
    store.lastUpdated = now;

    ContractProvenanceTracker.saveStore(projectRoot, store);
  }

  /**
   * Retrieves provenance for a given file.
   */
  public static getProvenance(projectRoot: string, filePath: string): ProvenanceEntry | null {
    const store = ContractProvenanceTracker.loadStore(projectRoot);
    const normalized = filePath.replace(/\\/g, "/");
    return store.entries[normalized] || null;
  }

  /**
   * Loads the full provenance store.
   */
  public static loadStore(projectRoot: string, contract?: ArchitectureContractV1): ProvenanceStore {
    const fullPath = join(projectRoot, ContractProvenanceTracker.PROVENANCE_FILE);
    if (existsSync(fullPath)) {
      try {
        return JSON.parse(readFileSync(fullPath, "utf8"));
      } catch {}
    }

    return {
      version: 1,
      architectureHash: contract?.architectureHash || "unversioned",
      entries: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Saves the provenance store to disk.
   */
  private static saveStore(projectRoot: string, store: ProvenanceStore): void {
    try {
      const aegisDir = join(projectRoot, ".aegis");
      if (!existsSync(aegisDir)) {
        mkdirSync(aegisDir, { recursive: true });
      }
      writeFileSync(join(projectRoot, ContractProvenanceTracker.PROVENANCE_FILE), JSON.stringify(store, null, 2), "utf8");
    } catch {
      // Best-effort non-blocking persistence
    }
  }
}
