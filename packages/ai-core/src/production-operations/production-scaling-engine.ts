/**
 * ProductionScalingEngine
 *
 * Predicts load and generates capacity recommendations.
 * Invariant: SCALING RECOMMENDATION ≠ SCALING AUTHORIZATION
 * Recommendations: NO_ACTION | SCALE_UP | SCALE_OUT | SCALE_DOWN | CAPACITY_REVIEW
 */

import { UnifiedProductionState } from "./production-state-engine.js";

export type ScalingRecommendationType =
  | "NO_ACTION"
  | "SCALE_UP"
  | "SCALE_OUT"
  | "SCALE_DOWN"
  | "CAPACITY_REVIEW";

export interface ScalingRecommendation {
  recommendationType: ScalingRecommendationType;
  resourceTarget: "COMPUTE_WORKERS" | "DATABASE_POOL" | "MEMORY_ALLOCATION" | "ALL";
  currentCapacity: string;
  recommendedCapacity: string;
  reason: string;
  requiresAuthorization: boolean;
  estimatedCostImpact: string;
  detail: string;
}

export class ProductionScalingEngine {
  public static evaluateScaling(state: UnifiedProductionState): ScalingRecommendation {
    const { cpuUsagePercentage, memoryUsageMb, requestRatePerSec } = state.metrics;

    if (cpuUsagePercentage > 85 || requestRatePerSec > 500) {
      return {
        recommendationType: "SCALE_OUT",
        resourceTarget: "COMPUTE_WORKERS",
        currentCapacity: "2 instances",
        recommendedCapacity: "4 instances",
        reason: `CPU utilization (${cpuUsagePercentage}%) exceeded 85% threshold under high request volume (${requestRatePerSec} req/sec)`,
        requiresAuthorization: true,
        estimatedCostImpact: "+$40/mo",
        detail: "Scale out API cluster by +2 workers to redistribute load",
      };
    }

    if (memoryUsageMb > 450) {
      return {
        recommendationType: "SCALE_UP",
        resourceTarget: "MEMORY_ALLOCATION",
        currentCapacity: "512 MB",
        recommendedCapacity: "1024 MB",
        reason: `Memory consumption (${memoryUsageMb} MB) approaching 512 MB limit`,
        requiresAuthorization: true,
        estimatedCostImpact: "+$15/mo",
        detail: "Upgrade worker memory tier to 1GB",
      };
    }

    if (cpuUsagePercentage < 10 && requestRatePerSec < 20) {
      return {
        recommendationType: "SCALE_DOWN",
        resourceTarget: "COMPUTE_WORKERS",
        currentCapacity: "4 instances",
        recommendedCapacity: "2 instances",
        reason: "Sustained idle workload detected across worker nodes",
        requiresAuthorization: true,
        estimatedCostImpact: "-$40/mo",
        detail: "Reduce cluster instances to optimize infrastructure cost",
      };
    }

    return {
      recommendationType: "NO_ACTION",
      resourceTarget: "ALL",
      currentCapacity: "2 instances (512MB)",
      recommendedCapacity: "2 instances (512MB)",
      reason: "Compute and memory utilization within nominal headroom (20-75%)",
      requiresAuthorization: false,
      estimatedCostImpact: "$0/mo",
      detail: "Capacity is optimal; no scaling action recommended",
    };
  }
}
