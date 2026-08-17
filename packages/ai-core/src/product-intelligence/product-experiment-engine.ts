/**
 * ProductExperimentEngine
 *
 * Governs controlled product feature experiments, canary releases, and telemetry verification.
 */

export type ProductExperimentStatus =
  | "PROPOSED"
  | "SIMULATED"
  | "AUTHORIZED"
  | "PREPARING"
  | "RUNNING"
  | "OBSERVING"
  | "VERIFYING"
  | "COMPLETED"
  | "ROLLED_BACK"
  | "FAILED";

export interface ProductExperimentConfig {
  experimentId: string;
  opportunityId: string;
  projectId: string;
  featureFlagKey: string;
  trafficPercentage: number;
  maxDurationHours: number;
  errorThresholdPercentage: number;
  status: ProductExperimentStatus;
  createdAt: string;
}

export class ProductExperimentEngine {
  private static experiments: Map<string, ProductExperimentConfig> = new Map();

  public static createExperiment(
    opportunityId: string,
    projectId: string,
    featureFlagKey: string,
    trafficPercentage: number,
    errorThresholdPercentage: number = 1.0,
    maxDurationHours: number = 24
  ): ProductExperimentConfig {
    if (trafficPercentage > 50) {
      throw new Error("TRAFFIC_LIMIT_EXCEEDED: Product experiment traffic allocation cannot exceed 50% without executive signoff.");
    }

    const experimentId = `pexp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const config: ProductExperimentConfig = {
      experimentId,
      opportunityId,
      projectId,
      featureFlagKey,
      trafficPercentage,
      maxDurationHours,
      errorThresholdPercentage,
      status: "PROPOSED",
      createdAt: new Date().toISOString(),
    };

    this.experiments.set(experimentId, config);
    return config;
  }

  public static transitionState(
    experimentId: string,
    newState: ProductExperimentStatus
  ): ProductExperimentConfig {
    const exp = this.experiments.get(experimentId);
    if (!exp) throw new Error(`Product experiment ${experimentId} not found.`);

    exp.status = newState;
    this.experiments.set(experimentId, exp);
    return exp;
  }

  public static getExperiment(experimentId: string): ProductExperimentConfig | undefined {
    return this.experiments.get(experimentId);
  }

  public static reset(): void {
    this.experiments.clear();
  }
}
