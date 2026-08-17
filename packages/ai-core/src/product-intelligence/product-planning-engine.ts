/**
 * ProductPlanningEngine
 *
 * Synthesizes a single, authoritative machine-readable ProductPlan that guides all downstream subsystems
 * (Architecture, DB Models, UI/UX, Generation, Validation, Repairs, and Delivery) without fragmentation.
 */

import { UniversalRequirementInterpreter, type UniversalProductSpecification } from "../universal-product-builder/universal-requirement-interpreter.js";
import { UniversalArchitecturePlanner, type UniversalArchitectureBlueprint, type UserStackPreference } from "../universal-product-builder/universal-architecture-planner.js";
import { DomainModelEngine, type DomainEntityModel } from "../universal-product-builder/domain-model-engine.js";
import { UniversalWorkflowEngine, type CompiledExecutableWorkflow } from "../universal-product-builder/universal-workflow-engine.js";
import { UXArchitectureEngine, type UXArchitecturePlan } from "../ui-intelligence/ux-architecture-engine.js";
import { DesignSystemEngine, type DesignSystem } from "../ui-intelligence/design-system-engine.js";

export interface SecurityPlan {
  authMethod: "JWT_BEARER" | "SESSION_COOKIE" | "OAUTH2";
  rbacRoles: string[];
  corsOrigins: string[];
  rateLimitingEnabled: boolean;
}

export interface TestingPlan {
  unitCoverageTarget: number;
  workflowIntegrationTests: number;
  browserViewportsTested: string[];
  accessibilityLevel: "WCAG_2_1_AA";
}

export interface DeliveryPlan {
  targetEnvironment: "NODE_DOCKER_CONTAINER";
  bundleOptimized: boolean;
  outputDirectory: string;
}

export interface MasterProductPlan {
  planId: string;
  productName: string;
  domain: string;
  specification: UniversalProductSpecification;
  architecture: UniversalArchitectureBlueprint;
  dataModel: DomainEntityModel[];

  workflows: CompiledExecutableWorkflow[];
  uiArchitecture: UXArchitecturePlan;
  designSystem: DesignSystem;
  security: SecurityPlan;
  testing: TestingPlan;
  delivery: DeliveryPlan;
  createdAt: string;
}

export class ProductPlanningEngine {
  public static createProductPlan(
    requirementPrompt: string,
    preferredName?: string,
    requestedStack?: UserStackPreference,
    outputDirectory: string = "./dist/app"
  ): MasterProductPlan {
    // 1. Requirements
    const spec = UniversalRequirementInterpreter.interpret(requirementPrompt, preferredName);

    // 2. Architecture & Data Model
    const architecture = UniversalArchitecturePlanner.planArchitecture(spec, requestedStack);
    const dataModel = DomainModelEngine.deriveDomainModels(spec.domain);

    // 3. Business Workflows
    const workflows = UniversalWorkflowEngine.compileWorkflows(spec);

    // 4. UX & Design System
    const uiArchitecture = UXArchitectureEngine.planUX(spec.productName, spec.domain);
    const designSystem = DesignSystemEngine.generateDesignSystem(`${spec.productName} Pro System`);

    // 5. Security & Testing
    const security: SecurityPlan = {
      authMethod: "JWT_BEARER",
      rbacRoles: spec.users.map((u) => u.role),
      corsOrigins: ["http://localhost:5173", "http://localhost:3000"],
      rateLimitingEnabled: true,
    };

    const testing: TestingPlan = {
      unitCoverageTarget: 90,
      workflowIntegrationTests: workflows.length,
      browserViewportsTested: ["DESKTOP", "TABLET", "MOBILE"],
      accessibilityLevel: "WCAG_2_1_AA",
    };

    const delivery: DeliveryPlan = {
      targetEnvironment: "NODE_DOCKER_CONTAINER",
      bundleOptimized: true,
      outputDirectory,
    };

    return {
      planId: `prod_plan_${Date.now()}`,
      productName: spec.productName,
      domain: spec.domain,
      specification: spec,
      architecture,
      dataModel,
      workflows,
      uiArchitecture,
      designSystem,
      security,
      testing,
      delivery,
      createdAt: new Date().toISOString(),
    };
  }
}
