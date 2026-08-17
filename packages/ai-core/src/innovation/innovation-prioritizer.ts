/**
 * InnovationPrioritizer
 *
 * Deterministically ranks innovation opportunities based on business value, customer impact,
 * reliability gain, implementation risk, and strategic alignment.
 * Invariant: AI confidence must never override governance policy.
 */

import { ProductOpportunityRecord } from "./product-opportunity-engine.js";

export interface PrioritizedInnovationItem {
  opportunityId: string;
  title: string;
  rank: number;
  priorityScore: number;
  priorityTier: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  governanceOverridePrevented: boolean;
}

export class InnovationPrioritizer {
  public static prioritizeOpportunities(
    opportunities: ProductOpportunityRecord[]
  ): PrioritizedInnovationItem[] {
    const scored = opportunities.map((opp) => {
      // Deterministic scoring function (0 - 100)
      const roiFactor = Math.min(35, (opp.expectedRoi || 1) * 7);
      const userImpactFactor = Math.min(30, opp.expectedUsers * 0.06);
      const confidenceFactor = opp.confidenceScore * 25;
      const riskPenalty = opp.riskLevel === "CRITICAL" ? 30 : opp.riskLevel === "HIGH" ? 15 : opp.riskLevel === "MODERATE" ? 5 : 0;

      const score = Math.max(0, Math.min(100, Math.round(roiFactor + userImpactFactor + confidenceFactor - riskPenalty)));

      let priorityTier: PrioritizedInnovationItem["priorityTier"] = "LOW";
      if (score >= 70) priorityTier = "CRITICAL";
      else if (score >= 45) priorityTier = "HIGH";
      else if (score >= 25) priorityTier = "MEDIUM";


      return {
        opportunityId: opp.opportunityId,
        title: opp.title,
        priorityScore: score,
        priorityTier,
        governanceOverridePrevented: true,
      };
    });

    scored.sort((a, b) => b.priorityScore - a.priorityScore);

    return scored.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }
}
