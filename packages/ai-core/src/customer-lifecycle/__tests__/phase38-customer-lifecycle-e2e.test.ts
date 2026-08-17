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
import { CustomerLifecycleStateEngine } from "../customer-lifecycle-state.js";
import { CustomerOnboardingEngine } from "../customer-onboarding-engine.js";
import { CustomerAdoptionEngine } from "../customer-adoption-engine.js";
import { CustomerHealthEngine } from "../customer-health-engine.js";
import { CustomerChurnForecastEngine } from "../customer-churn-forecast.js";
import { CustomerExpansionEngine } from "../customer-expansion-engine.js";
import { CustomerJourneyEngine } from "../customer-journey-engine.js";
import { CustomerScenarioSimulator } from "../customer-scenario-simulator.js";
import { CustomerInterventionEngine } from "../customer-intervention-engine.js";
import { CustomerSuccessActionPlanner } from "../customer-success-action-planner.js";
import { CustomerOutcomeVerificationEngine } from "../customer-outcome-verification.js";
import { CustomerLifecycleLearningEngine } from "../customer-lifecycle-learning.js";
import { EnterpriseCustomerPortfolioEngine } from "../customer-portfolio-engine.js";
import { CustomerLifecycleWorkQueue } from "../customer-lifecycle-work-queue.js";
import { CustomerDecisionEngine } from "../customer-decision-engine.js";
import { CustomerLifecycleDecisionLedger } from "../customer-lifecycle-ledger.js";
import { EnterpriseCustomerLifecycleGate } from "../enterprise-customer-lifecycle-gate.js";
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

const P38_PROJ_DIR = join(process.cwd(), ".tmp_test_p38_e2e");

