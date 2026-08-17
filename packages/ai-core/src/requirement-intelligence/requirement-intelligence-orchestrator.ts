/**
 * RequirementIntelligenceOrchestrator
 *
 * Master Phase 61 Orchestrator:
 * Autonomous Requirement Evolution & Product Roadmap Intelligence.
 *
 * Complete Lifecycle:
 * OBSERVE → COLLECT_SIGNALS → DISCOVER_REQUIREMENT → NORMALIZE →
 * VALIDATE → CHECK_DUPLICATES → CHECK_CONFLICTS → DERIVE_LINEAGE →
 * ANALYZE_IMPACT → PRIORITIZE → ROADMAP_PLAN → AUTHORIZE →
 * FEATURE_CONTRACT → IMPLEMENT → VERIFY → DEPLOY → MEASURE → UPDATE_ROADMAP
 */

import * as os from "os";
import * as path from "path";
import { RequirementSignalEngine, SignalCollectionReport } from "./requirement-signal-engine.js";
import { RequirementDiscoveryEngine, RequirementDiscoveryReport } from "./requirement-discovery-engine.js";
import { RequirementNormalizationEngine, NormalizedRequirement } from "./requirement-normalization-engine.js";
import { RequirementValidationEngine, RequirementValidationReport } from "./requirement-validation-engine.js";
import { RequirementDuplicateEngine, DuplicateAnalysisResult } from "./requirement-duplicate-engine.js";
import { RequirementConflictEngine, RequirementConflictReport } from "./requirement-conflict-engine.js";
import { RequirementDerivationEngine, DerivationReport } from "./requirement-derivation-engine.js";
import { RequirementImpactEngine, RequirementImpactReport } from "./requirement-impact-engine.js";
import { RequirementPrioritizationEngine, RequirementPrioritizationReport } from "./requirement-prioritization-engine.js";
import { RoadmapPlanningEngine, ProductRoadmap } from "./roadmap-planning-engine.js";
import { FeatureContractEngine, FeatureContract } from "./feature-contract-engine.js";
import { FeatureAuthorizationEngine, AuthorizationResult } from "./feature-authorization-engine.js";
import { FeatureImplementationEngine, FeatureImplementationReport } from "./feature-implementation-engine.js";
import { FeatureVerificationEngine, FeatureVerificationReport } from "./feature-verification-engine.js";
import { RoadmapImpactEngine, RoadmapImpactReport } from "./roadmap-impact-engine.js";
import { RequirementIntelligenceGate, RequirementIntelligenceCertificate } from "./requirement-intelligence-gate.js";

export type RequirementLifecycleState =
  | "REQUIREMENT_DISCOVERED"
  | "INSUFFICIENT_EVIDENCE_HOLD"
  | "DUPLICATE_RECOMMEND_EXTENSION"
  | "SECURITY_CONFLICT_BLOCKED"
  | "AWAITING_AUTHORIZATION"
  | "FEATURE_VERIFIED_AND_MEASURED"
  | "REGRESSION_BLOCKED";

export interface RequirementSessionResult {
  lifecycle: RequirementLifecycleState;
  productName: string;
  projectPath: string;
  signals: SignalCollectionReport;
  discovery: RequirementDiscoveryReport;
  normalized: NormalizedRequirement[];
  validation: RequirementValidationReport;
  duplicateAnalysis?: DuplicateAnalysisResult;
  conflicts?: RequirementConflictReport;
  lineage?: DerivationReport;
  impact?: RequirementImpactReport;
  prioritization?: RequirementPrioritizationReport;
  roadmap?: ProductRoadmap;
  contract?: FeatureContract;
  authorization?: AuthorizationResult;
  implementation?: FeatureImplementationReport;
  verification?: FeatureVerificationReport;
  measuredImpact?: RoadmapImpactReport;
  certificate: RequirementIntelligenceCertificate;
}

