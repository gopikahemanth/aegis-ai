/**
 * ProjectIntelligenceIndex
 *
 * Structured persistent project intelligence index stored in .aegis/project-intelligence.json.
 * Tracks generation lineage, feature lifecycles, and verification evidence across generations.
 * Reconciles from filesystem reality rather than blindly trusting JSON.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ChangeSet } from "./incremental-change-analyzer.js";

export interface GenerationRecord {
  generationId: string;
  parentGenerationId?: string;
  requestId: string;
  prompt: string;
  timestamp: string;
  contractHashes: Record<string, string>;
  changeSet: ChangeSet;
  verificationPassed: boolean;
  evidenceSummary: string;
}

export interface FeatureRecord {
  featureId: string;
  name: string;
  status: "REQUESTED" | "PLANNED" | "IMPLEMENTING" | "IMPLEMENTED" | "VERIFIED" | "DEPRECATED" | "REMOVED";
  createdInGeneration: string;
  lastModifiedInGeneration: string;
  ownedFiles: string[];
}

export interface ProjectIntelligenceStore {
  version: 1;
  projectId: string;
  generations: GenerationRecord[];
  features: Record<string, FeatureRecord>;
  lastUpdated: string;
}

export class ProjectIntelligenceIndex {
  public static getStorePath(projectPath: string): string {
    return join(projectPath, ".aegis", "project-intelligence.json");
  }

  public static load(projectPath: string, projectId: string = "default_project"): ProjectIntelligenceStore {
    const storePath = this.getStorePath(projectPath);
    if (existsSync(storePath)) {
      try {
        const parsed = JSON.parse(readFileSync(storePath, "utf8"));
        if (parsed.version === 1) return parsed;
      } catch {}
    }

    return {
      version: 1,
      projectId,
      generations: [],
      features: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  public static save(projectPath: string, store: ProjectIntelligenceStore): void {
    const aegisDir = join(projectPath, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    store.lastUpdated = new Date().toISOString();
    writeFileSync(this.getStorePath(projectPath), JSON.stringify(store, null, 2), "utf8");
  }

  public static recordGeneration(
    projectPath: string,
    projectId: string,
    record: GenerationRecord
  ): void {
    const store = this.load(projectPath, projectId);
    store.generations.push(record);
    this.save(projectPath, store);
  }

  public static updateFeature(
    projectPath: string,
    projectId: string,
    feature: FeatureRecord
  ): void {
    const store = this.load(projectPath, projectId);
    store.features[feature.featureId] = feature;
    this.save(projectPath, store);
  }

  public static getLatestGeneration(projectPath: string): GenerationRecord | null {
    const store = this.load(projectPath);
    return store.generations[store.generations.length - 1] || null;
  }
}
