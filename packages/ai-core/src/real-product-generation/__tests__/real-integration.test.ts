import { describe, it, expect } from "vitest";
import { RealIntegrationProvisioner } from "../real-integration-provisioner.js";

describe("AEGIS Phase 52 — Real Integration Provisioner", () => {
  it("classifies integrations honestly — never claims operational without real credentials", () => {
    const contracts = RealIntegrationProvisioner.classify(["payments", "email", "analytics"]);
    expect(contracts.length).toBe(3);

    const stripe = contracts.find((c) => c.serviceName === "Stripe");
    expect(stripe).toBeDefined();
    expect(stripe?.state).toBe("CONFIGURATION_REQUIRED");
    expect(stripe?.requiredEnvVars).toContain("STRIPE_SECRET_KEY");

    const resend = contracts.find((c) => c.serviceName === "Resend");
    expect(resend?.state).toBe("CONFIGURATION_REQUIRED");

    const analytics = contracts.find((c) => c.category === "ANALYTICS");
    expect(analytics?.state).toBe("OPTIONAL");
  });
});
