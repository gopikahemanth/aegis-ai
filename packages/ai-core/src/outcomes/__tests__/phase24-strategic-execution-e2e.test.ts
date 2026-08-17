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
import { OutcomeDefinitionManager } from "../outcome-definition.js";
import { OutcomeMeasurementEngine } from "../outcome-measurement-engine.js";
import { StrategicExecutionPlanner } from "../strategic-execution-planner.js";
import { OutcomeAuthorizationManager } from "../outcome-authorization.js";
import { StrategicExecutionGate } from "../strategic-execution-gate.js";
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

const P24_PROJ_DIR = join(process.cwd(), ".tmp_test_p24_e2e");

describe("AEGIS Phase 24 — Master Strategic Execution & Outcome Governance E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P24_PROJ_DIR)) rmSync(P24_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P24_PROJ_DIR, { recursive: true });
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
    OutcomeAuthorizationManager.reset();
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
    OutcomeAuthorizationManager.reset();
    EnterpriseDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P24_PROJ_DIR)) rmSync(P24_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete outcome governance lifecycle across all 13 governance tiers and issues StrategicExecutionCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_outcome_core",
      name: "Outcome Governance Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_exec", name: "Executive Engineering", memberUserIds: ["exec_sponsor_1"] }],
      projectIds: ["gym_p24_exec_proj"],
    });

    IdentityManager.registerActor({
      userId: "exec_sponsor_1",
      name: "Executive Sponsor",
      organizationId: "org_outcome_core",
      role: "PLATFORM_ADMIN",
    });

    // 2. Define Strategic Business Outcome
    const outcome = OutcomeDefinitionManager.defineOutcome({
      outcomeId: "out_gym_reliability",
      initiativeId: "init_gym_exec",
      organizationId: "org_outcome_core",
      name: "Gym Production API Zero Failure Rate",
      metric: "Successful API Calls %",
      baselineValue: 90.0,
      targetValue: 100.0,
      measurementUnit: "%",
      deadline: "2026-12-31",
    });
    expect(outcome.status).toBe("ON_TRACK");

    // 3. Outcome-Based Scoped Authorization
    const authResult = OutcomeAuthorizationManager.authorizeExecution({
      authorizationId: "auth_gym_exec_1",
      initiativeId: "init_gym_exec",
      organizationId: "org_outcome_core",
      authorizerUserId: "exec_sponsor_1",
      targetProjects: ["gym_p24_exec_proj"],
      expectedOutcome: "100% Successful API Calls",
    });
    expect(authResult.success).toBe(true);

    // 4. Strategic Execution Plan
    const execPlan = StrategicExecutionPlanner.planExecution("init_gym_exec", ["gym_p24_exec_proj"]);
    expect(execPlan.tasks.length).toBe(1);

    // 5. Secret Masking & Worker Lease
    SecretProvider.setSecret("OUTCOME_KEY", "secure_outcome_key_1122");
    expect(SecretProvider.maskSecrets("Bearer secure_outcome_key_1122")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("exec_worker_1");
    expect(WorkerManager.acquireLease("exec_worker_1", "gym_p24_exec_proj", "job_p24_exec")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_outcome_core",
      projectId: "gym_p24_exec_proj",
      name: "Gym Execution Master Node",
      projectPath: P24_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 6. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p24_exec_proj",
      projectPath: P24_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Execution Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Execution Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P24_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P24_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P24_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P24_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P24_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P24_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P24_PROJ_DIR, "prisma/schema.prisma"),
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
        projectPath: P24_PROJ_DIR,
        projectId: "gym_p24_exec_proj",
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
        projectId: "gym_p24_exec_proj",
        projectPath: P24_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 8. Outcome Measurement (Observed Telemetry)
      const outcomeReport = OutcomeMeasurementEngine.evaluateOutcome(outcome, 100.0);
      expect(outcomeReport.status).toBe("ACHIEVED");
      expect(outcomeReport.achievementPercentage).toBe(100);

      // 9. Record Evidence Claims & Decision
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p24_exec_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Execution Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      EnterpriseDecisionLedger.recordDecision({
        actorId: "exec_sponsor_1",
        organizationId: "org_outcome_core",
        projectId: "gym_p24_exec_proj",
        operation: "STRATEGIC_OUTCOME_ACHIEVED",
        decision: "APPROVED",
        reason: "Executive Sponsor confirmed 100% outcome achievement via telemetry.",
      });

      // 10. Master Strategic Execution Gate Certification (All 13 Tiers)
      const execCert = StrategicExecutionGate.evaluate(P24_PROJ_DIR, "org_outcome_core");
      expect(execCert.status).toBe("STRATEGIC_EXECUTION_CERTIFIED");
      expect(execCert.totalCertifiedGates).toBe(13);
      expect(existsSync(join(P24_PROJ_DIR, ".aegis", "strategic-execution-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("exec_worker_1", "gym_p24_exec_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
