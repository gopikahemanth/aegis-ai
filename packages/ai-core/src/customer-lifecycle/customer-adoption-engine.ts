/**
 * CustomerAdoptionEngine
 *
 * Measures customer feature breadth, usage frequency, and adoption trends.
 */

export type CustomerAdoptionVelocity =
  | "RAPIDLY_INCREASING"
  | "INCREASING"
  | "STABLE"
  | "DECLINING"
  | "SEVERELY_DECLINING"
  | "INSUFFICIENT_EVIDENCE";

export interface CustomerAdoptionReport {
  customerId: string;
  projectId: string;
  featuresUsedCount: number;
  totalAvailableFeaturesCount: number;
  adoptionPercentage: number;
  weeklyUsageFrequency: number;
  velocity: CustomerAdoptionVelocity;
  summary: string;
}

export class CustomerAdoptionEngine {
  public static evaluateAdoption(
    customerId: string,
    projectId: string,
    featuresUsed: number,
    totalFeatures: number = 10,
    weeklyFrequency: number = 25,
    growthRate: number = 0.2
  ): CustomerAdoptionReport {
    const adoptionPct = totalFeatures > 0 ? Math.round((featuresUsed / totalFeatures) * 100) : 0;
    let velocity: CustomerAdoptionVelocity = "STABLE";

    if (growthRate > 0.3) {
      velocity = "RAPIDLY_INCREASING";
    } else if (growthRate > 0.05) {
      velocity = "INCREASING";
    } else if (growthRate < -0.3) {
      velocity = "SEVERELY_DECLINING";
    } else if (growthRate < -0.05) {
      velocity = "DECLINING";
    }

    return {
      customerId,
      projectId,
      featuresUsedCount: featuresUsed,
      totalAvailableFeaturesCount: totalFeatures,
      adoptionPercentage: adoptionPct,
      weeklyUsageFrequency: weeklyFrequency,
      velocity,
      summary: `Customer ${customerId} adoption is ${velocity} (${adoptionPct}% feature adoption, ${weeklyFrequency} sessions/wk).`,
    };
  }
}
