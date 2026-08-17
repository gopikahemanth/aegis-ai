/**
 * InnovationRolloutEngine
 *
 * Manages phased, staged production rollout of authorized engineering innovations:
 * PREVIEW -> STAGING -> CANARY -> LIMITED -> BROAD -> FULL
 */

export type InnovationRolloutStage =
  | "PREVIEW"
  | "STAGING"
  | "CANARY"
  | "LIMITED"
  | "BROAD"
  | "FULL";

export interface InnovationRolloutPlan {
  rolloutId: string;
  experimentId: string;
  currentStage: InnovationRolloutStage;
  trafficPercentage: number;
  healthChecksPassed: boolean;
  rollbackReadiness: boolean;
  updatedAt: string;
  summary: string;
}

export class InnovationRolloutEngine {
  private static rollouts: Map<string, InnovationRolloutPlan> = new Map();

  public static initializeRollout(experimentId: string): InnovationRolloutPlan {
    const rolloutId = `rollout_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const plan: InnovationRolloutPlan = {
      rolloutId,
      experimentId,
      currentStage: "PREVIEW",
      trafficPercentage: 0,
      healthChecksPassed: true,
      rollbackReadiness: true,
      updatedAt: new Date().toISOString(),
      summary: `Innovation rollout ${rolloutId} initialized in PREVIEW stage.`,
    };
    this.rollouts.set(rolloutId, plan);
    return plan;
  }

  public static advanceStage(
    rolloutId: string,
    targetStage: InnovationRolloutStage
  ): InnovationRolloutPlan {
    const r = this.rollouts.get(rolloutId);
    if (!r) throw new Error(`Innovation rollout ${rolloutId} not found.`);

    r.currentStage = targetStage;
    switch (targetStage) {
      case "PREVIEW":
        r.trafficPercentage = 0;
        break;
      case "STAGING":
        r.trafficPercentage = 5;
        break;
      case "CANARY":
        r.trafficPercentage = 15;
        break;
      case "LIMITED":
        r.trafficPercentage = 50;
        break;
      case "BROAD":
        r.trafficPercentage = 80;
        break;
      case "FULL":
        r.trafficPercentage = 100;
        break;
    }
    r.updatedAt = new Date().toISOString();
    r.summary = `Innovation rollout advanced to ${targetStage} (${r.trafficPercentage}% traffic).`;
    this.rollouts.set(rolloutId, r);
    return r;
  }

  public static getRollout(rolloutId: string): InnovationRolloutPlan | undefined {
    return this.rollouts.get(rolloutId);
  }

  public static reset(): void {
    this.rollouts.clear();
  }
}
