/**
 * BusinessOutcomeForecaster
 *
 * Forecasts strategic business outcome fulfillment.
 * Hard Invariant: DEPLOYMENT SUCCESS != BUSINESS OUTCOME SUCCESS.
 */

export interface OutcomeForecastReport {
  outcomeId: string;
  projectId: string;
  kpiTitle: string;
  achievementProbabilityPercentage: number;
  status: "LIKELY_ACHIEVED" | "AT_RISK" | "LIKELY_MISSED" | "INSUFFICIENT_EVIDENCE";
  projectedRealizationDays: number;
  classification: "FORECAST";
}

export class BusinessOutcomeForecaster {
  public static forecastOutcome(
    outcomeId: string,
    projectId: string,
    kpiTitle: string,
    probability: number,
    days: number
  ): OutcomeForecastReport {
    let status: OutcomeForecastReport["status"] = "LIKELY_ACHIEVED";
    if (probability < 50) status = "LIKELY_MISSED";
    else if (probability < 80) status = "AT_RISK";

    return {
      outcomeId,
      projectId,
      kpiTitle,
      achievementProbabilityPercentage: probability,
      status,
      projectedRealizationDays: days,
      classification: "FORECAST",
    };
  }
}
