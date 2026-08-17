/**
 * ProductOpportunityEngine
 *
 * Converts verified innovation signals into canonical product opportunities and tracks their full lifecycle:
 * DISCOVERED -> QUALIFYING -> QUALIFIED -> ANALYZING -> PROPOSED -> UNDER_REVIEW -> APPROVED -> PLANNED -> IMPLEMENTING -> VERIFYING -> REALIZED
 * Failure paths: REJECTED, BLOCKED, DEFERRED, ABANDONED
 */

export type ProductOpportunityState =
  | "DISCOVERED"
  | "QUALIFYING"
  | "QUALIFIED"
  | "ANALYZING"
  | "PROPOSED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PLANNED"
  | "IMPLEMENTING"
  | "VERIFYING"
  | "REALIZED"
  | "REJECTED"
  | "BLOCKED"
  | "DEFERRED"
  | "ABANDONED";

export interface ProductOpportunityRecord {
  opportunityId: string;
  projectId: string;
  organizationId: string;
  teamId: string;
  title: string;
  sourceSignalId: string;
  sourceEvidenceSummary: string;
  affectedProjects: string[];
  affectedTeams: string[];
  expectedUsers: number;
  expectedValueINR: number;
  estimatedCostINR: number;
  expectedRoi: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "BLOCKED";
  confidenceScore: number;
  authorizationRequired: boolean;
  status: ProductOpportunityState;
  createdAt: string;
  updatedAt: string;
}

export class ProductOpportunityEngine {
  private static opportunities: Map<string, ProductOpportunityRecord> = new Map();

  public static createOpportunity(
    record: Omit<ProductOpportunityRecord, "opportunityId" | "expectedRoi" | "status" | "createdAt" | "updatedAt">
  ): ProductOpportunityRecord {
    if (!record.sourceSignalId || !record.sourceEvidenceSummary) {
      throw new Error("INVALID_SIGNAL_PROVENANCE: Product opportunity must be anchored to verified innovation signal.");
    }

    const opportunityId = `prod_opp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const expectedRoi = record.estimatedCostINR > 0 ? Number((record.expectedValueINR / record.estimatedCostINR).toFixed(2)) : 5;

    const fullRecord: ProductOpportunityRecord = {
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
    newState: ProductOpportunityState
  ): ProductOpportunityRecord {
    const opp = this.opportunities.get(opportunityId);
    if (!opp) throw new Error(`Product opportunity ${opportunityId} not found.`);

    opp.status = newState;
    opp.updatedAt = new Date().toISOString();
    this.opportunities.set(opportunityId, opp);
    return opp;
  }

  public static getOpportunity(opportunityId: string): ProductOpportunityRecord | undefined {
    return this.opportunities.get(opportunityId);
  }

  public static listOpportunities(): ProductOpportunityRecord[] {
    return Array.from(this.opportunities.values());
  }

  public static reset(): void {
    this.opportunities.clear();
  }
}
