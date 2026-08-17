/**
 * PortfolioRebalancer
 *
 * Dynamically rebalances initiative horizons based on empirical outcome evidence
 * while guaranteeing that approved initiatives never disappear silently.
 */

import type { StrategicInitiative } from "../strategy/strategic-initiative.js";

export interface RebalancingProposal {
  proposalId: string;
  organizationId: string;
  rebalancedInitiatives: StrategicInitiative[];
  deprioritizedInitiatives: string[];
  acceleratedInitiatives: string[];
  requiresAuthorization: boolean;
}

export class PortfolioRebalancer {
  public static proposeRebalancing(
    organizationId: string,
    initiatives: StrategicInitiative[],
    urgencyOverrides: Map<string, "ACCELERATE" | "DEPRIORITIZE">
  ): RebalancingProposal {
    const deprioritized: string[] = [];
    const accelerated: string[] = [];

    const rebalanced = initiatives.map((init) => {
      const override = urgencyOverrides.get(init.initiativeId);
      if (override === "ACCELERATE") {
        accelerated.push(init.initiativeId);
        return { ...init, priorityClass: "CRITICAL" as const };
      }
      if (override === "DEPRIORITIZE") {
        deprioritized.push(init.initiativeId);
        return { ...init, priorityClass: "DEFER" as const };
      }
      return init;
    });

    return {
      proposalId: `prop_rebal_${Date.now()}`,
      organizationId,
      rebalancedInitiatives: rebalanced,
      deprioritizedInitiatives: deprioritized,
      acceleratedInitiatives: accelerated,
      requiresAuthorization: deprioritized.length > 0 || accelerated.length > 0,
    };
  }
}
