/**
 * CustomerHealthEngine
 *
 * Computes evidence-anchored composite customer health scores from adoption, engagement, reliability, and support metrics.
 * Hard Invariant: HEALTH SCORE != VERIFIED CUSTOMER OUTCOME.
 */

export type CustomerHealthStatus =
  | "HEALTHY"
  | "STABLE"
  | "WATCH"
  | "AT_RISK"
  | "CRITICAL"
  | "UNKNOWN";

export interface CustomerHealthScoreReport {
  customerId: string;
  projectId: string;
  healthScore: number; // 0 to 100
  status: CustomerHealthStatus;
  evidenceFactors: {
    adoptionScore: number;
    engagementScore: number;
    reliabilityScore: number;
    supportFrictionPenalty: number;
  };
  calculatedAt: string;
  summary: string;
}

export class CustomerHealthEngine {
  public static calculateHealth(
    customerId: string,
    projectId: string,
    adoptionRatePct: number,
    engagementScore: number,
    reliabilityUptimePct: number,
    supportIncidentsCount: number
  ): CustomerHealthScoreReport {
    const adoptionFactor = Math.min(35, (adoptionRatePct / 100) * 35);
    const engagementFactor = Math.min(35, engagementScore * 0.35);
    const reliabilityFactor = Math.min(30, (reliabilityUptimePct / 100) * 30);
    const supportPenalty = Math.min(25, supportIncidentsCount * 8);

    const score = Math.max(0, Math.min(100, Math.round(adoptionFactor + engagementFactor + reliabilityFactor - supportPenalty)));

    let status: CustomerHealthStatus = "UNKNOWN";
    if (score >= 80) status = "HEALTHY";
    else if (score >= 65) status = "STABLE";
    else if (score >= 50) status = "WATCH";
    else if (score >= 30) status = "AT_RISK";
    else status = "CRITICAL";

    return {
      customerId,
      projectId,
      healthScore: score,
      status,
      evidenceFactors: {
        adoptionScore: adoptionFactor,
        engagementScore: engagementFactor,
        reliabilityScore: reliabilityFactor,
        supportFrictionPenalty: supportPenalty,
      },
      calculatedAt: new Date().toISOString(),
      summary: `Customer ${customerId} composite health evaluated as ${status} (Score: ${score}/100).`,
    };
  }
}
