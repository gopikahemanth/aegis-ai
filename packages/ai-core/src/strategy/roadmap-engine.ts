/**
 * StrategicRoadmapEngine
 *
 * Plans multi-generation engineering roadmaps across NOW, NEXT, LATER, and FUTURE horizons.
 */

import type { StrategicInitiative } from "./strategic-initiative.js";

export interface RoadmapHorizon {
  horizon: "NOW" | "NEXT" | "LATER" | "FUTURE";
  initiatives: StrategicInitiative[];
}

export interface StrategicRoadmap {
  organizationId: string;
  generatedAt: string;
  horizons: RoadmapHorizon[];
}

export class StrategicRoadmapEngine {
  public static generateRoadmap(organizationId: string, initiatives: StrategicInitiative[]): StrategicRoadmap {
    const orgInitiatives = initiatives.filter((i) => i.organizationId === organizationId);

    const now = orgInitiatives.filter((i) => i.priorityClass === "CRITICAL");
    const next = orgInitiatives.filter((i) => i.priorityClass === "HIGH");
    const later = orgInitiatives.filter((i) => i.priorityClass === "MEDIUM");
    const future = orgInitiatives.filter((i) => i.priorityClass === "LOW" || i.priorityClass === "DEFER");

    return {
      organizationId,
      generatedAt: new Date().toISOString(),
      horizons: [
        { horizon: "NOW", initiatives: now },
        { horizon: "NEXT", initiatives: next },
        { horizon: "LATER", initiatives: later },
        { horizon: "FUTURE", initiatives: future },
      ],
    };
  }
}
