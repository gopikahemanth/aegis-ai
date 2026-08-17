import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { AegisPlatform } from "../../platform/aegis-platform.js";
import { WorkerManager } from "../../platform/worker-manager.js";
import { IdentityManager } from "../../identity/identity-manager.js";
import { SecretProvider } from "../../security/secret-provider.js";
import { EvidenceLedger } from "../../validation/production-validation/evidence-ledger.js";
import { OrganizationManager } from "../../enterprise/organization-manager.js";
import { PortfolioIntelligenceEngine } from "../../strategy/portfolio-intelligence.js";
import { OutcomeDefinitionManager } from "../../outcomes/outcome-definition.js";
import { ProductSignalIntelligenceEngine } from "../product-signal-intelligence-engine.js";
import { CustomerBehaviorEngine } from "../customer-behavior-engine.js";
import { ProductValueIntelligenceEngine } from "../product-value-intelligence.js";
import { MarketSignalEngine } from "../market-signal-engine.js";
import { ProductOpportunityDiscoveryEngine } from "../product-opportunity-discovery.js";
import { ProductStrategyPrioritizer } from "../product-strategy-prioritizer.js";
import { ProductScenarioSimulator } from "../product-scenario-simulator.js";
import { ProductExperimentEngine } from "../product-experiment-engine.js";
import { ProductEvolutionEngine } from "../product-evolution-engine.js";
import { ProductAuthorizationEngine } from "../product-authorization-engine.js";
import { ProductExecutionCoordinator } from "../product-execution-coordinator.js";
import { ProductOutcomeVerificationEngine } from "../product-outcome-verification.js";
import { CustomerValueLearningEngine } from "../customer-value-learning.js";
import { ProductPortfolioEngine } from "../product-portfolio-engine.js";
import { EnterpriseProductWorkQueue } from "../product-work-queue.js";
import { EnterpriseProductDecisionEngine } from "../product-decision-engine.js";
import { EnterpriseProductDecisionLedger } from "../product-decision-ledger.js";
import { EnterpriseProductIntelligenceGate } from "../enterprise-product-intelligence-gate.js";
import { JobOrchestrator } from "../../control-plane/job-orchestrator.js";
import { ProductionReleaseGate } from "../../production/production-release-gate.js";
import { DeploymentOrchestrator } from "../../operations/deployment-orchestrator.js";
import { IncidentEngine } from "../../operations/incident-engine.js";
import { EngineeringLearningEngine } from "../../learning/engineering-learning-engine.js";
import { FleetManager } from "../../fleet/fleet-manager.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";
import { GoldenWorkflowRegistry } from "../../evolution/golden-workflow-registry.js";
import { TaskFileLockManager } from "../../governance/file-ownership-registry.js";
import { TaskCacheManager } from "../../execution/task-cache.js";
import { DeploymentInventory } from "../../operations/deployment-inventory.js";
import { ProductionStateManager } from "../../operations/production-state.js";

const P37_PROJ_DIR = join(process.cwd(), ".tmp_test_p37_e2e");

