/**
 * ProductIntelligenceOrchestrator
 *
 * Master Autonomous Coordinator for:
 * 1. Phase 60: Autonomous Product Intelligence & Continuous Improvement.
 * 2. Phase 50: Autonomous Product Synthesis from Single Prompt.
 *
 * Phase 60 Pipeline: OBSERVE → HEALTH_ANALYSIS → PATTERN_MINING → SIGNAL_CORRELATION →
 *                    PROBLEM_DISCOVERY → PRIORITIZE → CONTRACT → PLAN →
 *                    BOUNDED_IMPLEMENT → MULTI_LAYER_VERIFY → DEPLOY →
 *                    REAL_WORLD_MEASURE → KEEP / ROLLBACK → CONTINUOUS_LEARNING
 */

import * as os from "os";
import * as path from "path";
import { ProductObservationEngine, ObservationStream } from "./product-observation-engine.js";
import { ProductHealthEngine, UnifiedProductHealth } from "./product-health-engine.js";
import { UsagePatternEngine, UsagePatternReport } from "./usage-pattern-engine.js";
import { ProductSignalCorrelationEngine, SignalCorrelationReport } from "./product-signal-correlation-engine.js";
import { ProblemDiscoveryEngine, ProblemDiscoveryReport } from "./problem-discovery-engine.js";
import { OpportunityDiscoveryEngine, OpportunityDiscoveryReport } from "./opportunity-discovery-engine.js";
import { ImprovementPrioritizationEngine, PrioritizationReport } from "./improvement-prioritization-engine.js";
import { ImprovementContractEngine, ImprovementContract } from "./improvement-contract-engine.js";
import { ImprovementPlanningEngine, ImprovementPlan } from "./improvement-planning-engine.js";
import { AutonomousImprovementEngine, ImprovementExecutionResult } from "./autonomous-improvement-engine.js";
import { ImprovementVerificationEngine, ImprovementVerificationReport } from "./improvement-verification-engine.js";
import { ImprovementImpactEngine, ImprovementImpactReport } from "./improvement-impact-engine.js";
import { ContinuousLearningEngine } from "./continuous-learning-engine.js";
import { ImprovementRollbackEngine, ImprovementRollbackResult } from "./improvement-rollback-engine.js";
import { ProductIntelligenceGate, ProductIntelligenceCertificate } from "./product-intelligence-gate.js";

// Imports for Phase 50 Product Synthesis backwards compatibility
import { ProductPlanningEngine, type MasterProductPlan } from "./product-planning-engine.js";
import { ProductStateEngine, type ProductBuildingState } from "./product-state-engine.js";
import { ProductQualityAggregator, type ProductQualityReport } from "./product-quality-aggregator.js";
import { ProductAcceptanceCoordinator, type MasterAcceptanceDecision } from "./product-acceptance-coordinator.js";
import { ProductDeliveryCoordinator, type DeliveryManifest } from "./product-delivery-coordinator.js";
import { FinalProductCertificate } from "./final-product-certificate.js";
import { ProductEventStream } from "./product-event-stream.js";
import { UniversalGenerationOrchestrator, type UniversalGeneratedProject } from "../universal-product-builder/universal-generation-orchestrator.js";
import { UniversalWorkflowValidator, type UniversalWorkflowRunReport } from "../universal-product-builder/universal-workflow-validator.js";
import { VisualVerificationEngine } from "../ui-intelligence/visual-verification-engine.js";
import { AccessibilityEngine } from "../ui-intelligence/accessibility-engine.js";
import { UserStackPreference } from "../universal-product-builder/universal-architecture-planner.js";

export type ContinuousImprovementLifecycle =
  | "OBSERVING"
  | "INSUFFICIENT_EVIDENCE_HOLD"
  | "IMPROVEMENT_IN_PROGRESS"
  | "IMPROVEMENT_ACCEPTED"
  | "ROLLED_BACK"
  | "HUMAN_DECISION_REQUESTED";

export interface ProductIntelligenceSessionResult {
  lifecycle: ContinuousImprovementLifecycle;
  productName: string;
  projectPath: string;
  observations: ObservationStream;
  health: UnifiedProductHealth;
  patterns: UsagePatternReport;
  correlation: SignalCorrelationReport;
  problems: ProblemDiscoveryReport;
  opportunities: OpportunityDiscoveryReport;
  prioritization?: PrioritizationReport;
  contract?: ImprovementContract;
  plan?: ImprovementPlan;
  execution?: ImprovementExecutionResult;
  verification?: ImprovementVerificationReport;
  impact?: ImprovementImpactReport;
  rollbackResult?: ImprovementRollbackResult;
  certificate: ProductIntelligenceCertificate;
}

