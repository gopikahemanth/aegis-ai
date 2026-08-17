import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RequirementIntelligenceGate } from "../requirement-intelligence-gate.js";
import { FeatureVerificationEngine } from "../feature-verification-engine.js";
import { FeatureContractEngine } from "../feature-contract-engine.js";
import { RoadmapImpactEngine } from "../roadmap-impact-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 61 — Tier 48 Requirement Intelligence Gate", () => {
  const tmpDir = path.join(os.tmpdir(), "aegis-tier48-test");

  beforeEach(() => {
    ProductCompletionLedger.reset();
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

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

  it("issues Tier 48 certificate when requirement is validated, authorized, verified, and measured", () => {
    const verification = FeatureVerificationEngine.verifyFeature(contract);
    const impact = RoadmapImpactEngine.measureImpact(contract.featureName);

    const cert = RequirementIntelligenceGate.certify(
      "GymMaster Pro",
      tmpDir,
      contract.requirementId,
      verification,
      impact,
      { isAuthorized: true }
    );

    expect(cert.tier).toBe(48);
    expect(cert.status).toBe("REQUIREMENT_ACCEPTED");
    expect(cert.evidence.requirementValidated).toBe(true);
    expect(cert.evidence.implementationVerified).toBe(true);
    expect(cert.evidence.hoursSavedWeekly).toBeGreaterThanOrEqual(4.0);

    const ledger = ProductCompletionLedger.getEntries();
    expect(ledger.some((l) => l.eventType === "REQUIREMENT_INTELLIGENCE_EVOLUTION_CERTIFIED")).toBe(true);
  });

  it("rejects certification when unauthorized or regressed", () => {
    const verification = FeatureVerificationEngine.verifyFeature(contract, {
      simulateWorkflowRegression: true,
    });
    const impact = RoadmapImpactEngine.measureImpact(contract.featureName);

    const cert = RequirementIntelligenceGate.certify(
      "GymMaster Pro",
      tmpDir,
      contract.requirementId,
      verification,
      impact,
      { isAuthorized: false }
    );

    expect(cert.status).toBe("REQUIREMENT_REJECTED");
    expect(cert.evidence.regressionDetected).toBe(true);
  });
});
