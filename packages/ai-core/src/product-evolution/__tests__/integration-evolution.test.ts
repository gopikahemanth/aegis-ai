import { describe, it, expect } from "vitest";
import { IntegrationEvolutionEngine } from "../integration-evolution-engine.js";

describe("AEGIS Phase 56 — Integration Evolution Engine", () => {
  it("configures and verifies Stripe and Resend external integrations", () => {
    const report = IntegrationEvolutionEngine.configureIntegrations();
    expect(report.isIntegrationReady).toBe(true);
    expect(report.verifiedCount).toBe(2);
    expect(report.integrations.some((i) => i.name.includes("Stripe"))).toBe(true);
  });

  it("handles missing Stripe credentials cleanly with CONFIGURATION_REQUIRED", () => {
    const report = IntegrationEvolutionEngine.configureIntegrations({ hasStripeKeys: false });
    expect(report.isIntegrationReady).toBe(true); // Non-fatal configuration requirement
    expect(report.configRequiredCount).toBe(1);
  });
});
