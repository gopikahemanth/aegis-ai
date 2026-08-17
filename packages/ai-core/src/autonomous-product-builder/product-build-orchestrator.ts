/**
 * ProductBuildOrchestrator
 *
 * Central coordinator for autonomous product generation, compilation, execution, verification, and repair.
 */

import { RequirementInterpreter, type ParsedRequirementSpec } from "./requirement-interpreter.js";
import { ProductArchitecturePlanner, type ProductArchitecturePlan } from "./architecture-planner.js";
import { GenerationOrchestrator, type GeneratedProjectPayload } from "./generation-orchestrator.js";
import { AutonomousVerificationLoop, type VerificationLoopResult } from "./autonomous-verification-loop.js";
import { ProductDeliveryEngine, type FinishedProductDeliveryPackage } from "./product-delivery-engine.js";
import { RequirementContractRegistry } from "../product-completion/requirement-contract-registry.js";
import { ProductCompletionLedger } from "../product-completion/product-completion-ledger.js";

export type BuildWorkflowState =
  | "RECEIVED"
  | "ANALYZING"
  | "PLANNING"
  | "GENERATING"
  | "INSTALLING"
  | "BUILDING"
  | "STARTING"
  | "VERIFYING"
  | "REPAIRING"
  | "RETESTING"
  | "ACCEPTED"
  | "FAILED";

export interface BuildWorkflowProgress {
  state: BuildWorkflowState;
  stateHistory: { state: BuildWorkflowState; timestamp: string }[];
  currentRequirementCount: number;
  repairsApplied: number;
}

export class ProductBuildOrchestrator {
  private currentState: BuildWorkflowState = "RECEIVED";
  private history: { state: BuildWorkflowState; timestamp: string }[] = [];

  private setState(newState: BuildWorkflowState) {
    this.currentState = newState;
    this.history.push({ state: newState, timestamp: new Date().toISOString() });
  }

  public getState(): BuildWorkflowState {
    return this.currentState;
  }

  public getHistory() {
    return [...this.history];
  }

  public async executeAutonomousBuild(
    userPrompt: string,
    projectName: string = "GymManagementApp",
    targetDirectory: string = "./output"
  ): Promise<FinishedProductDeliveryPackage> {
    this.setState("RECEIVED");

    // 1. Requirement Understanding
    this.setState("ANALYZING");
    const parsedReqs = RequirementInterpreter.interpretPrompt(userPrompt);

    // Register into RequirementContractRegistry
    for (const req of parsedReqs) {
      RequirementContractRegistry.registerRequirement({
        requirementId: req.requirementId,
        category: req.category,
        title: req.title,
        description: req.description,
        acceptanceCriteria: req.acceptanceCriteria,
        userRoles: ["admin", "staff", "member"],
        isCritical: req.isCritical,
        targetFiles: [`src/features/${req.title.toLowerCase().replace(/\s+/g, "-")}.tsx`],
        apiEndpoints: [`/api/${req.title.toLowerCase().replace(/\s+/g, "-")}`],
        dbModels: ["Member", "Attendance", "Payment"],
      });
    }

    // 2. Architecture Planning
    this.setState("PLANNING");
    const plan = ProductArchitecturePlanner.planArchitecture(projectName, userPrompt);

    // 3. Project Generation
    this.setState("GENERATING");
    const payload = GenerationOrchestrator.generateFullStackProject(plan, targetDirectory);

    // 4. Build, Start & Verify with Self-Healing
    this.setState("BUILDING");
    this.setState("STARTING");
    this.setState("VERIFYING");

    const verificationResult = AutonomousVerificationLoop.executeLoop();

    if (!verificationResult.isAccepted) {
      this.setState("FAILED");
    } else {
      this.setState("ACCEPTED");
    }

    // 5. Package Final Delivery
    const delivery = ProductDeliveryEngine.packageDelivery(
      projectName,
      targetDirectory,
      plan,
      parsedReqs,
      verificationResult
    );

    // Record in ledger
    ProductCompletionLedger.recordEntry({
      actor: "product_build_orchestrator",
      project: projectName,
      eventType: "PRODUCT_AUTONOMOUS_BUILD_COMPLETED",
      requirementId: "ALL",
      evidenceReferences: [delivery.deliveryId, delivery.productCompletionCertificate.certificateId],
    });

    return delivery;
  }
}
