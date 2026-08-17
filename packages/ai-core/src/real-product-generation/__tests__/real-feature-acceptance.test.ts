import { describe, it, expect } from "vitest";
import { RealFeatureAcceptanceEngine } from "../real-feature-acceptance.js";

describe("AEGIS Phase 52 — Real Feature Acceptance Engine", () => {
  it("accepts features only when all 6 layers pass: SOURCE + API + DB + RUNTIME + BROWSER + WORKFLOW", () => {
    const features = [
      { id: "f1", name: "Authentication", isCritical: true },
      { id: "f2", name: "Member Management", isCritical: true },
    ];
    const report = RealFeatureAcceptanceEngine.evaluateAll(features, true, true);
    expect(report.isAllCriticalAccepted).toBe(true);
    expect(report.fullyAccepted).toBe(2);
    expect(report.results.every((r) => r.isFullyAccepted)).toBe(true);
  });

  it("blocks acceptance if any layer fails — enforcing UI PASS != FULL-STACK FEATURE SUCCESS", () => {
    const features = [
      { id: "f1", name: "Auth", isCritical: true },
      { id: "f2", name: "Payments", isCritical: true },
    ];
    const report = RealFeatureAcceptanceEngine.evaluateAll(features, true, true, "f2");
    expect(report.isAllCriticalAccepted).toBe(false);
    expect(report.blocked).toBe(1);
    const payment = report.results.find((r) => r.featureId === "f2");
    expect(payment?.isFullyAccepted).toBe(false);
    expect(payment?.blockedBy.length).toBeGreaterThan(0);
  });
});
