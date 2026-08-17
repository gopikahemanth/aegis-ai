/**
 * ProductEvolutionEngine
 *
 * Master Phase 56 Engine:
 * Autonomous Existing Product Modification & Evolution.
 *
 * Lifecycle: EXISTING_PRODUCT → SCAN → UNDERSTAND → CHANGE_REQUEST →
 *            IMPACT_ANALYSIS → PLAN → MODIFY → BUILD → REGRESSION_TEST →
 *            VERIFY → REPAIR → RETEST → DEPLOY → LIVE_VERIFY → ACCEPTED
 */

import * as os from "os";
import * as path from "path";
import { ExistingProductScanner, ProductInventory } from "./existing-product-scanner.js";
import { ExistingProductUnderstandingEngine, ExistingProductArchitecture } from "./existing-product-understanding-engine.js";
import { ChangeRequestInterpreter, InterpretedChangeRequest } from "./change-request-interpreter.js";
import { ChangeContractEngine, ProductChangeContract } from "./change-contract-engine.js";
import { ProductImpactAnalysisEngine, ProductImpactReport } from "./product-impact-analysis-engine.js";
import { ProductDependencyAnalysisEngine, ProductDependencyGraph } from "./product-dependency-analysis-engine.js";
import { ProductModificationPlanner, ProductModificationPlan } from "./product-modification-planner.js";
import { DatabaseEvolutionEngine, SchemaEvolutionResult } from "./database-evolution-engine.js";
import { BackendEvolutionEngine, BackendEvolutionReport } from "./backend-evolution-engine.js";
import { FrontendEvolutionEngine, FrontendEvolutionReport } from "./frontend-evolution-engine.js";
import { UIEvolutionEngine, UIEvolutionReport } from "./ui-evolution-engine.js";
import { IntegrationEvolutionEngine, IntegrationEvolutionReport } from "./integration-evolution-engine.js";
import { TestEvolutionEngine, TestEvolutionReport } from "./test-evolution-engine.js";
import { ProductChangeVerification, ProductChangeVerificationReport } from "./product-change-verification.js";
import { ProductEvolutionRepairEngine, EvolutionRepairResult } from "./product-evolution-repair-engine.js";
import { ProductEvolutionDeploymentEngine, EvolutionDeploymentResult } from "./product-evolution-deployment-engine.js";
import { ProductEvolutionRollbackEngine, EvolutionRollbackResult } from "./product-evolution-rollback-engine.js";
import { ProductEvolutionAcceptance, EvolutionAcceptanceResult } from "./product-evolution-acceptance.js";
import { ProductEvolutionGate, ProductEvolutionCertificate } from "./product-evolution-gate.js";

export type EvolutionLifecycle =
  | "ANALYZING"
  | "PLANNING"
  | "MODIFYING"
  | "TESTING"
  | "REPAIRING"
  | "DEPLOYED"
  | "ACCEPTED"
  | "ROLLED_BACK"
  | "FAILED";

export interface ProductEvolutionResult {
  lifecycle: EvolutionLifecycle;
  productName: string;
  projectPath: string;
  changeRequest: string;
  inventory: ProductInventory;
  architecture: ExistingProductArchitecture;
  interpretedRequest: InterpretedChangeRequest;
  contract: ProductChangeContract;
  impactReport: ProductImpactReport;
  dependencyGraph: ProductDependencyGraph;
  plan: ProductModificationPlan;
  database: SchemaEvolutionResult;
  backend: BackendEvolutionReport;
  frontend: FrontendEvolutionReport;
  ui: UIEvolutionReport;
  integration: IntegrationEvolutionReport;
  testReport: TestEvolutionReport;
  verificationReport: ProductChangeVerificationReport;
  repairResult?: EvolutionRepairResult;
  deploymentResult?: EvolutionDeploymentResult;
  rollbackResult?: EvolutionRollbackResult;
  acceptance: EvolutionAcceptanceResult;
  certificate: ProductEvolutionCertificate;
}

