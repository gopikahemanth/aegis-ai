/**
 * BusinessImpactForecaster
 *
 * Forecasts potential business, customer, and economic exposure before incidents occur.
 * Invariant: Classified strictly as FORECAST.
 */

export interface BusinessImpactForecast {
  forecastId: string;
  projectId: string;
  affectedCustomersCount: number;
  projectedRevenueRiskINR: number;
  projectedDowntimeMinutes: number;
  classification: "FORECAST";
  summary: string;
}

export class BusinessImpactForecaster {
  public static forecastImpact(
    projectId: string,
    customers: number,
    downtimeMinutes: number
  ): BusinessImpactForecast {
    const revenueRisk = Math.round(customers * downtimeMinutes * 4.5);

    return {
      forecastId: `imp_fore_${Date.now()}`,
      projectId,
      affectedCustomersCount: customers,
      projectedRevenueRiskINR: revenueRisk,
      projectedDowntimeMinutes: downtimeMinutes,
      classification: "FORECAST",
      summary: `Forecast: ${customers} customers and ₹${revenueRisk} revenue at risk under ${downtimeMinutes}m unmitigated downtime.`,
    };
  }
}
