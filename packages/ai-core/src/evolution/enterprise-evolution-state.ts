/**
 * EnterpriseEvolutionStateEngine
 *
 * Tracks authoritative enterprise evolution generations, proposal lifecycles, and failure restoration states:
 * OBSERVED -> OPPORTUNITY_IDENTIFIED -> PROPOSED -> ANALYZING -> SIMULATED -> AWAITING_AUTHORIZATION -> AUTHORIZED -> EXECUTING -> VERIFYING -> VERIFIED -> LEARNED
 * Failure path: EXECUTING -> FAILED -> ROLLBACK -> RESTORED
 */

export type EnterpriseEvolutionLifecycleStage =
  | "OBSERVED"
  | "OPPORTUNITY_IDENTIFIED"
  | "PROPOSED"
  | "ANALYZING"
  | "SIMULATED"
  | "AWAITING_AUTHORIZATION"
  | "AUTHORIZED"
  | "EXECUTING"
  | "VERIFYING"
  | "VERIFIED"
  | "LEARNED"
  | "FAILED"
  | "ROLLBACK"
  | "RESTORED";

export interface EnterpriseEvolutionRecord {
  evolutionId: string;
  projectId: string;
  tenantId: string;
  platformGeneration: number;
  enterpriseGeneration: number;
  stage: EnterpriseEvolutionLifecycleStage;
  governanceState: "HEALTHY" | "BLOCKED" | "ELEVATED_RISK";
  riskScore: number;
  createdAt: string;
  updatedAt: string;
}

export class EnterpriseEvolutionStateEngine {
  private static records: Map<string, EnterpriseEvolutionRecord> = new Map();

  public static initializeEvolution(
    evolutionId: string,
    projectId: string,
    tenantId: string,
    platformGen: number = 1,
    enterpriseGen: number = 1
  ): EnterpriseEvolutionRecord {
    const now = new Date().toISOString();
    const record: EnterpriseEvolutionRecord = {
      evolutionId,
      projectId,
      tenantId,
      platformGeneration: platformGen,
      enterpriseGeneration: enterpriseGen,
      stage: "OBSERVED",
      governanceState: "HEALTHY",
      riskScore: 10,
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(evolutionId, record);
    return record;
  }

  public static transitionStage(
    evolutionId: string,
    newStage: EnterpriseEvolutionLifecycleStage,
    governanceState?: "HEALTHY" | "BLOCKED" | "ELEVATED_RISK"
  ): EnterpriseEvolutionRecord {
    const rec = this.records.get(evolutionId);
    if (!rec) throw new Error(`Enterprise evolution ${evolutionId} not found.`);

    rec.stage = newStage;
    if (governanceState) rec.governanceState = governanceState;
    rec.updatedAt = new Date().toISOString();
    this.records.set(evolutionId, rec);
    return rec;
  }

  public static getRecord(evolutionId: string): EnterpriseEvolutionRecord | undefined {
    return this.records.get(evolutionId);
  }

  public static reset(): void {
    this.records.clear();
  }
}
