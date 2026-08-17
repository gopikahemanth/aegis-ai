import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { AegisPlatform } from "../../platform/aegis-platform.js";
import { WorkerManager } from "../../platform/worker-manager.js";
import { IdentityManager } from "../../identity/identity-manager.js";
import { SecretProvider } from "../../security/secret-provider.js";
import { EvidenceLedger } from "../../validation/production-validation/evidence-ledger.js";
import { AegisStateReconciler } from "../aegis-state-reconciler.js";
import { AegisHealthEngine } from "../aegis-health-engine.js";
import { PolicyIntegrityValidator } from "../policy-integrity-validator.js";
import { SelfManagementGate } from "../self-management-gate.js";
import { ProductionValidationGate } from "../../validation/production-validation/production-validation-gate.js";
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
import { PlatformCertificationGate } from "../../platform/platform-certification-gate.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";
import { GoldenWorkflowRegistry } from "../../evolution/golden-workflow-registry.js";
import { TaskFileLockManager } from "../../governance/file-ownership-registry.js";
import { TaskCacheManager } from "../../execution/task-cache.js";
import { DeploymentInventory } from "../../operations/deployment-inventory.js";
import { ProductionStateManager } from "../../operations/production-state.js";

const P20_PROJ_DIR = join(process.cwd(), ".tmp_test_p20_e2e");

describe("AEGIS Phase 20 — Master Self-Managing Platform E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P20_PROJ_DIR)) rmSync(P20_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P20_PROJ_DIR, { recursive: true });
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
    if (existsSync(P20_PROJ_DIR)) rmSync(P20_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete self-managing lifecycle across all 9 governance tiers and issues SelfManagementCertificate", async () => {
    // 1. Self-State Discovery & Policy Validation
    const stateAudit = AegisStateReconciler.reconcile(process.cwd());
    expect(stateAudit.status).toBe("CONVERGED");

    const policyReport = PolicyIntegrityValidator.validatePolicyIntegrity();
    expect(policyReport.immutablePoliciesPreserved).toBe(true);

    const selfHealth = AegisHealthEngine.evaluateSelfHealth();
    expect(selfHealth.overallStatus).toBe("HEALTHY");

    // 2. Identity & Tenant Setup
    IdentityManager.registerActor({
      userId: "user_chief_architect",
      name: "Chief Architect",
      organizationId: "org_global_enterprise",
      role: "PLATFORM_ADMIN",
    });

    AegisPlatform.createProject({
      organizationId: "org_global_enterprise",
      projectId: "gym_p20_self_proj",
      name: "Gym Self-Governing Master Node",
      projectPath: P20_PROJ_DIR,
    });

    // 3. Secret Redaction & Worker Lease
    SecretProvider.setSecret("MASTER_DB_PASS", "ultra_vault_pass_9988");
    expect(SecretProvider.maskSecrets("postgres://admin:ultra_vault_pass_9988@db:5432")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("self_governing_worker_1");
    expect(WorkerManager.acquireLease("self_governing_worker_1", "gym_p20_self_proj", "job_p20_self")).toBe(true);

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 4. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p20_self_proj",
      projectPath: P20_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Self-Governing Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Self-Governing Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P20_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P20_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P20_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P20_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P20_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P20_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P20_PROJ_DIR, "prisma/schema.prisma"),
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

      // 5. Release Certification & Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P20_PROJ_DIR,
        projectId: "gym_p20_self_proj",
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
        projectId: "gym_p20_self_proj",
        projectPath: P20_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 6. Record Evidence Claim
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p20_self_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Self-Governing Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      // 7. Master Self-Management Gate Certification
      const selfMgmtCert = SelfManagementGate.evaluate(P20_PROJ_DIR);
      expect(selfMgmtCert.status).toBe("SELF_MANAGEMENT_CERTIFIED");
      expect(selfMgmtCert.totalCertifiedGates).toBe(9);
      expect(existsSync(join(P20_PROJ_DIR, ".aegis", "self-management-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("self_governing_worker_1", "gym_p20_self_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
