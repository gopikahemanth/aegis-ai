import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
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
import { EngineeringCertificationGate } from "../engineering-certification-gate.js";
import { EngineeringWorkQueue } from "../engineering-work-queue.js";
import { AutonomousDecisionEngine } from "../autonomous-decision-engine.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";
import { GoldenWorkflowRegistry } from "../../evolution/golden-workflow-registry.js";
import { TaskFileLockManager } from "../../governance/file-ownership-registry.js";
import { TaskCacheManager } from "../../execution/task-cache.js";
import { DeploymentInventory } from "../../operations/deployment-inventory.js";
import { ProductionStateManager } from "../../operations/production-state.js";

const P17_PROJ_DIR = join(process.cwd(), ".tmp_test_p17_e2e");

describe("AEGIS Phase 17 — Master Autonomous Command Center & Self-Optimizing Platform E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P17_PROJ_DIR)) rmSync(P17_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P17_PROJ_DIR, { recursive: true });
    JobOrchestrator.reset();
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
    TaskCacheManager.clear();
    IncidentEngine.reset();
    DeploymentInventory.reset();
    ProductionStateManager.reset();
    FleetManager.reset();
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
    EngineeringLearningEngine.clear();
    EngineeringWorkQueue.clear();
    if (existsSync(P17_PROJ_DIR)) rmSync(P17_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete closed-loop: Fleet -> G1 Release -> Anomaly -> Decision -> Simulation -> Proposal -> Work Queue -> Learning -> Forecast -> Master Engineering Certificate", async () => {
    // 1. Fleet Registration
    FleetManager.registerProject({
      projectId: "gym_p17_project",
      name: "Gym Management Node",
      projectPath: P17_PROJ_DIR,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: ["production"],
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 2. Generation 1
    const jobG1 = JobOrchestrator.createJob({
      projectId: "gym_p17_project",
      projectPath: P17_PROJ_DIR,
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
          mkdirSync(join(P17_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P17_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P17_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P17_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P17_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P17_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P17_PROJ_DIR, "prisma/schema.prisma"),
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

      // 3. Release & Deploy G1
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P17_PROJ_DIR,
        projectId: "gym_p17_project",
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
        projectId: "gym_p17_project",
        projectPath: P17_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 4. Decision Engine Evaluation
      const decision = AutonomousDecisionEngine.evaluate("gym_p17_project", {
        isLatencySpike: true,
        recentReleaseId: releaseCertG1.releaseId,
      });
      expect(decision.action).toBe("SIMULATE");

      // 5. Zero-Mutation What-If Simulation
      const simulation = EngineeringSimulator.simulate("gym_p17_project", "SCHEMA_CHANGE", ["prisma/schema.prisma"]);
      expect(simulation.diskMutations).toBe(0);
      expect(simulation.predictedImpact).toBe("HIGH_RISK");

      // 6. Governed Work Queue
      const queueItem = EngineeringWorkQueue.enqueue({
        projectId: "gym_p17_project",
        environment: "production",
        title: "Mitigate connection latency with pool scaling",
        priority: "HIGH",
        category: "SLO",
        proposedAction: "Scale PostgreSQL pool",
        authorizationRequired: true,
      });
      expect(EngineeringWorkQueue.listItems("gym_p17_project").length).toBe(1);

      // 7. Record Learning Outcome
      EngineeringLearningEngine.recordOutcome(
        "LATENCY_SIMULATION",
        "HIGH_RISK",
        "HIGH_RISK"
      );
      expect(EngineeringLearningEngine.getAverageAccuracy()).toBe(1.0);

      // 8. Forecast Reliability
      const forecast = ReliabilityForecaster.forecast("gym_p17_project", 95, 0);
      expect(forecast.sloBreachRisk).toBe("LOW");

      // 9. Master Engineering Certification Gate
      const masterCert = EngineeringCertificationGate.evaluate(P17_PROJ_DIR);
      expect(masterCert.status).toBe("ENGINEERING_CERTIFIED");
      expect(existsSync(join(P17_PROJ_DIR, ".aegis", "engineering-certificate.json"))).toBe(true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
