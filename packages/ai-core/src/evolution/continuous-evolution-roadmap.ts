/**
 * ContinuousEvolutionRoadmap
 *
 * Immutable, cryptographically chained enterprise engineering evolution roadmaps
 * across NOW, NEXT, LATER, and FUTURE horizons.
 */

import { createHash } from "node:crypto";

export type EvolutionRoadmapHorizon = "NOW" | "NEXT" | "LATER" | "FUTURE";

export interface RoadmapItem {
  itemId: string;
  opportunityId: string;
  horizon: EvolutionRoadmapHorizon;
  title: string;
  targetQuarter: string;
}

export interface RoadmapVersion {
  versionId: string;
  versionNumber: number;
  items: RoadmapItem[];
  previousVersionHash: string;
  currentVersionHash: string;
  createdAt: string;
  authorId: string;
}

export class ContinuousEvolutionRoadmap {
  private static versions: RoadmapVersion[] = [];

  public static publishVersion(
    items: RoadmapItem[],
    authorId: string = "system_lead"
  ): RoadmapVersion {
    const prevHash =
      this.versions.length > 0
        ? this.versions[this.versions.length - 1].currentVersionHash
        : "GENESIS_ROADMAP_HASH";
    const versionNumber = this.versions.length + 1;
    const versionId = `roadmap_v${versionNumber}`;
    const createdAt = new Date().toISOString();

    const payload = `${versionId}|${versionNumber}|${JSON.stringify(items)}|${authorId}|${createdAt}|${prevHash}`;
    const currentVersionHash = createHash("sha256").update(payload).digest("hex");

    const version: RoadmapVersion = {
      versionId,
      versionNumber,
      items,
      previousVersionHash: prevHash,
      currentVersionHash,
      createdAt,
      authorId,
    };

    this.versions.push(version);
    return version;
  }

  public static getLatestVersion(): RoadmapVersion | undefined {
    return this.versions.length > 0 ? this.versions[this.versions.length - 1] : undefined;
  }

  public static getVersions(): RoadmapVersion[] {
    return [...this.versions];
  }

  public static reset(): void {
    this.versions = [];
  }
}
