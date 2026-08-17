/**
 * CustomerExpansionEngine
 *
 * Identifies evidence-backed customer expansion and upgrade opportunities.
 * Hard Invariant: EXPANSION OPPORTUNITY != CUSTOMER DECISION.
 */

export type CustomerExpansionType =
  | "FEATURE_EXPANSION"
  | "WORKFLOW_EXPANSION"
  | "USAGE_EXPANSION"
  | "PRODUCT_EXPANSION"
  | "CAPACITY_EXPANSION";

export interface CustomerExpansionOpportunity {
  opportunityId: string;
  customerId: string;
  projectId: string;
  expansionType: CustomerExpansionType;
  title: string;
  expectedAnnualValueINR: number;
  readinessScore: number; // 0 to 1
  evidenceSummary: string;
  discoveredAt: string;
}

export class CustomerExpansionEngine {
  public static discoverExpansion(
    customerId: string,
    projectId: string,
    healthScore: number,
    adoptionRatePct: number,
    activeUsersCount: number
  ): CustomerExpansionOpportunity[] {
    const opps: CustomerExpansionOpportunity[] = [];
    const now = new Date().toISOString();

    if (healthScore >= 80 && adoptionRatePct >= 85) {
      opps.push({
        opportunityId: `exp_opp_${Date.now()}_tier`,
        customerId,
        projectId,
        expansionType: "PRODUCT_EXPANSION",
        title: "Enterprise Multi-Branch Franchise Hub Upgrade",
        expectedAnnualValueINR: 240000,
        readinessScore: 0.94,
        evidenceSummary: `Customer exhibits strong health (${healthScore}/100) and ${adoptionRatePct}% feature adoption.`,
        discoveredAt: now,
      });
    }

    if (activeUsersCount >= 200) {
      opps.push({
        opportunityId: `exp_opp_${Date.now()}_cap`,
        customerId,
        projectId,
        expansionType: "CAPACITY_EXPANSION",
        title: "High-Throughput Attendance Processing Tier",
        expectedAnnualValueINR: 80000,
        readinessScore: 0.89,
        evidenceSummary: `Customer actively exceeds 200 daily member check-ins.`,
        discoveredAt: now,
      });
    }

    return opps;
  }
}