describe("AEGIS Phase 37 — Master Autonomous Product Intelligence & Value Governance E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P37_PROJ_DIR)) rmSync(P37_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P37_PROJ_DIR, { recursive: true });
    JobOrchestrator.reset();
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
    TaskCacheManager.clear();
    IncidentEngine.reset();
    DeploymentInventory.reset();
    ProductionStateManager.reset();
    FleetManager.reset();
    WorkerManager.reset();
    IdentityManager.reset();
    OrganizationManager.reset();
    PortfolioIntelligenceEngine.reset();
    OutcomeDefinitionManager.reset();
    ProductOpportunityDiscoveryEngine.reset();
    ProductExperimentEngine.reset();
    ProductAuthorizationEngine.reset();
    EnterpriseProductWorkQueue.reset();
    EnterpriseProductDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
  });

  afterEach(async () => {
    await RuntimeProcessManager.stopAll();
    JobOrchestrator.reset();
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
    TaskCacheManager.clear();
    IncidentEngine.reset();
    DeploymentInventory.reset();
    ProductionStateManager.reset();
    FleetManager.reset();
    WorkerManager.reset();
    IdentityManager.reset();
    OrganizationManager.reset();
    PortfolioIntelligenceEngine.reset();
    OutcomeDefinitionManager.reset();
    ProductOpportunityDiscoveryEngine.reset();
    ProductExperimentEngine.reset();
    ProductAuthorizationEngine.reset();
    EnterpriseProductWorkQueue.reset();
    EnterpriseProductDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P37_PROJ_DIR)) rmSync(P37_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete product intelligence lifecycle across all 26 governance tiers and issues EnterpriseProductIntelligenceCertificate", async () => {
    // 1. Enterprise Organization & Actor Setup
    OrganizationManager.createOrganization({
      organizationId: "org_prod_intel",
      name: "Global Product Intelligence Core",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_product", name: "Product Strategy Guild", memberUserIds: ["vp_prod_1"] }],
      projectIds: ["gym_p37_prod_proj"],
    });

    IdentityManager.registerActor({
      userId: "vp_prod_1",
      name: "VP of Product Strategy",
      organizationId: "org_prod_intel",
      role: "VP_PRODUCT",
    });

    // 2. Discover Customer Signals & Formulate Insight
    const signals = ProductSignalIntelligenceEngine.discoverSignals("gym_p37_prod_proj", 15, 0.25, 0.4);
    expect(signals.length).toBe(3);

    const insight = ProductSignalIntelligenceEngine.interpretInsight(signals[0]);
    expect(insight.insightId).toBeDefined();

    // 3. Customer Behavior Health Assessment
    const behavior = CustomerBehaviorEngine.evaluateBehavior("gym_p37_prod_proj", 300, 93, 16, 0.94);
    expect(behavior.healthState).toBe("IMPROVING");

    // 4. Market Signal Capture
    const marketSig = MarketSignalEngine.evaluateMarketSignal("MARKET_TREND", "Mobile Self-Service Check-in", "Gartner 2026", 0.92);
    expect(marketSig.isForecast).toBe(true);

    // 5. Product Opportunity Discovery & Deterministic Strategy Prioritization
    const opp = ProductOpportunityDiscoveryEngine.discoverOpportunity({
      projectId: "gym_p37_prod_proj",
      sourceInsightId: insight.insightId,
      title: "Real-Time Member Attendance Hub",
      targetUserGroup: "Gym Members & Staff",
      expectedRetentionGain: 14.5,
      expectedValueINR: 150000,
      costINR: 25000,
    });
    expect(opp.status).toBe("DISCOVERED");

    const ranked = ProductStrategyPrioritizer.prioritize([opp]);
    expect(ranked[0].priorityTier).toBe("CRITICAL");
    expect(ranked[0].governanceOverridePrevented).toBe(true);

    // 6. Zero-Mutation Scenario Simulation
    const sim = ProductScenarioSimulator.simulateScenario(opp.opportunityId, 150000, 14.5);
    expect(sim.sourceMutationsAttempted).toBe(0);
    expect(sim.databaseMutationsAttempted).toBe(0);
    expect(sim.deploymentMutationsAttempted).toBe(0);
    expect(sim.productionMutationsAttempted).toBe(0);
    expect(sim.simulationHash).toBeDefined();

    ProductOpportunityDiscoveryEngine.transitionState(opp.opportunityId, "QUALIFIED");

    // 7. VP Product Authorization & Controlled Canary Experiment
    ProductAuthorizationEngine.requestAuthorization(opp.opportunityId, "vp_prod_1", "tenant_gym", "org_prod_intel", "VP_PRODUCT");
    const auth = ProductAuthorizationEngine.grantAuthorization(opp.opportunityId, "vp_prod_1", "sig_vp_product_p37_valid");
    expect(auth.status).toBe("APPROVED");

    ProductOpportunityDiscoveryEngine.transitionState(opp.opportunityId, "APPROVED");

    const exp = ProductExperimentEngine.createExperiment(opp.opportunityId, "gym_p37_prod_proj", "flag_live_attendance", 10, 1.0, 24);
    expect(exp.status).toBe("PROPOSED");

    // 8. Product Evolution Planning & Governed Execution
    const plan = ProductEvolutionEngine.compileEvolutionPlan(opp.opportunityId, ["gym_p37_prod_proj"], "NOW");
    expect(plan.milestones.length).toBe(3);

    ProductOpportunityDiscoveryEngine.transitionState(opp.opportunityId, "PLANNED");

    const execResult = await ProductExecutionCoordinator.executeProductPlan(plan, auth.authorizationId);
    expect(execResult.status).toBe("COMPLETED");

    // 9. Secret Masking & Worker Lease
    SecretProvider.setSecret("PROD_INTEL_SECRET", "super_secret_product_token_8899");
    expect(SecretProvider.maskSecrets("Bearer super_secret_product_token_8899")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("prod_worker_1");
    expect(WorkerManager.acquireLease("prod_worker_1", "gym_p37_prod_proj", "job_p37_prod")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_prod_intel",
      projectId: "gym_p37_prod_proj",
      name: "Gym Product Node",
      projectPath: P37_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 10. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p37_prod_proj",
      projectPath: P37_PROJ_DIR,
      prompt: rawPrompt,
    });

    const dbMembers: Array<{ id: number; name: string }> = [];
    const port = await RuntimeProcessManager.allocateFreePort();

    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
      res.setHeader("Content-Type", "application/json");

      if (url.pathname === "/api/members") {
        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", () => {
            const data = JSON.parse(body || "{}");
            const member = { id: dbMembers.length + 1, name: data.name || "Alice" };
            dbMembers.push(member);
            res.writeHead(201);
            res.end(JSON.stringify(member));
          });
          return;
        }
        if (req.method === "GET") {
          res.writeHead(200);
          res.end(JSON.stringify({ members: dbMembers }));
          return;
        }
      }

      if (url.pathname === "/") {
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.end("<html><body><h1>Gym Product Intelligence Master</h1></body></html>");
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    });

    await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));

    try {
      const baseUrl = `http://127.0.0.1:${port}`;

      const completedG1 = await AegisPlatform.startGeneration(jobG1.jobId, {
        liveServerUrl: baseUrl,
        apiWorkflowSteps: [
          {
            workflowId: "wf_create_member",
            operationId: "createMember",
            method: "POST",
            path: "/api/members",
            requestBody: { name: "Alice" },
            expectedStatus: 201,
            expectedFields: ["id", "name"],
            description: "Create member",
          },
          {
            workflowId: "wf_get_members",
            operationId: "getMembers",
            method: "GET",
            path: "/api/members",
            expectedStatus: 200,
            expectedFields: ["members"],
            description: "Get members",
          },
        ],
        browserWorkflowActions: [
          { name: "Navigate Home", type: "NAVIGATE", url: baseUrl },
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Product Intelligence Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P37_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P37_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P37_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P37_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P37_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P37_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P37_PROJ_DIR, "prisma/schema.prisma"),
            `datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\n\nmodel User {\n  id Int @id @default(autoincrement())\n}\n\nmodel Member {\n  id Int @id @default(autoincrement())\n  name String\n}`,
            "utf8"
          );

          return {
            success: true,
            createdFiles: [
              "package.json",
              "src/features/members/MemberList.tsx",
              "server/routes/members.ts",
              "prisma/schema.prisma",
            ],
            modifiedFiles: [],
            deletedFiles: [],
          };
        },
      });

      expect(completedG1.status).toBe("COMPLETED");

      // 11. Production Release Gate & Staged Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P37_PROJ_DIR,
        projectId: "gym_p37_prod_proj",
        generationId: completedG1.generationId,
        productSuccessReport: {
          status: "SUCCESS",
          specificationPassed: true,
          matrixPassed: true,
          goldenWorkflowsPassed: true,
          realityPassed: true,
          summary: "G1 verified.",
        },
      });

      const deployG1 = await DeploymentOrchestrator.executeDeployment({
        projectId: "gym_p37_prod_proj",
        projectPath: P37_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 12. Multi-Dimensional Verification & Verified Value Realization
      const verifyReport = ProductOutcomeVerificationEngine.verifyOutcome({
        opportunityId: opp.opportunityId,
        technicalBuildPassed: true,
        securityChecksPassed: true,
        productFeaturesVerified: true,
        operationalLatencyHealthy: true,
        businessKpiPreserved: true,
      });
      expect(verifyReport.status).toBe("SUCCESS");

      const valueReport = ProductValueIntelligenceEngine.calculateValue(
        opp.opportunityId,
        88,
        14.5,
        9.2,
        150000,
        25000,
        true
      );
      expect(valueReport.isVerifiedValue).toBe(true);
      expect(valueReport.verifiedValueINR).toBe(150000);
      expect(valueReport.roi).toBe(6.0);

      // 13. Customer Value Learning & Portfolio Summary
      const learning = CustomerValueLearningEngine.extractLearning(15);
      expect(learning.securityPolicyMutationsAttempted).toBe(0);

      const portfolio = ProductPortfolioEngine.calculatePortfolio(10, 2, 8, 850000, 140000, 91.2);
      expect(portfolio.portfolioRoi).toBe(6.07);

      // 14. Record Evidence Claims & Cryptographic Ledger Entry
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p37_prod_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Product Intelligence Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      EnterpriseProductDecisionLedger.recordEntry({
        actorId: "vp_prod_1",
        tenantId: "tenant_gym",
        organizationId: "org_prod_intel",
        projectId: "gym_p37_prod_proj",
        opportunityId: opp.opportunityId,
        eventType: "PRODUCT_INTELLIGENCE_CERTIFIED",
        evidenceSummary: "Product feature verified across Technical, Security, Product, Operational, and Business layers delivering ₹1,50,000 INR verified customer value.",
      });

      // 15. Master Enterprise Product Intelligence Gate Certification (All 26 Tiers)
      const prodCert = EnterpriseProductIntelligenceGate.evaluate(P37_PROJ_DIR, "org_prod_intel");
      expect(prodCert.status).toBe("ENTERPRISE_PRODUCT_INTELLIGENCE_CERTIFIED");
      expect(prodCert.totalCertifiedGates).toBe(26);
      expect(existsSync(join(P37_PROJ_DIR, ".aegis", "enterprise-product-intelligence-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("prod_worker_1", "gym_p37_prod_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
