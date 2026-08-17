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
import { OutcomeMeasurementEngine } from "../../outcomes/outcome-measurement-engine.js";
import { EngineeringValueEngine } from "../engineering-value-engine.js";
import { CostAttributionEngine } from "../cost-attribution-engine.js";
import { ValueRealizationEngine } from "../value-realization-engine.js";
import { EngineeringUnitEconomicsEngine } from "../engineering-unit-economics.js";
import { ResourceGovernanceEngine } from "../resource-governance-engine.js";
import { EconomicScenarioEngine } from "../economic-scenario-engine.js";
import { ValueDecisionLedger } from "../value-decision-ledger.js";
import { EnterpriseValueDecisionEngine } from "../enterprise-value-decision-engine.js";
import { EnterpriseValueGate } from "../enterprise-value-gate.js";
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

const P26_PROJ_DIR = join(process.cwd(), ".tmp_test_p26_e2e");

describe("AEGIS Phase 26 — Master Engineering Economics & Value Realization E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P26_PROJ_DIR)) rmSync(P26_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P26_PROJ_DIR, { recursive: true });
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
    CostAttributionEngine.reset();
    ResourceGovernanceEngine.reset();
    ValueDecisionLedger.reset();
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
    CostAttributionEngine.reset();
    ResourceGovernanceEngine.reset();
    ValueDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P26_PROJ_DIR)) rmSync(P26_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete engineering economics lifecycle across all 15 governance tiers and issues EnterpriseValueCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_econ_core",
      name: "Engineering Economics Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_finops", name: "FinOps & Engineering", memberUserIds: ["cfo_delegate_1"] }],
      projectIds: ["gym_p26_econ_proj"],
    });

    IdentityManager.registerActor({
      userId: "cfo_delegate_1",
      name: "FinOps Lead",
      organizationId: "org_econ_core",
      role: "PLATFORM_ADMIN",
    });

    // 2. Budget Governance & Zero-Mutation Economic Scenario
    ResourceGovernanceEngine.setBudget("gym_p26_econ_proj", 150000);
    const scenario = EconomicScenarioEngine.simulateScenario("Gym Core Expansion", 100000);
    expect(scenario.mutationsAttempted).toBe(0);
    expect(scenario.projectedROI).toBe(3.2);

    // Record initial allocation decision
    ValueDecisionLedger.recordDecision({
      actorId: "cfo_delegate_1",
      organizationId: "org_econ_core",
      projectId: "gym_p26_econ_proj",
      operation: "ALLOCATE_BUDGET",
      decisionType: "RESOURCE_ALLOCATION",
      investmentAmountINR: 100000,
      realizedValueINR: 0,
    });

    // 3. Define Strategic Business Outcome
    const outcome = OutcomeDefinitionManager.defineOutcome({
      outcomeId: "out_gym_uptime",
      initiativeId: "init_gym_econ",
      organizationId: "org_econ_core",
      name: "Gym Production Zero Failure API",
      metric: "API Success Rate %",
      baselineValue: 90.0,
      targetValue: 100.0,
      measurementUnit: "%",
      deadline: "2026-12-31",
    });

    // 4. Secret Masking & Worker Lease
    SecretProvider.setSecret("ECON_TOKEN", "secure_econ_key_5566");
    expect(SecretProvider.maskSecrets("Bearer secure_econ_key_5566")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("econ_worker_1");
    expect(WorkerManager.acquireLease("econ_worker_1", "gym_p26_econ_proj", "job_p26_econ")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_econ_core",
      projectId: "gym_p26_econ_proj",
      name: "Gym Economics Master Node",
      projectPath: P26_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 5. Generation 1 & Cost Attribution
    CostAttributionEngine.recordCost({
      organizationId: "org_econ_core",
      projectId: "gym_p26_econ_proj",
      initiativeId: "init_gym_econ",
      category: "LLM_TOKENS",
      costType: "VERIFIED_COST",
      amountINR: 35000,
      tokensConsumed: 1200000,
    });

    CostAttributionEngine.recordCost({
      organizationId: "org_econ_core",
      projectId: "gym_p26_econ_proj",
      initiativeId: "init_gym_econ",
      category: "COMPUTE_WORKER",
      costType: "VERIFIED_COST",
      amountINR: 15000,
      computeHours: 8,
    });

    const totalCost = CostAttributionEngine.getTotalProjectCost("gym_p26_econ_proj");
    expect(totalCost).toBe(50000);

    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p26_econ_proj",
      projectPath: P26_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Economics Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Economics Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P26_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P26_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P26_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P26_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P26_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P26_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P26_PROJ_DIR, "prisma/schema.prisma"),
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

      // 6. Production Release & Staged Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P26_PROJ_DIR,
        projectId: "gym_p26_econ_proj",
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
        projectId: "gym_p26_econ_proj",
        projectPath: P26_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 7. Value Realization & ROI Calculation
      const outcomeReport = OutcomeMeasurementEngine.evaluateOutcome(outcome, 100.0);
      expect(outcomeReport.status).toBe("ACHIEVED");

      const valueAssessment = EngineeringValueEngine.assessValue("init_gym_econ", "gym_p26_econ_proj", 200000, 100, true);
      expect(valueAssessment.classification).toBe("REALIZED");
      expect(valueAssessment.realizedValueINR).toBe(200000);

      const realizationReport = ValueRealizationEngine.calculateRealization(
        "init_gym_econ",
        "gym_p26_econ_proj",
        totalCost,
        200000,
        valueAssessment.realizedValueINR
      );
      expect(realizationReport.verifiedROI).toBe(4.0);
      expect(realizationReport.efficiencyStatus).toBe("HIGH_EFFICIENCY");

      const unitEconomics = EngineeringUnitEconomicsEngine.calculateUnitEconomics({
        projectId: "gym_p26_econ_proj",
        totalCost,
        featuresCount: 2,
        releasesCount: 1,
        generationsCount: 1,
        outcomesCount: 1,
      });
      expect(unitEconomics.costPerFeatureINR).toBe(25000);

      // 8. Record Evidence Claims & Decision
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p26_econ_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Economics Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      ValueDecisionLedger.recordDecision({
        actorId: "cfo_delegate_1",
        organizationId: "org_econ_core",
        projectId: "gym_p26_econ_proj",
        operation: "VERIFY_VALUE_REALIZATION",
        decisionType: "ROI_CALCULATED",
        investmentAmountINR: totalCost,
        realizedValueINR: valueAssessment.realizedValueINR,
      });

      const recommendation = EnterpriseValueDecisionEngine.evaluateInvestment(
        "gym_p26_econ_proj",
        realizationReport.realizationRate,
        realizationReport.verifiedROI
      );
      expect(recommendation.recommendedAction).toBe("ACCELERATE");

      // 9. Master Enterprise Value Gate Certification (All 15 Tiers)
      const valCert = EnterpriseValueGate.evaluate(P26_PROJ_DIR, "org_econ_core");
      expect(valCert.status).toBe("ENTERPRISE_VALUE_CERTIFIED");
      expect(valCert.totalCertifiedGates).toBe(15);
      expect(existsSync(join(P26_PROJ_DIR, ".aegis", "enterprise-value-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("econ_worker_1", "gym_p26_econ_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