export class RequirementIntelligenceOrchestrator {
  public static async executeRequirementEvolutionCycle(
    productName: string = "GymMaster Pro",
    opts: {
      projectPath?: string;
      simulateExportDemand?: boolean;
      simulateVagueRequest?: boolean;
      simulateDuplicateRequest?: boolean;
      simulateConflictRequest?: boolean;
      simulateWorkflowRegression?: boolean;
      userExplicitlyApproved?: boolean;
    } = {}
  ): Promise<RequirementSessionResult> {
    const {
      projectPath = path.join(os.tmpdir(), "aegis-requirement-intelligence", productName.toLowerCase().replace(/\s+/g, "-")),
      simulateExportDemand = true,
      simulateVagueRequest = false,
      simulateDuplicateRequest = false,
      simulateConflictRequest = false,
      simulateWorkflowRegression = false,
      userExplicitlyApproved = true,
    } = opts;

    // 1. Collect Signals
    const signals = RequirementSignalEngine.collectSignals(productName, {
      simulateExportDemand,
      simulateVagueRequest,
      simulateDuplicateRequest,
      simulateConflictRequest,
    });

    // 2. Discover Candidate Requirements
    const discovery = RequirementDiscoveryEngine.discoverRequirements(signals);

    // 3. Normalize Requirements
    const normalized = RequirementNormalizationEngine.normalize(discovery.candidates);

    // 4. Validate Requirements
    const validation = RequirementValidationEngine.validateRequirements(normalized);

    // Guard: Insufficient Evidence Check
    if (!validation.hasSufficientEvidence || !validation.primaryRequirement) {
      const dummyVerification: FeatureVerificationReport = {
        contractId: "none",
        isFullyVerified: false,
        checks: [],
        hasExistingWorkflowRegression: false,
        summary: "Execution halted: Insufficient evidence.",
      };
      const dummyImpact: RoadmapImpactReport = {
        featureName: "None",
        isImpactProven: false,
        comparisons: [],
        administrativeHoursSavedWeekly: 0,
        supportTicketReductionPercent: 0,
        summary: "No impact measured.",
      };
      const certificate = RequirementIntelligenceGate.certify(
        productName,
        projectPath,
        "REQ-NONE",
        dummyVerification,
        dummyImpact,
        { isAuthorized: false }
      );

      return {
        lifecycle: "INSUFFICIENT_EVIDENCE_HOLD",
        productName,
        projectPath,
        signals,
        discovery,
        normalized,
        validation,
        certificate: {
          ...certificate,
          status: "REQUIREMENT_REJECTED",
        },
      };
    }

    const primaryReq = validation.primaryRequirement;

    // 5. Check Duplicates
    const duplicateAnalysis = RequirementDuplicateEngine.checkDuplicates(
      primaryReq,
      simulateDuplicateRequest
        ? ["Member Management", "Export Member Data as CSV", "Member Search"]
        : ["Member Management", "Member Search & Filter", "Check-in QR Scanner"]
    );

    if (duplicateAnalysis.isDuplicate) {
      const dummyVerification: FeatureVerificationReport = {
        contractId: "none",
        isFullyVerified: false,
        checks: [],
        hasExistingWorkflowRegression: false,
        summary: "Execution routed to feature extension.",
      };
      const dummyImpact = RoadmapImpactEngine.measureImpact("Export Member Data as CSV");
      const certificate = RequirementIntelligenceGate.certify(
        productName,
        projectPath,
        primaryReq.requirement.id,
        dummyVerification,
        dummyImpact,
        { hasDuplicates: true }
      );

      return {
        lifecycle: "DUPLICATE_RECOMMEND_EXTENSION",
        productName,
        projectPath,
        signals,
        discovery,
        normalized,
        validation,
        duplicateAnalysis,
        certificate: {
          ...certificate,
          status: "REQUIREMENT_REJECTED",
        },
      };
    }

    // 6. Check Conflicts
    const conflicts = RequirementConflictEngine.detectConflicts(primaryReq, {
      simulateSecurityPolicyConflict: simulateConflictRequest,
    });

    if (conflicts.isBlockedBySecurity) {
      const dummyVerification: FeatureVerificationReport = {
        contractId: "none",
        isFullyVerified: false,
        checks: [],
        hasExistingWorkflowRegression: false,
        summary: "Blocked by security policy conflict.",
      };
      const dummyImpact = RoadmapImpactEngine.measureImpact(primaryReq.requirement.title);
      const certificate = RequirementIntelligenceGate.certify(
        productName,
        projectPath,
        primaryReq.requirement.id,
        dummyVerification,
        dummyImpact,
        { hasConflict: true }
      );

      return {
        lifecycle: "SECURITY_CONFLICT_BLOCKED",
        productName,
        projectPath,
        signals,
        discovery,
        normalized,
        validation,
        duplicateAnalysis,
        conflicts,
        certificate: {
          ...certificate,
          status: "REQUIREMENT_REJECTED",
        },
      };
    }

    // 7. Lineage Derivation & 8. Impact Analysis
    const lineage = RequirementDerivationEngine.deriveLineage(primaryReq);
    const impact = RequirementImpactEngine.analyzeImpact(primaryReq);

    // 9. Prioritization
    const prioritization = RequirementPrioritizationEngine.prioritize(
      [primaryReq],
      { [primaryReq.requirement.id]: impact }
    );

    // 10. Roadmap Planning
    const roadmap = RoadmapPlanningEngine.planRoadmap(productName, prioritization.items);
    const roadmapItem = roadmap.items[0];

    // 11. Feature Contract
    const contract = FeatureContractEngine.createContract(roadmapItem);

    // 12. Authorization
    const authorization = FeatureAuthorizationEngine.evaluateAuthorization(contract, {
      userExplicitlyApproved,
      isBlockedBySecurity: conflicts.isBlockedBySecurity,
    });

    if (!authorization.isPermittedToImplement) {
      const dummyVerification: FeatureVerificationReport = {
        contractId: contract.contractId,
        isFullyVerified: false,
        checks: [],
        hasExistingWorkflowRegression: false,
        summary: "Awaiting human authorization.",
      };
      const dummyImpact = RoadmapImpactEngine.measureImpact(contract.featureName);
      const certificate = RequirementIntelligenceGate.certify(
        productName,
        projectPath,
        primaryReq.requirement.id,
        dummyVerification,
        dummyImpact,
        { isAuthorized: false }
      );

      return {
        lifecycle: "AWAITING_AUTHORIZATION",
        productName,
        projectPath,
        signals,
        discovery,
        normalized,
        validation,
        duplicateAnalysis,
        conflicts,
        lineage,
        impact,
        prioritization,
        roadmap,
        contract,
        authorization,
        certificate: {
          ...certificate,
          status: "REQUIREMENT_REJECTED",
        },
      };
    }

    // 13. Implementation
    const implementation = await FeatureImplementationEngine.implementFeature(contract, authorization);

    // 14. Verification
    const verification = FeatureVerificationEngine.verifyFeature(contract, {
      simulateWorkflowRegression,
    });

    // 15. Outcome Impact Measurement
    const measuredImpact = RoadmapImpactEngine.measureImpact(contract.featureName);

    // 16. Update Roadmap Status
    if (verification.isFullyVerified) {
      roadmapItem.status = "COMPLETED";
      roadmapItem.authorizationStatus = "AUTHORIZED";
    } else {
      roadmapItem.status = "BLOCKED";
    }

    // 17. Certification Gate
    const certificate = RequirementIntelligenceGate.certify(
      productName,
      projectPath,
      primaryReq.requirement.id,
      verification,
      measuredImpact,
      {
        isAuthorized: authorization.isPermittedToImplement,
        hasDuplicates: duplicateAnalysis.isDuplicate,
        hasConflict: conflicts.hasConflict,
      }
    );

    const lifecycle: RequirementLifecycleState = verification.hasExistingWorkflowRegression
      ? "REGRESSION_BLOCKED"
      : "FEATURE_VERIFIED_AND_MEASURED";

    return {
      lifecycle,
      productName,
      projectPath,
      signals,
      discovery,
      normalized,
      validation,
      duplicateAnalysis,
      conflicts,
      lineage,
      impact,
      prioritization,
      roadmap,
      contract,
      authorization,
      implementation,
      verification,
      measuredImpact,
      certificate,
    };
  }
}
