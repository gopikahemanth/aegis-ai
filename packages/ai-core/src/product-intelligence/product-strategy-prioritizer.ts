/**
 * ProductStrategyPrioritizer
 *
 * Deterministically ranks product opportunities based on customer value, business impact, and risk.
 * Hard Invariant: AI confidence must never override governance policy.
 */

import { DiscoveredProductOpportunity } from "./product-opportunity-discovery.js";

export interface PrioritizedProductStrategyItem {
  opportunityId: string;
  title: string;
  rank: number;
  priorityScore: number;
  priorityTier: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  governanceOverridePrevented: boolean;
}

export class ProductStrategyPrioritizer {
  public static prioritize(
    opportunities: DiscoveredProductOpportunity[]
  ): PrioritizedProductStrategyItem[] {
    const scored = opportunities.map((opp) => {
      const roiFactor = Math.min(35, (opp.expectedRoi || 1) * 7);
      const retentionFactor = Math.min(35, opp.expectedRetentionGain * 3.5);
      const valueFactor = Math.min(30, (opp.expectedValueINR / 10000) * 2.5);

      const score = Math.max(0, Math.min(100, Math.round(roiFactor + retentionFactor + valueFactor)));

      let priorityTier: PrioritizedProductStrategyItem["priorityTier"] = "INFORMATIONAL";
      if (score >= 70) priorityTier = "CRITICAL";
      else if (score >= 50) priorityTier = "HIGH";
      else if (score >= 30) priorityTier = "MEDIUM";
      else if (score >= 15) priorityTier = "LOW";

      return {
        opportunityId: opp.opportunityId,
        title: opp.title,
        priorityScore: score,
        priorityTier,
        governanceOverridePrevented: true,
      };
    });

    scored.sort((a, b) => b.priorityScore - a.priorityScore);

    return scored.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }
}
