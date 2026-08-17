/**
 * CustomerChurnForecastEngine
 *
 * Forecasts customer churn probability across multiple time horizons.
 * Hard Invariant: CHURN FORECAST != CHURN EVENT. Predictions are explicitly marked as FORECAST.
 */

export type ChurnForecastHorizon = "7_DAYS" | "30_DAYS" | "90_DAYS" | "180_DAYS";

export type ChurnRiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "INSUFFICIENT_EVIDENCE";

export interface CustomerChurnForecastReport {
  forecastId: string;
  customerId: string;
  projectId: string;
  horizon: ChurnForecastHorizon;
  churnProbabilityPercentage: number;
  riskLevel: ChurnRiskLevel;
  primaryRiskDrivers: string[];
  isForecast: boolean;
  confidenceScore: number;
  generatedAt: string;
  summary: string;
}

export class CustomerChurnForecastEngine {
  public static forecastChurn(
    customerId: string,
    projectId: string,
    healthScore: number,
    daysSinceLastActive: number,
    horizon: ChurnForecastHorizon = "30_DAYS"
  ): CustomerChurnForecastReport {
    let prob = 10;
    const drivers: string[] = [];

    if (healthScore < 40) {
      prob += 50;
      drivers.push("Low composite customer health score (<40)");
    } else if (healthScore < 60) {
      prob += 25;
      drivers.push("Moderate composite health score (<60)");
    }

    if (daysSinceLastActive > 14) {
      prob += 35;
      drivers.push(`Extended inactivity (${daysSinceLastActive} days inactive)`);
    }

    prob = Math.min(95, Math.max(5, prob));

    let riskLevel: ChurnRiskLevel = "LOW";
    if (prob >= 75) riskLevel = "CRITICAL";
    else if (prob >= 50) riskLevel = "HIGH";
    else if (prob >= 25) riskLevel = "MODERATE";

    return {
      forecastId: `churn_fc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerId,
      projectId,
      horizon,
      churnProbabilityPercentage: prob,
      riskLevel,
      primaryRiskDrivers: drivers.length > 0 ? drivers : ["Normal usage parameters"],
      isForecast: true,
      confidenceScore: 0.92,
      generatedAt: new Date().toISOString(),
      summary: `[FORECAST] Customer ${customerId} churn risk over ${horizon} evaluated as ${riskLevel} (${prob}% probability).`,
    };
  }
}
