/**
 * EnterpriseActionPrioritizer
 *
 * Deterministically ranks knowledge-derived actions based on business, reliability, security, and blast radius metrics.
 */

export interface PrioritizedActionItem {
  actionId: string;
  title: string;
  businessImpactScore: number; // 0 to 100
  reliabilityImpactScore: number; // 0 to 100
  securityImpactScore: number; // 0 to 100
  riskScore: number; // 0 to 100
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  calculatedCompositeScore: number;
}

export class EnterpriseActionPrioritizer {
  public static rankActions(
    actions: Array<{ actionId: string; title: string; business: number; reliability: number; security: number; risk: number }>
  ): PrioritizedActionItem[] {
    const scored: PrioritizedActionItem[] = actions.map((a) => {
      // Deterministic scoring formula
      const score = a.business * 0.3 + a.reliability * 0.35 + a.security * 0.35 - a.risk * 0.2;
      let p: PrioritizedActionItem["priority"] = "LOW";
      if (score >= 70) p = "CRITICAL";
      else if (score >= 50) p = "HIGH";
      else if (score >= 30) p = "MEDIUM";

      return {
        actionId: a.actionId,
        title: a.title,
        businessImpactScore: a.business,
        reliabilityImpactScore: a.reliability,
        securityImpactScore: a.security,
        riskScore: a.risk,
        priority: p,
        calculatedCompositeScore: parseFloat(score.toFixed(2)),
      };
    });

    return scored.sort((a, b) => b.calculatedCompositeScore - a.calculatedCompositeScore);
  }
}
