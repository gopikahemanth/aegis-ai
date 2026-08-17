import { describe, it, expect } from "vitest";
import { ResilienceDegradationDetector } from "../resilience-degradation-detector.js";

describe("AEGIS Phase 29 — Resilience Degradation Detector", () => {
  it("detects gradual degradation and calculates remaining lead time", () => {
    const report = ResilienceDegradationDetector.evaluateDegradation("proj_core", 2.2, 75, 20);
    expect(report.status).toBe("DEGRADING");
    expect(report.leadTimeMinutes).toBe(45);
  });
});
