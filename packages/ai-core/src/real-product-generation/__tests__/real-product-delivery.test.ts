import { describe, it, expect } from "vitest";
import { RealProductDeliveryEngine } from "../real-product-delivery-engine.js";
import { RealProductAcceptanceEngine } from "../real-product-acceptance.js";
import { RealIntegrationProvisioner } from "../real-integration-provisioner.js";

describe("AEGIS Phase 52 — Real Product Delivery Engine", () => {
  it("generates a delivery manifest with real execution evidence and configuration requirements", () => {
    const acceptance = RealProductAcceptanceEngine.evaluate({
      requirementsCoverage: 100, criticalFeaturesPassed: true, criticalWorkflowsPassed: true,
      databaseVerified: true, backendVerified: true, frontendVerified: true,
      authenticationVerified: true, authorizationVerified: true, uiUxPassed: true,
      responsivePassed: true, accessibilityPassed: true, criticalDefectCount: 0,
    });
    const integrations = RealIntegrationProvisioner.classify(["payments", "email"]);
    const manifest = RealProductDeliveryEngine.createManifest("AegisGymPro", "/tmp/aegis-gym-pro", acceptance, integrations);

    expect(manifest.status).toBe("ACCEPTED");
    expect(manifest.buildVerified).toBe(true);
    expect(manifest.databaseVerified).toBe(true);
    expect(manifest.featureCompleteness).toBe(100);
    expect(manifest.criticalDefects).toBe(0);
    expect(manifest.configurationRequired.length).toBeGreaterThan(0);
    expect(manifest.configurationRequired.some((c) => c.requiredByService === "Stripe")).toBe(true);
    expect(manifest.startupCommand).toContain("npm run dev");
  });
});
