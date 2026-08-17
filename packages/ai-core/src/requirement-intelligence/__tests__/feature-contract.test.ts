import { describe, it, expect } from "vitest";
import { FeatureContractEngine } from "../feature-contract-engine.js";
import { RoadmapItem } from "../roadmap-planning-engine.js";

describe("AEGIS Phase 61 — Feature Contract Engine", () => {
  it("creates binding feature contract with explicit security constraints and acceptance criteria", () => {
    const item: RoadmapItem = {
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
    };

    const contract = FeatureContractEngine.createContract(item);
    expect(contract.targetRoles).toContain("MANAGER");
    expect(contract.securityConstraints.length).toBeGreaterThanOrEqual(2);
    expect(contract.acceptanceCriteria.functional.length).toBeGreaterThanOrEqual(1);
    expect(contract.acceptanceCriteria.security.length).toBeGreaterThanOrEqual(1);
    expect(contract.acceptanceCriteria.workflow.length).toBeGreaterThanOrEqual(1);
  });
});
