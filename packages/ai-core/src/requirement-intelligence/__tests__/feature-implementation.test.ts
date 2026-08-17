import { describe, it, expect } from "vitest";
import { FeatureImplementationEngine } from "../feature-implementation-engine.js";
import { FeatureContractEngine } from "../feature-contract-engine.js";
import { FeatureAuthorizationEngine } from "../feature-authorization-engine.js";

describe("AEGIS Phase 61 — Feature Implementation Engine", () => {
  const contract = FeatureContractEngine.createContract({
    id: "rdm_req-061",
    requirementId: "REQ-061",
    title: "Authorized Member Data Bulk Export",
    quarter: "Q1",
    priority: "P1_HIGH",
    dependencies: [],
    status: "PLANNED",
    expectedImpact: "Saves 4 hours/week",
    estimatedComplexity: "LOW",
    authorizationStatus: "AWAITING_AUTHORIZATION",
  });

  it("implements feature across backend, frontend, and tests when authorized", async () => {
    const auth = FeatureAuthorizationEngine.evaluateAuthorization(contract, {
      userExplicitlyApproved: true,
    });
    const result = await FeatureImplementationEngine.implementFeature(contract, auth);

    expect(result.isImplemented).toBe(true);
    expect(result.generatedFiles.length).toBeGreaterThanOrEqual(4);
    expect(result.apiEndpointsCreated).toContain("GET /api/members/export");
    expect(result.buildPassed).toBe(true);
  });

  it("throws when attempting to implement without authorization", async () => {
    const auth = FeatureAuthorizationEngine.evaluateAuthorization(contract, {
      userExplicitlyApproved: false,
    });
    await expect(FeatureImplementationEngine.implementFeature(contract, auth)).rejects.toThrow("Authorization is not granted");
  });
});
