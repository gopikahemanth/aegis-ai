/**
 * EnterpriseScenarioOptimizer
 *
 * Compares and ranks alternative strategic scenarios against multi-objective criteria.
 * Invariant: SCENARIO OPTIMIZATION != AUTHORIZATION.
 */

export interface ScenarioRankingItem {
  scenarioName: string;
  expectedValueScore: number;
  riskScore: number;
  costImpactINR: number;
  isRecommended: boolean;
}

export class EnterpriseScenarioOptimizer {
  public static rankScenarios(scenarios: ScenarioRankingItem[]): ScenarioRankingItem[] {
    const sorted = [...scenarios].sort((a, b) => b.expectedValueScore - a.expectedValueScore);
    return sorted.map((s, idx) => ({
      ...s,
      isRecommended: idx === 0,
    }));
  }
}
