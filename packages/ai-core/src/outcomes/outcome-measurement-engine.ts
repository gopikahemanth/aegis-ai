/**
 * OutcomeMeasurementEngine
 *
 * Compares target business outcomes against observed production telemetry.
 * Non-negotiable principle: Deployment success != Business outcome success.
 */

import type { BusinessOutcome } from "./outcome-definition.js";

export interface OutcomeMeasurementReport {
  outcomeId: string;
  baseline: number;
  target: number;
  actualObserved: number;
  achievementPercentage: number;
  status: BusinessOutcome["status"];
  summary: string;
}

export class OutcomeMeasurementEngine {
  public static evaluateOutcome(outcome: BusinessOutcome, observedActual: number): OutcomeMeasurementReport {
    const totalDelta = outcome.targetValue - outcome.baselineValue;
    const achievedDelta = observedActual - outcome.baselineValue;
    const achievementPercentage = totalDelta === 0 ? 100 : Math.min(100, Math.max(0, (achievedDelta / totalDelta) * 100));

    let status: BusinessOutcome["status"] = "ON_TRACK";
    if (achievementPercentage >= 100) {
      status = "ACHIEVED";
    } else if (achievementPercentage >= 75) {
      status = "ON_TRACK";
    } else if (achievementPercentage >= 40) {
      status = "AT_RISK";
    } else {
      status = "OFF_TRACK";
    }

    return {
      outcomeId: outcome.outcomeId,
      baseline: outcome.baselineValue,
      target: outcome.targetValue,
      actualObserved: observedActual,
      achievementPercentage: Math.round(achievementPercentage),
      status,
      summary: `Outcome "${outcome.name}": Actual ${observedActual} ${outcome.measurementUnit} (${Math.round(achievementPercentage)}% of target). Status: ${status}.`,
    };
  }
}
