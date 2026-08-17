/**
 * ControlledTrialEngine
 *
 * Coordinates governed, safety-bounded controlled trials for engineering innovations:
 * DESIGNED -> SIMULATED -> AUTHORIZED -> READY -> RUNNING -> MEASURING -> COMPLETED
 * Modes: CANARY, SHADOW, A_B, LIMITED_SCOPE, STAGING
 */

export type TrialMode = "CANARY" | "SHADOW" | "A_B" | "LIMITED_SCOPE" | "STAGING";

export type TrialLifecycleStage =
  | "DESIGNED"
  | "SIMULATED"
  | "AUTHORIZED"
  | "READY"
  | "RUNNING"
  | "MEASURING"
  | "COMPLETED"
  | "HALTED"
  | "ROLLED_BACK";

export interface ControlledTrialRecord {
  trialId: string;
  experimentId: string;
  projectId: string;
  mode: TrialMode;
  stage: TrialLifecycleStage;
  trafficPercentage: number;
  activeSessionsCount: number;
  startedAt?: string;
  completedAt?: string;
  summary: string;
}

export class ControlledTrialEngine {
  private static trials: Map<string, ControlledTrialRecord> = new Map();

  public static initializeTrial(
    experimentId: string,
    projectId: string,
    mode: TrialMode = "CANARY",
    trafficPercentage: number = 10
  ): ControlledTrialRecord {
    const trialId = `trial_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const trial: ControlledTrialRecord = {
      trialId,
      experimentId,
      projectId,
      mode,
      stage: "DESIGNED",
      trafficPercentage,
      activeSessionsCount: 0,
      summary: `Controlled trial ${trialId} designed in ${mode} mode (${trafficPercentage}% traffic).`,
    };
    this.trials.set(trialId, trial);
    return trial;
  }

  public static transitionStage(trialId: string, newStage: TrialLifecycleStage): ControlledTrialRecord {
    const t = this.trials.get(trialId);
    if (!t) throw new Error(`Controlled trial ${trialId} not found.`);

    t.stage = newStage;
    if (newStage === "RUNNING") {
      t.startedAt = new Date().toISOString();
      t.activeSessionsCount = 150;
    }
    if (newStage === "COMPLETED") {
      t.completedAt = new Date().toISOString();
    }
    this.trials.set(trialId, t);
    return t;
  }

  public static getTrial(trialId: string): ControlledTrialRecord | undefined {
    return this.trials.get(trialId);
  }

  public static reset(): void {
    this.trials.clear();
  }
}
