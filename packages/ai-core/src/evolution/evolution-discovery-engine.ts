/**
 * EvolutionDiscoveryEngine
 *
 * Discovers system improvement opportunities from operational evidence across AEGIS.
 * Hard Invariant: EVIDENCE != INSIGHT != RECOMMENDATION != DECISION != AUTHORIZATION.
 */

export type EvolutionOpportunityType =
  | "ARCHITECTURAL_IMPROVEMENT"
  | "RELIABILITY_IMPROVEMENT"
  | "SECURITY_IMPROVEMENT"
  | "PERFORMANCE_IMPROVEMENT"
  | "COST_IMPROVEMENT"
  | "DEVELOPER_PRODUCTIVITY"
  | "OPERATIONAL_AUTOMATION"
  | "TECHNICAL_DEBT_REDUCTION";

export interface DiscoveredOpportunity {
  discoveryId: string;
  projectId: string;
  type: EvolutionOpportunityType;
  title: string;
  sourceEvidenceType: string;
  description: string;
  confidenceScore: number;
}

export class EvolutionDiscoveryEngine {
  public static discoverOpportunities(
    projectId: string,
    incidentsCount: number,
    couplingScore: number,
    techDebtCount: number
  ): DiscoveredOpportunity[] {
    const opportunities: DiscoveredOpportunity[] = [];

    if (couplingScore > 50) {
      opportunities.push({
        discoveryId: `disc_${Date.now()}_arch`,
        projectId,
        type: "ARCHITECTURAL_IMPROVEMENT",
        title: "Decouple Gateway and Authentication Modules",
        sourceEvidenceType: "ARCHITECTURE_COUPLING_ANALYSIS",
        description: "High cross-module coupling detected. Recommending modular interface abstraction.",
        confidenceScore: 0.96,
      });
    }

    if (incidentsCount > 0) {
      opportunities.push({
        discoveryId: `disc_${Date.now()}_rel`,
        projectId,
        type: "RELIABILITY_IMPROVEMENT",
        title: "Enhance Circuit Breakers on Downstream Services",
        sourceEvidenceType: "HISTORICAL_INCIDENT_CORRELATION",
        description: "Downstream latency spikes triggered transient failures. Recommending adaptive circuit breaker.",
        confidenceScore: 0.94,
      });
    }

    if (techDebtCount > 3) {
      opportunities.push({
        discoveryId: `disc_${Date.now()}_td`,
        projectId,
        type: "TECHNICAL_DEBT_REDUCTION",
        title: "Standardize Shared Error Contracts",
        sourceEvidenceType: "STATIC_CONTRACT_ANALYSIS",
        description: "Multiple duplicate error handlers found. Recommending consolidated error schema.",
        confidenceScore: 0.92,
      });
    }

    return opportunities;
  }
}