describe("AEGIS Phase 38 — Master Autonomous Customer Lifecycle & Retention Intelligence E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P38_PROJ_DIR)) rmSync(P38_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P38_PROJ_DIR, { recursive: true });
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
    CustomerLifecycleStateEngine.reset();
    CustomerLifecycleWorkQueue.reset();
    CustomerLifecycleDecisionLedger.reset();
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
    CustomerLifecycleStateEngine.reset();
    CustomerLifecycleWorkQueue.reset();
    CustomerLifecycleDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P38_PROJ_DIR)) rmSync(P38_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete customer lifecycle & proactive retention governance across all 27 tiers and issues CustomerLifecycleCertificate", async () => {
    // 1. Enterprise Organization & Actor Setup
    OrganizationManager.createOrganization({
      organizationId: "org_customer_success",
      name: "Global Customer Success Core",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_cs", name: "Proactive Retention Team", memberUserIds: ["cs_lead_1"] }],
      projectIds: ["gym_p38_cust_proj"],
    });

    IdentityManager.registerActor({
      userId: "cs_lead_1",
      name: "Head of Customer Success",
      organizationId: "org_customer_success",
      role: "CUSTOMER_SUCCESS_LEAD",
    });

    // 2. Customer Lifecycle State Registration & Onboarding
    const customer = CustomerLifecycleStateEngine.registerCustomer("cust_gym_central", "gym_p38_cust_proj", "tenant_gym", "ONBOARDING");
    expect(customer.stage).toBe("ONBOARDING");

    const onb = CustomerOnboardingEngine.evaluateOnboarding("cust_gym_central", "gym_p38_cust_proj", 5, 5, 2.0);
    expect(onb.status).toBe("COMPLETED");

    CustomerLifecycleStateEngine.transitionStage("cust_gym_central", "ADOPTING", "HEALTHY");

    // 3. Adoption & Composite Health Scoring
    const adp = CustomerAdoptionEngine.evaluateAdoption("cust_gym_central", "gym_p38_cust_proj", 8, 10, 30, 0.25);
    expect(adp.adoptionPercentage).toBe(80);

    const health = CustomerHealthEngine.calculateHealth("cust_gym_central", "gym_p38_cust_proj", 80, 88, 99.9, 0);
    expect(health.status).toBe("HEALTHY");
    expect(health.healthScore).toBeGreaterThanOrEqual(80);

    // 4. Churn Risk Forecasting & Expansion Discovery
    const churn = CustomerChurnForecastEngine.forecastChurn("cust_gym_central", "gym_p38_cust_proj", health.healthScore, 1, "30_DAYS");
    expect(churn.isForecast).toBe(true);
    expect(churn.riskLevel).toBe("LOW");

    const expansion = CustomerExpansionEngine.discoverExpansion("cust_gym_central", "gym_p38_cust_proj", health.healthScore, adp.adoptionPercentage, 220);
    expect(expansion.length).toBeGreaterThan(0);

    // 5. Zero-Mutation Scenario Simulation
    const sim = CustomerScenarioSimulator.simulateScenario("cust_gym_central", "Guided Analytics Adoption", health.healthScore);
    expect(sim.sourceMutationsAttempted).toBe(0);
    expect(sim.databaseMutationsAttempted).toBe(0);
    expect(sim.deploymentMutationsAttempted).toBe(0);
    expect(sim.customerStateMutationsAttempted).toBe(0);
    expect(sim.simulationHash).toBeDefined();

    // 6. Governed Proactive Intervention Recommendation & Action Plan
    const intervention = CustomerInterventionEngine.evaluateIntervention("cust_gym_central", "gym_p38_cust_proj", health.healthScore, churn.churnProbabilityPercentage);
    expect(intervention.recommendedAction).toBe("NO_ACTION"); // Healthy account

    const plan = CustomerSuccessActionPlanner.compilePlan(
      "cust_gym_central",
      "gym_p38_cust_proj",
      "Proactive Analytics Hub Enablement",
      "auth_cs_p38_valid"
    );
    expect(plan.planId).toBeDefined();

    // 7. Secret Masking & Worker Lease
    SecretProvider.setSecret("CS_API_KEY", "cs_secret_retention_token_9911");
    expect(SecretProvider.maskSecrets("Bearer cs_secret_retention_token_9911")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("cs_worker_1");
    expect(WorkerManager.acquireLease("cs_worker_1", "gym_p38_cust_proj", "job_p38_cs")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_customer_success",
      projectId: "gym_p38_cust_proj",
      name: "Gym Customer Node",
      projectPath: P38_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 8. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p38_cust_proj",
      projectPath: P38_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Customer Lifecycle Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Customer Lifecycle Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P38_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P38_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P38_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P38_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P38_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P38_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P38_PROJ_DIR, "prisma/schema.prisma"),
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

      // 9. Production Release & Staged Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P38_PROJ_DIR,
        projectId: "gym_p38_cust_proj",
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
        projectId: "gym_p38_cust_proj",
        projectPath: P38_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 10. Multi-Dimensional Outcome Verification
      const verifyReport = CustomerOutcomeVerificationEngine.verifyOutcome({
        customerId: "cust_gym_central",
        onboardingVerified: true,
        adoptionVerified: true,
        productValueVerified: true,
        retentionVerified: true,
        businessValueVerified: true,
      });
      expect(verifyReport.status).toBe("ACHIEVED");

      CustomerLifecycleStateEngine.transitionStage("cust_gym_central", "ESTABLISHED", "HEALTHY");

      // 11. Customer Lifecycle Learning & Portfolio Analytics
      const learning = CustomerLifecycleLearningEngine.extractLearning(50);
      expect(learning.securityPolicyMutationsAttempted).toBe(0);
      expect(learning.privacyPolicyMutationsAttempted).toBe(0);

      const portfolio = EnterpriseCustomerPortfolioEngine.calculatePortfolio(50, 45, 3, 2, 0, 1500000);
      expect(portfolio.portfolioRetentionRatePct).toBe(96);

      // 12. Record Evidence Claims & Cryptographic Ledger Entry
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p38_cust_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Customer Lifecycle Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      CustomerLifecycleDecisionLedger.recordEntry({
        actorId: "cs_lead_1",
        tenantId: "tenant_gym",
        organizationId: "org_customer_success",
        projectId: "gym_p38_cust_proj",
        customerId: "cust_gym_central",
        eventType: "CUSTOMER_LIFECYCLE_CERTIFIED",
        evidenceSummary: "Customer lifecycle and proactive retention verified across all 27 governance tiers delivering ₹2,40,000 INR verified retention value.",
      });

      // 13. Master Enterprise Customer Lifecycle Gate Certification (All 27 Tiers)
      const custCert = EnterpriseCustomerLifecycleGate.evaluate(P38_PROJ_DIR, "org_customer_success");
      expect(custCert.status).toBe("CUSTOMER_LIFECYCLE_CERTIFIED");
      expect(custCert.totalCertifiedGates).toBe(27);
      expect(existsSync(join(P38_PROJ_DIR, ".aegis", "customer-lifecycle-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("cs_worker_1", "gym_p38_cust_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
