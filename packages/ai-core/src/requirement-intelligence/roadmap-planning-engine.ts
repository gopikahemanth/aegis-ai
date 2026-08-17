/**
 * RoadmapPlanningEngine
 *
 * Constructs and manages the structured, machine-readable product roadmap.
 * Invariant: ROADMAP ITEM ≠ IMPLEMENTATION AUTHORIZATION (Items require explicit authorization)
 */

import { PrioritizedRequirement } from "./requirement-prioritization-engine.js";

export type RoadmapStatus =
  | "DISCOVERED"
  | "VALIDATING"
  | "BACKLOG"
  | "PLANNED"
  | "AUTHORIZED"
  | "IMPLEMENTING"
  | "VERIFYING"
  | "DEPLOYED"
  | "MEASURED"
  | "COMPLETED"
  | "REJECTED"
  | "BLOCKED";

export interface RoadmapItem {
  id: string;
  requirementId: string;
  title: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  priority: "P0_CRITICAL" | "P1_HIGH" | "P2_MEDIUM" | "P3_LOW";
  dependencies: string[];
  status: RoadmapStatus;
  expectedImpact: string;
  estimatedComplexity: "LOW" | "MODERATE" | "HIGH";
  authorizationStatus: "AWAITING_AUTHORIZATION" | "AUTHORIZED" | "BLOCKED";
}

export interface ProductRoadmap {
  roadmapId: string;
  productName: string;
  items: RoadmapItem[];
  totalItems: number;
  activeQuarter: "Q1" | "Q2" | "Q3" | "Q4";
  summary: string;
}

export class RoadmapPlanningEngine {
  public static planRoadmap(
    productName: string,
    prioritized: PrioritizedRequirement[],
    opts: {
      isBlocked?: boolean;
    } = {}
  ): ProductRoadmap {
    const { isBlocked = false } = opts;

    const items: RoadmapItem[] = prioritized.map((p, idx) => ({
      id: `rdm_${p.requirementId.toLowerCase()}`,
      requirementId: p.requirementId,
      title: p.title,
      quarter: "Q1",
      priority: p.priorityTier,
      dependencies: [],
      status: isBlocked ? "BLOCKED" : "PLANNED",
      expectedImpact: "Saves 4 hours/week of administrative time & reduces support tickets by 80%",
      estimatedComplexity: "LOW",
      authorizationStatus: isBlocked ? "BLOCKED" : "AWAITING_AUTHORIZATION",
    }));

    // Add future roadmap context items
    items.push(
      {
        id: "rdm_q2_reminders",
        requirementId: "REQ-062",
        title: "Automated Membership Expiration Reminders",
        quarter: "Q2",
        priority: "P2_MEDIUM",
        dependencies: ["REQ-061"],
        status: "PLANNED",
        expectedImpact: "Increases renewal rates by 15%",
        estimatedComplexity: "MODERATE",
        authorizationStatus: "AWAITING_AUTHORIZATION",
      },
      {
        id: "rdm_q2_revenue",
        requirementId: "REQ-063",
        title: "Monthly Revenue Analytics & MRR Dashboard",
        quarter: "Q2",
        priority: "P1_HIGH",
        dependencies: [],
        status: "PLANNED",
        expectedImpact: "Delivers executive financial visibility",
        estimatedComplexity: "MODERATE",
        authorizationStatus: "AWAITING_AUTHORIZATION",
      }
    );

    return {
      roadmapId: `roadmap_${productName.toLowerCase().replace(/\s+/g, "_")}`,
      productName,
      items,
      totalItems: items.length,
      activeQuarter: "Q1",
      summary: `Product Roadmap: ${items.length} items planned across Q1-Q2 (Active Q1: ${items[0]?.title}).`,
    };
  }
}
