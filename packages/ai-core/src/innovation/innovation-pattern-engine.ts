/**
 * InnovationPatternEngine
 *
 * Discovers systemic product patterns, recurring customer demands, and adoption trends.
 */

export type InnovationPatternType =
  | "REPEATED_PRODUCT_GAP"
  | "REPEATED_CUSTOMER_REQUEST"
  | "REPEATED_FAILED_EXPERIMENT"
  | "REPEATED_SUCCESSFUL_PATTERN"
  | "REPEATED_ARCHITECTURAL_BLOCKER"
  | "REPEATED_SECURITY_CONSTRAINT"
  | "REPEATED_RELIABILITY_CONSTRAINT"
  | "REPEATED_COST_BARRIER"
  | "REPEATED_ADOPTION_FAILURE"
  | "REPEATED_MANUAL_PROCESS";

export interface InnovationPatternFinding {
  patternId: string;
  patternType: InnovationPatternType;
  productArea: string;
  frequency: number;
  strategicSeverity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recommendation: string;
}

export class InnovationPatternEngine {
  public static detectPatterns(
    productArea: string,
    customerRequestsCount: number,
    failedExperimentsCount: number
  ): InnovationPatternFinding {
    if (failedExperimentsCount >= 2) {
      return {
        patternId: `pat_${Date.now()}_fail`,
        patternType: "REPEATED_FAILED_EXPERIMENT",
        productArea,
        frequency: failedExperimentsCount,
        strategicSeverity: "HIGH",
        recommendation: `Area ${productArea} has ${failedExperimentsCount} failed experiments. Re-evaluate customer problem validation before further implementations.`,
      };
    }

    if (customerRequestsCount >= 5) {
      return {
        patternId: `pat_${Date.now()}_demand`,
        patternType: "REPEATED_CUSTOMER_REQUEST",
        productArea,
        frequency: customerRequestsCount,
        strategicSeverity: "HIGH",
        recommendation: `Area ${productArea} shows strong customer demand (${customerRequestsCount} requests). Prioritize in NOW horizon roadmap.`,
      };
    }

    return {
      patternId: `pat_${Date.now()}_success`,
      patternType: "REPEATED_SUCCESSFUL_PATTERN",
      productArea,
      frequency: 1,
      strategicSeverity: "LOW",
      recommendation: `Area ${productArea} is performing steadily.`,
    };
  }
}
