import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { AegisPlatform } from "../../../platform/aegis-platform.js";
import { WorkerManager } from "../../../platform/worker-manager.js";
import { IdentityManager } from "../../../identity/identity-manager.js";
import { SecretProvider } from "../../../security/secret-provider.js";
import { EvidenceLedger } from "../evidence-ledger.js";
import { ProductionValidationEngine } from "../production-validation-engine.js";
import { ProductionValidationGate } from "../production-validation-gate.js";
import { SecurityCertificationGate } from "../../../security/certification/security-certification-gate.js";
import { ProductionRunbookEngine } from "../../../runbook/production-runbook-engine.js";
import { JobOrchestrator } from "../../../control-plane/job-orchestrator.js";
import { ProductionReleaseGate } from "../../../production/production-release-gate.js";
import { DeploymentOrchestrator } from "../../../operations/deployment-orchestrator.js";
import { ProductionHealthMonitor } from "../../../operations/production-health-monitor.js";
import { IncidentEngine } from "../../../operations/incident-engine.js";
import { AnomalyDetector } from "../../../intelligence/anomaly-detector.js";
import { RootCauseAnalyzer } from "../../../operations/root-cause-analyzer.js";
import { IncidentRemediationEngine } from "../../../intelligence/incident-remediation-engine.js";
import { EngineeringSimulator } from "../../../simulation/engineering-simulator.js";
import { SloEngine } from "../../../intelligence/slo-engine.js";
import { EngineeringLearningEngine } from "../../../learning/engineering-learning-engine.js";
import { ReliabilityForecaster } from "../../../reliability/reliability-forecaster.js";
import { FleetManager } from "../../../fleet/fleet-manager.js";
import { FleetOperationsGate } from "../../../fleet/fleet-operations-gate.js";
import { EngineeringCertificationGate } from "../../../command-center/engineering-certification-gate.js";
import { PlatformCertificationGate } from "../../../platform/platform-certification-gate.js";
import { RuntimeProcessManager } from "../../../execution/runtime-process-manager.js";
import { GoldenWorkflowRegistry } from "../../../evolution/golden-workflow-registry.js";
import { TaskFileLockManager } from "../../../governance/file-ownership-registry.js";
import { TaskCacheManager } from "../../../execution/task-cache.js";
import { DeploymentInventory } from "../../../operations/deployment-inventory.js";
import { ProductionStateManager } from "../../../operations/production-state.js";

const P19_PROJ_DIR = join(process.cwd(), ".tmp_test_p19_real_e2e");

describe("AEGIS Phase 19 — Master Real-World Production & Security Certification E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P19_PROJ_DIR)) rmSync(P19_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P19_PROJ_DIR, { recursive: true });
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
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P19_PROJ_DIR)) rmSync(P19_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete real-world production lifecycle across all 8 governance tiers and issues ProductionValidationCertificate", async () => {
    // 1. Identity & Tenant Setup
    IdentityManager.registerActor({
      userId: "user_lead_architect",
      name: "Lead Architect",
      organizationId: "org_global_acme",
      role: "PLATFORM_ADMIN",
    });

    AegisPlatform.createProject({
      organizationId: "org_global_acme",
      projectId: "gym_p19_real_proj",
      name: "Gym Production Master Node",
      projectPath: P19_PROJ_DIR,
    });

    // 2. Secret Redaction
    SecretProvider.setSecret("PROD_DB_SECRET", "super_secure_vault_pass_999");
    expect(SecretProvider.maskSecrets("postgres://admin:super_secure_vault_pass_999@db:5432")).toContain("[REDACTED_SECRET]");

    // 3. Worker Lease
    WorkerManager.heartbeat("primary_worker_node");
    expect(WorkerManager.acquireLease("primary_worker_node", "gym_p19_real_proj", "job_p19_real")).toBe(true);

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 4. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p19_real_proj",
      projectPath: P19_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Production Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Production Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P19_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P19_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P19_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P19_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P19_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P19_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P19_PROJ_DIR, "prisma/schema.prisma"),
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

      // 5. Release Certification
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P19_PROJ_DIR,
        projectId: "gym_p19_real_proj",
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

      // 6. Deployment
      const deployG1 = await DeploymentOrchestrator.executeDeployment({
        projectId: "gym_p19_real_proj",
        projectPath: P19_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 7. Record Verified Claim in Evidence Ledger
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p19_real_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Production Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      // 8. Runbook Retrieval
      const dbRunbook = ProductionRunbookEngine.getRunbook("DATABASE_FAILURE");
      expect(dbRunbook?.steps.length).toBe(8);

      // 9. Production Validation Engine
      const validationReport = await ProductionValidationEngine.validateProject(
        P19_PROJ_DIR,
        "gym_p19_real_proj",
        "production",
        baseUrl
      );
      expect(validationReport.status).toBe("PRODUCTION_READY");

      // 10. Ultimate Production Validation Gate Certification
      const ultimateCert = ProductionValidationGate.evaluate(P19_PROJ_DIR);
      expect(ultimateCert.status).toBe("PRODUCTION_VALIDATED");
      expect(ultimateCert.totalCertifiedGates).toBe(8);
      expect(existsSync(join(P19_PROJ_DIR, ".aegis", "production-validation-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("primary_worker_node", "gym_p19_real_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
