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
import { AdaptiveStrategyEngine } from "../adaptive-strategy-engine.js";
import { OutcomeLearningEngine } from "../outcome-learning-engine.js";
import { CapacityAllocationEngine } from "../capacity-allocation-engine.js";
import { StrategicScenarioEngine } from "../strategic-scenario-engine.js";
import { PortfolioRebalancer } from "../portfolio-rebalancer.js";
import { AdaptiveRoadmapEngine } from "../adaptive-roadmap-engine.js";
import { StrategyDecisionLedger } from "../strategy-decision-ledger.js";
import { EnterpriseOptimizationGate } from "../enterprise-optimization-gate.js";
import { EnterpriseDecisionLedger } from "../../collaboration/decision-ledger.js";
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

const P25_PROJ_DIR = join(process.cwd(), ".tmp_test_p25_e2e");

describe("AEGIS Phase 25 — Master Enterprise Optimization & Adaptive Strategy E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P25_PROJ_DIR)) rmSync(P25_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P25_PROJ_DIR, { recursive: true });
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
    OutcomeLearningEngine.reset();
    AdaptiveRoadmapEngine.reset();
    StrategyDecisionLedger.reset();
    EnterpriseDecisionLedger.reset();
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
    OutcomeLearningEngine.reset();
    AdaptiveRoadmapEngine.reset();
    StrategyDecisionLedger.reset();
    EnterpriseDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P25_PROJ_DIR)) rmSync(P25_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete adaptive optimization lifecycle across all 14 governance tiers and issues EnterpriseOptimizationCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_adaptive_core",
      name: "Adaptive Strategy Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_strat", name: "Strategic Architecture", memberUserIds: ["strat_lead_1"] }],
      projectIds: ["gym_p25_adapt_proj"],
    });

    IdentityManager.registerActor({
      userId: "strat_lead_1",
      name: "Strategic Lead",
      organizationId: "org_adaptive_core",
      role: "PLATFORM_ADMIN",
    });

    // 2. Evaluate Outcome Prediction Calibration
    const learningRecord = OutcomeLearningEngine.recordCalibration("init_api_boost", 99.95, 99.92);
    expect(learningRecord.predictionAccuracy).toBeGreaterThan(95);

    // 3. Capacity & Scenario Evaluation
    const cap = CapacityAllocationEngine.evaluateTeamCapacity("t_strat", 100, 75);
    expect(cap.status).toBe("BALANCED");

    const sim = StrategicScenarioEngine.simulateScenario("Adaptive Core Rebalancing", "MODERATE");
    expect(sim.mutationsAttempted).toBe(0);

    // 4. Adaptive Strategy Evaluation & Portfolio Rebalancing
    const evalStrategy = AdaptiveStrategyEngine.evaluateStrategy("org_adaptive_core", 95, 75);
    expect(evalStrategy.recommendedAction).toBe("CONTINUE_STRATEGY");

    const roadmapV1 = AdaptiveRoadmapEngine.publishRoadmapVersion(
      "org_adaptive_core",
      [
        {
          initiativeId: "init_gym_adaptive",
          organizationId: "org_adaptive_core",
          name: "Gym Adaptive Optimization",
          description: "Self-improving gym core",
          businessObjective: "Modernization",
          affectedProjects: ["gym_p25_adapt_proj"],
          priorityClass: "CRITICAL",
          status: "APPROVED",
          createdAt: new Date().toISOString(),
        },
      ],
      "Baseline adaptive roadmap published"
    );
    expect(roadmapV1.version).toBe(1);

    // 5. Secret Redaction & Worker Lease
    SecretProvider.setSecret("ADAPT_TOKEN", "secure_adaptive_token_7788");
    expect(SecretProvider.maskSecrets("Bearer secure_adaptive_token_7788")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("adapt_worker_1");
    expect(WorkerManager.acquireLease("adapt_worker_1", "gym_p25_adapt_proj", "job_p25_adapt")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_adaptive_core",
      projectId: "gym_p25_adapt_proj",
      name: "Gym Adaptive Master Node",
      projectPath: P25_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 6. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p25_adapt_proj",
      projectPath: P25_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Adaptive Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Adaptive Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P25_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P25_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P25_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P25_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P25_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P25_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P25_PROJ_DIR, "prisma/schema.prisma"),
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

      // 7. Production Release & Staged Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P25_PROJ_DIR,
        projectId: "gym_p25_adapt_proj",
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
        projectId: "gym_p25_adapt_proj",
        projectPath: P25_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 8. Record Evidence Claims & Strategy Decisions
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p25_adapt_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Adaptive Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      StrategyDecisionLedger.recordDecision({
        decisionId: "strat_dec_p25",
        actorId: "strat_lead_1",
        organizationId: "org_adaptive_core",
        operation: "ADAPTIVE_STRATEGY_VALIDATED",
        recommendation: "Maintain Current Balanced Roadmap",
        decision: "APPROVED",
        reason: "Telemetric outcomes match predictions at 99%+ accuracy.",
      });

      // 9. Master Enterprise Optimization Gate Certification (All 14 Tiers)
      const optCert = EnterpriseOptimizationGate.evaluate(P25_PROJ_DIR, "org_adaptive_core");
      expect(optCert.status).toBe("ENTERPRISE_OPTIMIZATION_CERTIFIED");
      expect(optCert.totalCertifiedGates).toBe(14);
      expect(existsSync(join(P25_PROJ_DIR, ".aegis", "enterprise-optimization-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("adapt_worker_1", "gym_p25_adapt_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
