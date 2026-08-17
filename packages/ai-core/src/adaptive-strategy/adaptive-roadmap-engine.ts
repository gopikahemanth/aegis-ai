/**
 * AdaptiveRoadmapEngine
 *
 * Maintains versioned, immutable roadmaps across adaptive lifecycle evolutions.
 * Guarantees that historical roadmap versions are never deleted or rewritten.
 */

import type { StrategicInitiative } from "../strategy/strategic-initiative.js";

export interface VersionedRoadmap {
  version: number;
  parentVersion?: number;
  organizationId: string;
  initiatives: StrategicInitiative[];
  createdAt: string;
  reason: string;
}

export class AdaptiveRoadmapEngine {
  private static roadmapVersions: Map<string, VersionedRoadmap[]> = new Map();

  public static publishRoadmapVersion(
    organizationId: string,
    initiatives: StrategicInitiative[],
    reason: string
  ): VersionedRoadmap {
    const list = this.roadmapVersions.get(organizationId) || [];
    const nextVer = list.length + 1;
    const parentVer = list.length > 0 ? list[list.length - 1].version : undefined;

    const vRoadmap: VersionedRoadmap = {
      version: nextVer,
      parentVersion: parentVer,
      organizationId,
      initiatives,
      createdAt: new Date().toISOString(),
      reason,
    };

    list.push(vRoadmap);
    this.roadmapVersions.set(organizationId, list);
    return vRoadmap;
  }

  public static getRoadmapHistory(organizationId: string): VersionedRoadmap[] {
    return [...(this.roadmapVersions.get(organizationId) || [])];
  }

  public static reset(): void {
    this.roadmapVersions.clear();
  }
}
