/**
 * MarketSignalEngine
 *
 * Captures and evaluates market, industry, and external competitive signals.
 * Hard Invariant: External market predictions are classified as FORECAST, never verified facts.
 */

export type MarketSignalType =
  | "MARKET_TREND"
  | "COMPETITIVE_PRESSURE"
  | "TECHNOLOGY_SHIFT"
  | "CUSTOMER_EXPECTATION"
  | "INDUSTRY_CHANGE"
  | "REGULATORY_SIGNAL";

export interface MarketSignalRecord {
  signalId: string;
  type: MarketSignalType;
  title: string;
  source: string;
  confidence: number;
  isForecast: boolean;
  observedAt: string;
}

export class MarketSignalEngine {
  public static evaluateMarketSignal(
    type: MarketSignalType,
    title: string,
    source: string,
    confidence: number = 0.85
  ): MarketSignalRecord {
    return {
      signalId: `mkt_sig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      source,
      confidence,
      isForecast: true,
      observedAt: new Date().toISOString(),
    };
  }
}
