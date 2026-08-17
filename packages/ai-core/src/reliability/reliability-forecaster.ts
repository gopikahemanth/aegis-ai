/**
 * ReliabilityForecaster
 *
 * Forecasts future SLO breach likelihood, error budget exhaustion trajectories,
 * and capacity strain based on historical burn rates.
 */

export interface ReliabilityForecast {
  projectId: string;
  forecastWindowHours: number;
  sloBreachRisk: "LOW" | "MEDIUM" | "HIGH";
  estimatedErrorBudgetBurnRate: number; // % per day
  capacityRisk: "NOMINAL" | "WARNING" | "CRITICAL";
  incidentLikelihoodPercent: number;
  recommendation: string;
}

export class ReliabilityForecaster {
  /**
   * Forecast reliability trends for next N hours.
   */
  public static forecast(
    projectId: string,
    currentErrorBudget: number = 95,
    recentIncidentsCount: number = 0
  ): ReliabilityForecast {
    let breachRisk: ReliabilityForecast["sloBreachRisk"] = "LOW";
    let incidentLikelihood = 5;

    if (currentErrorBudget < 50 || recentIncidentsCount > 2) {
      breachRisk = "HIGH";
      incidentLikelihood = 80;
    } else if (currentErrorBudget < 80 || recentIncidentsCount > 0) {
      breachRisk = "MEDIUM";
      incidentLikelihood = 35;
    }

    return {
      projectId,
      forecastWindowHours: 24,
      sloBreachRisk: breachRisk,
      estimatedErrorBudgetBurnRate: recentIncidentsCount * 12.5,
      capacityRisk: breachRisk === "HIGH" ? "WARNING" : "NOMINAL",
      incidentLikelihoodPercent: incidentLikelihood,
      recommendation:
        breachRisk === "HIGH"
          ? "High breach risk: Hold non-critical deployments and scale backend worker pools."
          : "Nominal forecast. Continue standard deployments.",
    };
  }
}
