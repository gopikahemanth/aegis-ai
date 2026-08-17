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
import { PortfolioIntelligenceEngine } from "../portfolio-intelligence.js";
import { InitiativePrioritizer } from "../initiative-prioritizer.js";
import { StrategicRoadmapEngine } from "../roadmap-engine.js";
import { PortfolioSimulator } from "../portfolio-simulator.js";
import { StrategicDecisionEngine } from "../strategic-decision-engine.js";
import { StrategicEngineeringGate } from "../strategic-engineering-gate.js";
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

const P23_PROJ_DIR = join(process.cwd(), ".tmp_test_p23_e2e");

describe("AEGIS Phase 23 — Master Strategic Engineering Intelligence E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P23_PROJ_DIR)) rmSync(P23_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P23_PROJ_DIR, { recursive: true });
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
    EnterpriseDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P23_PROJ_DIR)) rmSync(P23_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete strategic intelligence lifecycle across all 12 governance tiers and issues StrategicEngineeringCertificate", async () => {
    // 1. Enterprise Tenancy & Portfolio Setup
    OrganizationManager.createOrganization({
      organizationId: "org_global_strategy_node",
      name: "Global Strategy Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_strat", name: "Strategic Architecture", memberUserIds: ["chief_architect_1"] }],
      projectIds: ["gym_p23_strat_proj"],
    });

    IdentityManager.registerActor({
      userId: "chief_architect_1",
      name: "Chief Strategic Architect",
      organizationId: "org_global_strategy_node",
      role: "PLATFORM_ADMIN",
    });

    // Record baseline strategic metrics
    PortfolioIntelligenceEngine.recordProjectMetrics("org_global_strategy_node", {
      projectId: "gym_p23_strat_proj",
      reliabilityScore: 99,
      securityScore: 100,
      technicalDebtScore: 10,
      complianceScore: 100,
      strategicImportance: "TIER_1_CRITICAL",
    });

    const portfolio = PortfolioIntelligenceEngine.analyzePortfolio("org_global_strategy_node");
    expect(portfolio.overallStrategicHealth).toBe("STABLE");

    // 2. Initiative Prioritization & Roadmapping
    const initiative = {
      initiativeId: "init_gym_core",
      organizationId: "org_global_strategy_node",
      name: "Gym Strategic Core Evolution",
      description: "Build gym management core micro-system",
      businessObjective: "Modernization",
      affectedProjects: ["gym_p23_strat_proj"],
      priorityClass: "MEDIUM" as const,
      status: "PROPOSED" as const,
      createdAt: new Date().toISOString(),
    };

    const prio = InitiativePrioritizer.prioritize(initiative, {
      securityImpact: 95,
      complianceUrgency: 90,
      reliabilityImpact: 85,
      businessValue: 80,
      technicalDebtReduction: 70,
    });
    expect(prio.priorityClass).toBe("CRITICAL");

    const roadmap = StrategicRoadmapEngine.generateRoadmap("org_global_strategy_node", [
      { ...initiative, priorityClass: prio.priorityClass },
    ]);
    expect(roadmap.horizons.find((h) => h.horizon === "NOW")?.initiatives.length).toBe(1);

    // 3. Zero-Mutation What-If Simulation
    const simReport = PortfolioSimulator.simulate("Deploy Gym Strategic Core", ["gym_p23_strat_proj"]);
    expect(simReport.mutationsAttempted).toBe(0);

    const stratDecision = StrategicDecisionEngine.evaluateInitiative(
      "org_global_strategy_node",
      "Gym Strategic Core Evolution",
      ["gym_p23_strat_proj"]
    );
    expect(stratDecision.requiresHumanAuthorization).toBe(true);

    // 4. Secret Redaction & Worker Lease
    SecretProvider.setSecret("STRAT_TOKEN", "secure_strat_token_9900");
    expect(SecretProvider.maskSecrets("postgres://admin:secure_strat_token_9900@db:5432")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("strat_worker_1");
    expect(WorkerManager.acquireLease("strat_worker_1", "gym_p23_strat_proj", "job_p23_strat")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_global_strategy_node",
      projectId: "gym_p23_strat_proj",
      name: "Gym Strategy Master Node",
      projectPath: P23_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 5. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p23_strat_proj",
      projectPath: P23_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Strategy Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Strategy Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P23_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P23_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P23_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P23_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P23_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P23_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P23_PROJ_DIR, "prisma/schema.prisma"),
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

      // 6. Release & Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P23_PROJ_DIR,
        projectId: "gym_p23_strat_proj",
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
        projectId: "gym_p23_strat_proj",
        projectPath: P23_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 7. Record Evidence Claims & Decision
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p23_strat_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Strategy Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      EnterpriseDecisionLedger.recordDecision({
        actorId: "chief_architect_1",
        organizationId: "org_global_strategy_node",
        projectId: "gym_p23_strat_proj",
        operation: "STRATEGIC_INITIATIVE_COMPLETED",
        decision: "APPROVED",
        reason: "Chief Architect validated strategic milestone completion.",
      });

      // 8. Master Strategic Engineering Gate Certification (All 12 Tiers)
      const stratCert = StrategicEngineeringGate.evaluate(P23_PROJ_DIR, "org_global_strategy_node");
      expect(stratCert.status).toBe("STRATEGIC_ENGINEERING_CERTIFIED");
      expect(stratCert.totalCertifiedGates).toBe(12);
      expect(existsSync(join(P23_PROJ_DIR, ".aegis", "strategic-engineering-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("strat_worker_1", "gym_p23_strat_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