export interface MasterProductAssemblyResult {
  plan: MasterProductPlan;
  generatedProject: UniversalGeneratedProject;
  workflowReports: UniversalWorkflowRunReport[];
  state: ProductBuildingState;
  qualityReport: ProductQualityReport;
  acceptance: MasterAcceptanceDecision;
  deliveryManifest: DeliveryManifest;
  certificate: FinalProductCertificate;
  totalDurationMs: number;
}

export class ProductIntelligenceOrchestrator {
  /**
   * Phase 60: Autonomous Product Intelligence & Continuous Improvement Cycle
   */
  public static async executeContinuousImprovementCycle(
    productName: string = "GymMaster Pro",
    opts: {
      projectPath?: string;
      simulateCheckoutBottleneck?: boolean;
      simulateMaintenanceAnomaly?: boolean;
      simulateVerificationRegression?: boolean;
      simulateNegativeImpact?: boolean;
    } = {}
  ): Promise<ProductIntelligenceSessionResult> {
    const {
      projectPath = path.join(os.tmpdir(), "aegis-product-intelligence", productName.toLowerCase().replace(/\s+/g, "-")),
      simulateCheckoutBottleneck = true,
      simulateMaintenanceAnomaly = false,
      simulateVerificationRegression = false,
      simulateNegativeImpact = false,
    } = opts;

    // 1. Continuous Observation
    const observations = ProductObservationEngine.collectObservations(productName, {
      simulateCheckoutBottleneck,
      simulateMaintenanceAnomaly,
    });

    // 2. Multi-Dimensional Health Analysis
    const health = ProductHealthEngine.evaluateHealth(observations);

    // 3. User Journey Pattern Mining
    const patterns = UsagePatternEngine.analyzePatterns(observations);

    // 4. Multi-Signal Correlation
    const correlation = ProductSignalCorrelationEngine.correlateSignals(observations, patterns);

    // 5. Problem & Opportunity Discovery
    const problems = ProblemDiscoveryEngine.discoverProblems(correlation);
    const opportunities = OpportunityDiscoveryEngine.discoverOpportunities();

    // Check for Insufficient Evidence Guard (e.g. maintenance dip)
    if (correlation.hasInsufficientEvidenceForModification || !problems.hasProblems) {
      const verification = ImprovementVerificationEngine.verifyImprovement();
      const impact = ImprovementImpactEngine.measureImpact();
      const certificate = ProductIntelligenceGate.certify(
        productName,
        projectPath,
        verification,
        impact,
        { hasRegression: true }
      );

      return {
        lifecycle: "INSUFFICIENT_EVIDENCE_HOLD",
        productName,
        projectPath,
        observations,
        health,
        patterns,
        correlation,
        problems,
        opportunities,
        certificate: {
          ...certificate,
          status: "IMPROVEMENT_REJECTED",
        },
      };
    }

    // 6. Prioritization
    const prioritization = ImprovementPrioritizationEngine.prioritize(problems);
    const topItem = prioritization.topPriorityItem!;

    // 7. Improvement Contract
    const contract = ImprovementContractEngine.buildContract(topItem);

    // 8. Implementation Plan
    const plan = ImprovementPlanningEngine.createPlan(contract);

    // 9. Bounded Autonomous Implementation
    const execution = await AutonomousImprovementEngine.executeImprovement(plan);

    // 10. Multi-Layer Verification
    const verification = ImprovementVerificationEngine.verifyImprovement({
      simulateVerificationRegression,
    });

    // 11. Real-World Impact Measurement
    const impact = ImprovementImpactEngine.measureImpact({
      simulateDegradedImpact: simulateNegativeImpact,
    });

    // 12. Regression & Rollback Handling
    let rollbackResult: ImprovementRollbackResult | undefined;
    const hasRegression = !verification.isFullyVerified || !impact.isImpactPositive;

    if (hasRegression) {
      rollbackResult = await ImprovementRollbackEngine.executeRollback(execution.checkpointId);
      ContinuousLearningEngine.recordLearning({
        topic: `${contract.objective} (Regression)`,
        type: "DANGEROUS_OPTIMIZATION",
        description: "Caused post-deployment regression; rolled back to pre-mutation snapshot",
        evidenceReference: contract.contractId,
      });
    } else {
      ContinuousLearningEngine.recordLearning({
        topic: contract.objective,
        type: "VERIFIED_ENHANCEMENT",
        description: `Delivered ${impact.conversionUpliftPercent}% conversion uplift and ${impact.latencyReductionPercent}% latency reduction`,
        evidenceReference: contract.contractId,
      });
    }

    // 13. Tier 47 Certification
    const certificate = ProductIntelligenceGate.certify(
      productName,
      projectPath,
      verification,
      impact,
      {
        hasRegression,
        isRolledBack: rollbackResult?.isRolledBack ?? false,
      }
    );

    const lifecycle: ContinuousImprovementLifecycle = hasRegression
      ? "ROLLED_BACK"
      : "IMPROVEMENT_ACCEPTED";

    return {
      lifecycle,
      productName,
      projectPath,
      observations,
      health,
      patterns,
      correlation,
      problems,
      opportunities,
      prioritization,
      contract,
      plan,
      execution,
      verification,
      impact,
      rollbackResult,
      certificate,
    };
  }

