/**
 * TechnicalDebtForecastEngine
 *
 * Forecasts long-term technical debt growth across 30d, 90d, and 12m horizons.
 * Strictly labels predictions as FORECAST to prevent confusing predictions with verified runtime evidence.
 */

export interface TechnicalDebtForecast {
  projectId: string;
  observedCurrentDebtScore: number;
  forecast30Days: number;
  forecast90Days: number;
  forecast12Months: number;
  trajectory: "IMPROVING" | "STABLE" | "ACCELERATING";
  classification: "FORECAST"; // Always strictly labeled as FORECAST
}

export class TechnicalDebtForecastEngine {
  public static forecast(projectId: string, currentScore: number, trendDelta: number = 0): TechnicalDebtForecast {
    const forecast30 = Math.max(0, currentScore + trendDelta);
    const forecast90 = Math.max(0, currentScore + trendDelta * 3);
    const forecast12m = Math.max(0, currentScore + trendDelta * 12);

    const trajectory = trendDelta > 5 ? "ACCELERATING" : trendDelta < -2 ? "IMPROVING" : "STABLE";

    return {
      projectId,
      observedCurrentDebtScore: currentScore,
      forecast30Days: forecast30,
      forecast90Days: forecast90,
      forecast12Months: forecast12m,
      trajectory,
      classification: "FORECAST",
    };
  }
}
