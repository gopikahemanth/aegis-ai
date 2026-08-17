/**
 * ProductionHealthMonitor
 *
 * Continuously collects health signals and maintains time-series observation history.
 * Tracks HTTP health, response times, 5xx/4xx errors, DB latency, CPU/memory, DNS, and TLS.
 */

import { UnifiedProductionState, ProductionStateEngine } from "./production-state-engine.js";

export interface HealthObservation {
  id: string;
  timestamp: string;
  state: UnifiedProductionState;
  sampleCount: number;
}

export class ProductionHealthMonitor {
  private static observations: HealthObservation[] = [];
  private static readonly MAX_HISTORY = 50;

  public static collectSignal(state?: UnifiedProductionState): HealthObservation {
    const currentState = state || ProductionStateEngine.captureState();
    const observation: HealthObservation = {
      id: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      state: currentState,
      sampleCount: this.observations.length + 1,
    };

    this.observations.push(observation);
    if (this.observations.length > this.MAX_HISTORY) {
      this.observations.shift();
    }

    return observation;
  }

  public static getHistory(): HealthObservation[] {
    return [...this.observations];
  }

  public static getLatest(): HealthObservation | undefined {
    return this.observations[this.observations.length - 1];
  }

  public static resetHistory(): void {
    this.observations = [];
  }
}
