import { describe, it, expect } from "vitest";
import { FeatureAuthorizationEngine } from "../feature-authorization-engine.js";
import { FeatureContractEngine } from "../feature-contract-engine.js";

describe("AEGIS Phase 61 — Feature Authorization Engine", () => {
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

  it("permits implementation when user explicitly authorizes the feature contract", () => {
    const auth = FeatureAuthorizationEngine.evaluateAuthorization(contract, {
      userExplicitlyApproved: true,
    });
    expect(auth.decision).toBe("AUTHORIZED");
    expect(auth.isPermittedToImplement).toBe(true);
  });

  it("blocks implementation when security conflict is present", () => {
    const auth = FeatureAuthorizationEngine.evaluateAuthorization(contract, {
      isBlockedBySecurity: true,
    });
    expect(auth.decision).toBe("BLOCKED");
    expect(auth.isPermittedToImplement).toBe(false);
  });
});
