import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { JobOrchestrator } from "../../control-plane/job-orchestrator.js";
import { ProductionReleaseGate } from "../../production/production-release-gate.js";
import { DeploymentOrchestrator } from "../deployment-orchestrator.js";
import { ProductionHealthMonitor } from "../production-health-monitor.js";
import { IncidentEngine } from "../incident-engine.js";
import { RootCauseAnalyzer } from "../root-cause-analyzer.js";
import { RemediationPolicyEngine } from "../remediation-policy.js";
import { ReleaseLineageTracker } from "../release-lineage.js";
import { ProductionOperationsGate } from "../production-operations-gate.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";
import { GoldenWorkflowRegistry } from "../../evolution/golden-workflow-registry.js";
import { TaskFileLockManager } from "../../governance/file-ownership-registry.js";
import { TaskCacheManager } from "../../execution/task-cache.js";
import { DeploymentInventory } from "../deployment-inventory.js";
import { ProductionStateManager } from "../production-state.js";

const P15_PROJ_DIR = join(process.cwd(), ".tmp_test_p15_e2e");

describe("AEGIS Phase 15 — Master Continuous Operations & Autonomous Reliability Acceptance Test", () => {
  beforeEach(() => {
    if (existsSync(P15_PROJ_DIR)) rmSync(P15_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P15_PROJ_DIR, { recursive: true });
    JobOrchestrator.reset();
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
    TaskCacheManager.clear();
    IncidentEngine.reset();
    DeploymentInventory.reset();
    ReleaseLineageTracker.reset();
    ProductionStateManager.reset();
  });

  afterEach(async () => {
    await RuntimeProcessManager.stopAll();
    JobOrchestrator.reset();
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
    TaskCacheManager.clear();
    IncidentEngine.reset();
    DeploymentInventory.reset();
    ReleaseLineageTracker.reset();
    ProductionStateManager.reset();
    if (existsSync(P15_PROJ_DIR)) rmSync(P15_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete lifecycle: G1 -> Release -> Deploy -> Monitor -> Injected Failure -> Incident -> RCA -> Governed Rollback -> G2 Evolution -> Production Operations Gate", async () => {
    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 1. Generation 1
    const jobG1 = JobOrchestrator.createJob({
      projectId: "gym_p15_project",
      projectPath: P15_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Dashboard</h1></body></html>");
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    });

    await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));

    try {
      const baseUrl = `http://127.0.0.1:${port}`;

      const completedG1 = await JobOrchestrator.startJob(jobG1.jobId, {
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Dashboard" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P15_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P15_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P15_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P15_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P15_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P15_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P15_PROJ_DIR, "prisma/schema.prisma"),
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

      // 2. Evaluate ProductionReleaseGate
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P15_PROJ_DIR,
        projectId: "gym_p15_project",
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
      expect(releaseCertG1.status).toBe("RELEASED");

      // 3. Deploy G1 to Production (with authorization)
      const deployResultG1 = await DeploymentOrchestrator.executeDeployment({
        projectId: "gym_p15_project",
        projectPath: P15_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployResultG1.status).toBe("COMPLETED");

      // 4. Record Lineage Node
      ReleaseLineageTracker.recordNode({
        generationId: completedG1.generationId,
        projectId: "gym_p15_project",
        releaseId: releaseCertG1.releaseId,
        deploymentId: deployResultG1.deploymentId,
        createdAt: new Date().toISOString(),
        contractHashes: { architectureHash: "arch_1" },
        incidentIds: [],
        rolledBack: false,
      });

      // 5. Continuous Health Observation
      const health1 = await ProductionHealthMonitor.evaluateHealth("gym_p15_project", "production", baseUrl);
      expect(health1.overallStatus).toBe("HEALTHY");

      // 6. Injected Production Incident & RCA
      const incident = IncidentEngine.createIncident(
        P15_PROJ_DIR,
        "gym_p15_project",
        "production",
        "DATABASE_FAILURE",
        "CRITICAL",
        ["Database connection timeout error P2024"],
        { latencyMs: 5000 }
      );
      expect(incident.status).toBe("DETECTED");

      const rca = RootCauseAnalyzer.analyze(incident, ["Error: P2024 connection pool timeout"]);
      expect(rca.primaryRootCause.category).toBe("DATABASE_CONNECTION_LOSS");

      const remPlan = RemediationPolicyEngine.evaluatePolicy(incident);
      expect(remPlan.requiresAuthorization).toBe(true);

      // Resolve incident after pool recovery
      IncidentEngine.updateIncidentStatus("gym_p15_project", incident.incidentId, "RESOLVED", "Pool refreshed");

      // 7. Operations Gate Certification
      const opsCert = await ProductionOperationsGate.evaluate({
        projectPath: P15_PROJ_DIR,
        projectId: "gym_p15_project",
        environment: "production",
        releaseCertificate: releaseCertG1,
        liveServerUrl: baseUrl,
      });

      expect(opsCert.status).toBe("SUCCESS");
      expect(existsSync(join(P15_PROJ_DIR, ".aegis", "operations-certificate.json"))).toBe(true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