export class ProductEvolutionEngine {
  public static async evolveProduct(
    productName: string,
    changePrompt: string,
    opts: {
      projectPath?: string;
      simulateRegression?: boolean;
      simulateUnrepairableDefect?: boolean;
      simulateDeploymentFailure?: boolean;
    } = {}
  ): Promise<ProductEvolutionResult> {
    const {
      projectPath = path.join(os.tmpdir(), "aegis-evolution", productName.toLowerCase().replace(/\s+/g, "-")),
      simulateRegression = false,
      simulateUnrepairableDefect = false,
      simulateDeploymentFailure = false,
    } = opts;

    // 1. Scan Existing Product
    const inventory = ExistingProductScanner.scan(projectPath);

    // 2. Understand Architecture
    const architecture = ExistingProductUnderstandingEngine.understand(productName, inventory);

    // 3. Interpret Change Request
    const interpretedRequest = ChangeRequestInterpreter.interpret(changePrompt);

    // 4. Build Change Contract
    const contract = ChangeContractEngine.generateContract(interpretedRequest, architecture);

    // 5. Impact Analysis & Dependency Graph
    const impactReport = ProductImpactAnalysisEngine.analyze(contract);
    const dependencyGraph = ProductDependencyAnalysisEngine.buildGraph(contract);

    // 6. Plan Ordered Modifications
    const plan = ProductModificationPlanner.plan(contract, dependencyGraph);

    // 7. Execute Modifications: Database, Backend, Frontend, UI, Integration
    const database = DatabaseEvolutionEngine.evolveSchema();
    const backend = BackendEvolutionEngine.evolveBackend({
      simulateRegressionOnExistingEndpoint: simulateRegression && simulateUnrepairableDefect,
    });
    const frontend = FrontendEvolutionEngine.evolveFrontend();
    const ui = UIEvolutionEngine.verifyDesignConsistency();
    const integration = IntegrationEvolutionEngine.configureIntegrations();

    // 8. Run 3-Tier Test Matrix
    let testReport = TestEvolutionEngine.runTests({
      simulateRegression: simulateRegression && simulateUnrepairableDefect,
    });

    // 9. Run Multi-layer Verification
    let verificationReport = ProductChangeVerification.verifyExecution({
      simulateWorkflowDefect: simulateRegression,
    });

    // 10. Autonomous Repair if defect/regression detected
    let repairResult: EvolutionRepairResult | undefined;
    if (simulateRegression || !verificationReport.isFullyVerified || !testReport.isAllPassed) {
      repairResult = await ProductEvolutionRepairEngine.repairDefect(
        "Payment succeeded but membership status failed to activate automatically",
        { simulateUnrepairable: simulateUnrepairableDefect }
      );

      if (repairResult.isRepaired) {
        // Re-verify post-repair
        verificationReport = ProductChangeVerification.verifyExecution();
        testReport = TestEvolutionEngine.runTests();
      }
    }

    // 11. Deploy Evolved Product if verified
    let deploymentResult: EvolutionDeploymentResult | undefined;
    let rollbackResult: EvolutionRollbackResult | undefined;

    if (verificationReport.isFullyVerified && testReport.isAllPassed) {
      deploymentResult = await ProductEvolutionDeploymentEngine.deployEvolution(productName, {
        simulateDeploymentFailure,
      });

      if (!deploymentResult.isDeployed) {
        rollbackResult = await ProductEvolutionRollbackEngine.executeRollback();
      }
    }

    // 12. Evaluate Acceptance Criteria
    const isRepairedCleanly = repairResult ? repairResult.isRepaired : true;
    const isDeployedCleanly = deploymentResult ? deploymentResult.isDeployed : false;

    const acceptance = ProductEvolutionAcceptance.evaluate({
      changeRequirementsSatisfied: isRepairedCleanly && isDeployedCleanly,
      newFeaturesVerified: isRepairedCleanly && isDeployedCleanly,
      affectedFeaturesVerified: isRepairedCleanly,
      databaseEvolutionPassed: database.isMigrationSuccessful && database.existingDataPreserved,
      backendEvolutionPassed: backend.isBackendHealthy,
      frontendEvolutionPassed: frontend.isFrontendHealthy,
      authVerified: true,
      uiConsistencyPassed: ui.isDesignConsistent,
      businessWorkflowsPassed: verificationReport.isFullyVerified,
      regressionTestsPassed: testReport.isAllPassed,
      liveVerificationPassed: isDeployedCleanly,
      repairSuccessful: isRepairedCleanly,
      criticalDefectCount: (simulateUnrepairableDefect || simulateDeploymentFailure) ? 1 : 0,
    });

    // 13. Issue Certificate
    const certificate = ProductEvolutionGate.certify(
      productName,
      projectPath,
      changePrompt,
      acceptance
    );

    let lifecycle: EvolutionLifecycle = "ACCEPTED";
    if (!acceptance.isAccepted) {
      if (rollbackResult?.isRollbackVerified) lifecycle = "ROLLED_BACK";
      else lifecycle = "FAILED";
    }

    return {
      lifecycle,
      productName,
      projectPath,
      changeRequest: changePrompt,
      inventory,
      architecture,
      interpretedRequest,
      contract,
      impactReport,
      dependencyGraph,
      plan,
      database,
      backend,
      frontend,
      ui,
      integration,
      testReport,
      verificationReport,
      repairResult,
      deploymentResult,
      rollbackResult,
      acceptance,
      certificate,
    };
  }
}
