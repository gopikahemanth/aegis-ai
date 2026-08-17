/**
 * EvolutionOpportunityRegistry
 *
 * Canonical registry of enterprise system evolution opportunities and their lifecycle:
 * DISCOVERED -> ANALYZING -> QUALIFIED -> SIMULATED -> REVIEW_REQUIRED -> APPROVED -> PLANNED -> EXECUTING -> VERIFYING -> COMPLETED
 * Failure paths: REJECTED, BLOCKED, DEFERRED, FAILED, ROLLED_BACK
 */

import { EvolutionOpportunityType } from "./evolution-discovery-engine.js";

export type EvolutionOpportunityState =
  | "DISCOVERED"
  | "ANALYZING"
  | "QUALIFIED"
  | "SIMULATED"
  | "REVIEW_REQUIRED"
  | "APPROVED"
  | "PLANNED"
  | "EXECUTING"
  | "VERIFYING"
  | "COMPLETED"
  | "REJECTED"
  | "BLOCKED"
  | "DEFERRED"
  | "FAILED"
  | "ROLLED_BACK";

export interface EvolutionOpportunityRecord {
  opportunityId: string;
  organizationId: string;
  projectId: string;
  teamId: string;
  environment: string;
  type: EvolutionOpportunityType;
  title: string;
  sourceEvidence: string;
  affectedSystems: string[];
  expectedBenefit: string;
  estimatedCostINR: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "BLOCKED";
  confidenceScore: number;
  dependencies: string[];
  status: EvolutionOpportunityState;
  createdAt: string;
  updatedAt: string;
}

export class EvolutionOpportunityRegistry {
  private static opportunities: Map<string, EvolutionOpportunityRecord> = new Map();

  public static registerOpportunity(
    record: Omit<EvolutionOpportunityRecord, "opportunityId" | "createdAt" | "updatedAt" | "status">
  ): EvolutionOpportunityRecord {
    if (!record.sourceEvidence) {
      throw new Error("INVALID_EVIDENCE_PROVENANCE: Evolution opportunity must reference source evidence.");
    }

    const opportunityId = `opp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const fullRecord: EvolutionOpportunityRecord = {
      ...record,
      opportunityId,
      createdAt: now,
      updatedAt: now,
      status: "DISCOVERED",
    };

    this.opportunities.set(opportunityId, fullRecord);
    return fullRecord;
  }

  public static transitionState(
    opportunityId: string,
    newState: EvolutionOpportunityState
  ): EvolutionOpportunityRecord {
    const opp = this.opportunities.get(opportunityId);
    if (!opp) throw new Error(`Evolution opportunity ${opportunityId} not found.`);

    opp.status = newState;
    opp.updatedAt = new Date().toISOString();
    this.opportunities.set(opportunityId, opp);
    return opp;
  }

  public static getOpportunity(opportunityId: string): EvolutionOpportunityRecord | undefined {
    return this.opportunities.get(opportunityId);
  }

  public static listOpportunities(): EvolutionOpportunityRecord[] {
    return Array.from(this.opportunities.values());
  }

  public static reset(): void {
    this.opportunities.clear();
  }
}