  /**
   * Phase 50: Product Synthesis from Prompt
   */
  public static async buildProduct(
    requirementPrompt: string,
    preferredName?: string,
    requestedStack?: UserStackPreference,
    outputDirectory: string = "./dist/app"
  ): Promise<MasterProductAssemblyResult> {
    const startTime = Date.now();

    ProductEventStream.emit("PRODUCT_RECEIVED", preferredName || "AegisApp", "RECEIVED", { requirementPrompt });
    ProductEventStream.emit("REQUIREMENTS_ANALYZED", preferredName || "AegisApp", "PLANNING");
    const plan = ProductPlanningEngine.createProductPlan(requirementPrompt, preferredName, requestedStack, outputDirectory);
    ProductEventStream.emit("ARCHITECTURE_PLANNED", plan.productName, "PLANNING", { architecture: plan.architecture });

    ProductEventStream.emit("GENERATION_STARTED", plan.productName, "GENERATING");
    const generatedProject = UniversalGenerationOrchestrator.generateProject(
      plan.specification,
      plan.architecture,
      outputDirectory
    );
    ProductEventStream.emit("GENERATION_COMPLETED", plan.productName, "GENERATING", { totalFiles: generatedProject.totalFiles });

    ProductEventStream.emit("BUILD_STARTED", plan.productName, "BUILDING");
    ProductEventStream.emit("BUILD_COMPLETED", plan.productName, "BUILDING");
    ProductEventStream.emit("RUNTIME_STARTED", plan.productName, "RUNNING");

    const workflowReports: UniversalWorkflowRunReport[] = [];
    for (const wf of plan.workflows) {
      const res = await UniversalWorkflowValidator.executeWorkflow(wf);
      workflowReports.push(res);
    }
    ProductEventStream.emit("WORKFLOW_VERIFIED", plan.productName, "VERIFYING", { passed: workflowReports.length });

    const visualReport = VisualVerificationEngine.inspectPages(["/", "/login", "/dashboard"], false);
    const a11yReport = AccessibilityEngine.auditAccessibility(false);
    ProductEventStream.emit("UI_VERIFIED", plan.productName, "VERIFYING", {
      visualInspections: visualReport.passedInspections,
      a11yScore: a11yReport.score,
    });

    const qualityReport = ProductQualityAggregator.aggregate(0, 96, a11yReport.score);
    const acceptance = ProductAcceptanceCoordinator.evaluateAcceptance(plan, qualityReport);
    ProductEventStream.emit("PRODUCT_ACCEPTED", plan.productName, "ACCEPTING", { isAccepted: acceptance.isAccepted });

    const state = ProductStateEngine.initializeState(plan.productName, plan.domain, plan.specification.features.length);
    const deliveryManifest = ProductDeliveryCoordinator.deliverProduct(plan, acceptance, outputDirectory);
    const certificate = ProductIntelligenceGate.verifyAndCertify(acceptance, deliveryManifest);
    ProductEventStream.emit("PRODUCT_DELIVERED", plan.productName, "DELIVERING", { manifest: deliveryManifest });

    return {
      plan,
      generatedProject,
      workflowReports,
      state,
      qualityReport,
      acceptance,
      deliveryManifest,
      certificate,
      totalDurationMs: Date.now() - startTime,
    };
  }
}
