import { describe, it, expect } from "vitest";
import { MarketSignalEngine } from "../market-signal-engine.js";

describe("AEGIS Phase 37 — Market Signal Engine", () => {
  it("captures market signals and tags predictions explicitly as FORECAST", () => {
    const sig = MarketSignalEngine.evaluateMarketSignal(
      "MARKET_TREND",
      "Rise in Mobile Self-Service Gym Check-in",
      "Industry Telemetry Report 2026",
      0.9
    );

    expect(sig.signalId).toBeDefined();
    expect(sig.type).toBe("MARKET_TREND");
    expect(sig.isForecast).toBe(true);
  });
});
