/**
 * FeatureCompletenessTracker
 *
 * Tracks features through their lifecycle (REQUESTED -> PLANNED -> IMPLEMENTING -> IMPLEMENTED -> VERIFIED -> FAILED).
 * Distinguishes IMPLEMENTED (code written) from VERIFIED (hard evidence gathered).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export type FeatureStatus =
  | "REQUESTED"
  | "PLANNED"
  | "IMPLEMENTING"
  | "IMPLEMENTED"
  | "VERIFIED"
  | "FAILED"
  | "INCOMPLETE";

export interface FeatureEntry {
  featureId: string;
  name: string;
  description: string;
  requirements: string[];
  status: FeatureStatus;
  ownedFiles: string[];
  apiDependencies: string[];
  dataDependencies: string[];
  uiDependencies: string[];
  taskIds: number[];
  tests: string[];
  verificationEvidence: string[];
  failureReasons: string[];
  updatedAt: string;
}

export class FeatureCompletenessTracker {
  private static features: Map<string, FeatureEntry> = new Map();

  public static reset(): void {
    this.features.clear();
  }

  public static initializeFromRequirements(
    requirements: Array<{ id: string; name: string; description: string; reqs?: string[] }>
  ): void {
    this.features.clear();
    for (const r of requirements) {
      this.features.set(r.id, {
        featureId: r.id,
        name: r.name,
        description: r.description,
        requirements: r.reqs || [r.description],
        status: "REQUESTED",
        ownedFiles: [],
        apiDependencies: [],
        dataDependencies: [],
        uiDependencies: [],
        taskIds: [],
        tests: [],
        verificationEvidence: [],
        failureReasons: [],
        updatedAt: new Date().toISOString(),
      });
    }
  }

  public static updateFeatureStatus(
    featureId: string,
    status: FeatureStatus,
    details?: Partial<FeatureEntry>
  ): void {
    const existing = this.features.get(featureId);
    if (!existing) return;

    this.features.set(featureId, {
      ...existing,
      ...details,
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  public static addEvidence(featureId: string, evidence: string): void {
    const existing = this.features.get(featureId);
    if (!existing) return;

    const evidenceList = existing.verificationEvidence || [];
    if (!evidenceList.includes(evidence)) {
      evidenceList.push(evidence);
    }
    existing.verificationEvidence = evidenceList;
  }

  public static getFeature(featureId: string): FeatureEntry | undefined {
    return this.features.get(featureId);
  }

  public static getAllFeatures(): FeatureEntry[] {
    return Array.from(this.features.values());
  }

  public static areAllFeaturesVerified(): boolean {
    if (this.features.size === 0) return false;
    return Array.from(this.features.values()).every(f => f.status === "VERIFIED");
  }

  public static save(projectPath: string): void {
    const aegisDir = join(projectPath, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
    writeFileSync(
      join(aegisDir, "feature-completeness.json"),
      JSON.stringify(Array.from(this.features.values()), null, 2),
      "utf8"
    );
  }
}
