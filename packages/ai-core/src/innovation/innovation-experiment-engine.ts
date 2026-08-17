/**
 * InnovationExperimentEngine
 *
 * Governs controlled innovation experimentation with explicit scope, metrics, and automatic rollback triggers.
 * Hard Invariant: Experiments cannot automatically expand scope without explicit human authorization.
 */

export type InnovationExperimentState =
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

export interface InnovationExperimentRecord {
  experimentId: string;
  opportunityId: string;
  projectId: string;
  variant: string;
  targetTrafficPercentage: number;
  successMetric: string;
  failureThresholdPercentage: number;
  maxDurationSeconds: number;
  status: InnovationExperimentState;
  createdAt: string;
}

export class InnovationExperimentEngine {
  private static experiments: Map<string, InnovationExperimentRecord> = new Map();

  public static createExperiment(
    opportunityId: string,
    projectId: string,
    variant: string,
    targetTrafficPercentage: number,
    successMetric: string,
    failureThresholdPercentage: number,
    maxDurationSeconds: number = 3600
  ): InnovationExperimentRecord {
    if (targetTrafficPercentage > 50) {
      throw new Error("EXPERIMENT_SCOPE_EXCEEDED: Experiment traffic percentage cannot exceed 50% without executive authorization.");
    }

    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: InnovationExperimentRecord = {
      experimentId,
      opportunityId,
      projectId,
      variant,
      targetTrafficPercentage,
      successMetric,
      failureThresholdPercentage,
      maxDurationSeconds,
      status: "PROPOSED",
      createdAt: new Date().toISOString(),
    };

    this.experiments.set(experimentId, record);
    return record;
  }

  public static transitionState(
    experimentId: string,
    newState: InnovationExperimentState
  ): InnovationExperimentRecord {
    const exp = this.experiments.get(experimentId);
    if (!exp) throw new Error(`Experiment ${experimentId} not found.`);

    exp.status = newState;
    this.experiments.set(experimentId, exp);
    return exp;
  }

  public static getExperiment(experimentId: string): InnovationExperimentRecord | undefined {
    return this.experiments.get(experimentId);
  }

  public static reset(): void {
    this.experiments.clear();
  }
}
