/**
 * ProductOpportunityDiscoveryEngine
 *
 * Converts validated customer insights and market signals into governed product opportunities.
 * Hard Invariant: INSIGHT != OPPORTUNITY.
 */

export type ProductDiscoveryState =
  | "DISCOVERED"
  | "QUALIFYING"
  | "QUALIFIED"
  | "ANALYZING"
  | "PROPOSED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PLANNED"
  | "REJECTED";

export interface DiscoveredProductOpportunity {
  opportunityId: string;
  projectId: string;
  sourceInsightId: string;
  title: string;
  targetUserGroup: string;
  expectedRetentionGain: number;
  expectedValueINR: number;
  costINR: number;
  expectedRoi: number;
  status: ProductDiscoveryState;
  createdAt: string;
  updatedAt: string;
}

export class ProductOpportunityDiscoveryEngine {
  private static opportunities: Map<string, DiscoveredProductOpportunity> = new Map();

  public static discoverOpportunity(
    record: Omit<DiscoveredProductOpportunity, "opportunityId" | "expectedRoi" | "status" | "createdAt" | "updatedAt">
  ): DiscoveredProductOpportunity {
    if (!record.sourceInsightId) {
      throw new Error("PROVENANCE_REQUIRED: Product opportunity must be tied to a verified customer insight.");
    }

    const opportunityId = `p_opp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const expectedRoi = record.costINR > 0 ? Number((record.expectedValueINR / record.costINR).toFixed(2)) : 5;

    const fullRecord: DiscoveredProductOpportunity = {
      ...record,
      opportunityId,
      expectedRoi,
      status: "DISCOVERED",
      createdAt: now,
      updatedAt: now,
    };

    this.opportunities.set(opportunityId, fullRecord);
    return fullRecord;
  }

  public static transitionState(
    opportunityId: string,
    newState: ProductDiscoveryState
  ): DiscoveredProductOpportunity {
    const opp = this.opportunities.get(opportunityId);
    if (!opp) throw new Error(`Product opportunity ${opportunityId} not found.`);

    opp.status = newState;
    opp.updatedAt = new Date().toISOString();
    this.opportunities.set(opportunityId, opp);
    return opp;
  }

  public static getOpportunity(opportunityId: string): DiscoveredProductOpportunity | undefined {
    return this.opportunities.get(opportunityId);
  }

  public static reset(): void {
    this.opportunities.clear();
  }
}
