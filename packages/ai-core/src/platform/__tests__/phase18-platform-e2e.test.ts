import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { AegisPlatform } from "../aegis-platform.js";
import { WorkerManager } from "../worker-manager.js";
import { IdentityManager } from "../../identity/identity-manager.js";
import { SecretProvider } from "../../security/secret-provider.js";
import { ChangeProposalEngine } from "../../integrations/code-review/change-proposal-engine.js";
import { JobOrchestrator } from "../../control-plane/job-orchestrator.js";
import { ProductionReleaseGate } from "../../production/production-release-gate.js";
import { DeploymentOrchestrator } from "../../operations/deployment-orchestrator.js";
import { ProductionHealthMonitor } from "../../operations/production-health-monitor.js";
import { IncidentEngine } from "../../operations/incident-engine.js";
import { AnomalyDetector } from "../../intelligence/anomaly-detector.js";
import { RootCauseAnalyzer } from "../../operations/root-cause-analyzer.js";
import { IncidentRemediationEngine } from "../../intelligence/incident-remediation-engine.js";
import { EngineeringSimulator } from "../../simulation/engineering-simulator.js";
import { SloEngine } from "../../intelligence/slo-engine.js";
import { EngineeringLearningEngine } from "../../learning/engineering-learning-engine.js";
import { ReliabilityForecaster } from "../../reliability/reliability-forecaster.js";
import { FleetManager } from "../../fleet/fleet-manager.js";
import { FleetOperationsGate } from "../../fleet/fleet-operations-gate.js";
import { EngineeringCertificationGate } from "../../command-center/engineering-certification-gate.js";
import { PlatformCertificationGate } from "../platform-certification-gate.js";
import { EngineeringWorkQueue } from "../../command-center/engineering-work-queue.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";
import { GoldenWorkflowRegistry } from "../../evolution/golden-workflow-registry.js";
import { TaskFileLockManager } from "../../governance/file-ownership-registry.js";
import { TaskCacheManager } from "../../execution/task-cache.js";
import { DeploymentInventory } from "../../operations/deployment-inventory.js";
import { ProductionStateManager } from "../../operations/production-state.js";

const P18_PROJ_DIR = join(process.cwd(), ".tmp_test_p18_e2e");

describe("AEGIS Phase 18 — Master Enterprise Platform E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P18_PROJ_DIR)) rmSync(P18_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P18_PROJ_DIR, { recursive: true });
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
    SecretProvider.clear();
    EngineeringLearningEngine.clear();
    EngineeringWorkQueue.clear();
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
    SecretProvider.clear();
    EngineeringLearningEngine.clear();
    EngineeringWorkQueue.clear();
    if (existsSync(P18_PROJ_DIR)) rmSync(P18_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete enterprise platform lifecycle: Org/User -> Worker Lease -> Secret Isolation -> Generation -> 7-Layer Certification -> Change Proposal -> Deployment -> Platform Certificate", async () => {
    // 1. Register Actor and Project under Organization
    IdentityManager.registerActor({
      userId: "user_lead_eng",
      name: "Lead Engineer",
      organizationId: "org_enterprise",
      role: "RELEASE_MANAGER",
    });

    AegisPlatform.createProject({
      organizationId: "org_enterprise",
      projectId: "gym_p18_project",
      name: "Gym Enterprise Platform Node",
      projectPath: P18_PROJ_DIR,
    });

    // 2. Secret Isolation
    SecretProvider.setSecret("DATABASE_PASSWORD", "enterprise_secret_token_1234");
    expect(SecretProvider.maskSecrets("postgres://user:enterprise_secret_token_1234@db:5432")).toContain("[REDACTED_SECRET]");

    // 3. Worker Lease Acquisition
    WorkerManager.heartbeat("worker_node_1");
    const leaseGranted = WorkerManager.acquireLease("worker_node_1", "gym_p18_project", "job_p18_1");
    expect(leaseGranted).toBe(true);

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 4. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p18_project",
      projectPath: P18_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Enterprise Dashboard</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Enterprise Dashboard" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P18_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P18_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P18_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P18_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P18_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P18_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P18_PROJ_DIR, "prisma/schema.prisma"),
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

      // 5. Release & Deploy G1
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P18_PROJ_DIR,
        projectId: "gym_p18_project",
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

      const authCheck = IdentityManager.authorizeOperation("user_lead_eng", "DEPLOY_PRODUCTION", "org_enterprise");
      expect(authCheck.authorized).toBe(true);

      const deployG1 = await DeploymentOrchestrator.executeDeployment({
        projectId: "gym_p18_project",
        projectPath: P18_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 6. Generate External Change Proposal
      const proposal = ChangeProposalEngine.createProposal(
        "gym_p18_project",
        completedG1.generationId,
        ["src/features/members/MemberList.tsx", "server/routes/members.ts", "prisma/schema.prisma"],
        true
      );
      expect(proposal.verificationStatus).toBe("VERIFIED");

      // 7. Supreme Platform Certification Gate
      const supremeCert = AegisPlatform.evaluatePlatformCertification(P18_PROJ_DIR);
      expect(supremeCert.status).toBe("PLATFORM_CERTIFIED");
      expect(supremeCert.governanceGatesPassed).toBe(7);
      expect(existsSync(join(P18_PROJ_DIR, ".aegis", "platform-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("worker_node_1", "gym_p18_project");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
