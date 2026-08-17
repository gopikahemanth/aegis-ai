import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { AegisPlatform } from "../../platform/aegis-platform.js";
import { WorkerManager } from "../../platform/worker-manager.js";
import { IdentityManager } from "../../identity/identity-manager.js";
import { SecretProvider } from "../../security/secret-provider.js";
import { EvidenceLedger } from "../../validation/production-validation/evidence-ledger.js";
import { OrganizationManager } from "../organization-manager.js";
import { EnterpriseAuthorization } from "../enterprise-authorization.js";
import { PolicyConflictEngine } from "../policy-conflict-engine.js";
import { ComplianceEvidenceEngine } from "../../compliance/compliance-evidence-engine.js";
import { EnterpriseGovernanceGate } from "../enterprise-governance-gate.js";
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

const P21_PROJ_DIR = join(process.cwd(), ".tmp_test_p21_e2e");

describe("AEGIS Phase 21 — Master Enterprise Platform Governance E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P21_PROJ_DIR)) rmSync(P21_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P21_PROJ_DIR, { recursive: true });
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
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P21_PROJ_DIR)) rmSync(P21_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete enterprise governance lifecycle across all 10 governance tiers and issues EnterpriseGovernanceCertificate", async () => {
    // 1. Enterprise Tenancy & Policy
    OrganizationManager.createOrganization({
      organizationId: "org_global_enterprise_node",
      name: "Global Enterprise Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_eng", name: "Engineering Core", memberUserIds: ["lead_arch_1"] }],
      projectIds: ["gym_p21_ent_proj"],
    });

    IdentityManager.registerActor({
      userId: "lead_arch_1",
      name: "Lead Enterprise Architect",
      organizationId: "org_global_enterprise_node",
      role: "PLATFORM_ADMIN",
    });

    const authCheck = EnterpriseAuthorization.evaluate(
      "lead_arch_1",
      "org_global_enterprise_node",
      "gym_p21_ent_proj",
      "production",
      "DEPLOY_PRODUCTION"
    );
    expect(authCheck.verdict).toBe("ALLOW");

    const policy = PolicyConflictEngine.resolve([
      { level: "PLATFORM", requireHumanApprovalForDestructiveMigrations: true, maxConcurrentJobs: 10 },
      { level: "ORGANIZATION", requireHumanApprovalForDestructiveMigrations: true, maxConcurrentJobs: 8 },
    ]);
    expect(policy.requireHumanApprovalForDestructiveMigrations).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_global_enterprise_node",
      projectId: "gym_p21_ent_proj",
      name: "Gym Enterprise Master Node",
      projectPath: P21_PROJ_DIR,
    });

    // 2. Secret Redaction & Worker Lease
    SecretProvider.setSecret("ENTERPRISE_SECRET", "super_ent_secret_token_1122");
    expect(SecretProvider.maskSecrets("postgres://admin:super_ent_secret_token_1122@db:5432")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("ent_worker_primary");
    expect(WorkerManager.acquireLease("ent_worker_primary", "gym_p21_ent_proj", "job_p21_ent")).toBe(true);

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 3. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p21_ent_proj",
      projectPath: P21_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Enterprise Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Enterprise Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P21_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P21_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P21_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P21_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P21_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P21_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P21_PROJ_DIR, "prisma/schema.prisma"),
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

      // 4. Release Certification & Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P21_PROJ_DIR,
        projectId: "gym_p21_ent_proj",
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
        projectId: "gym_p21_ent_proj",
        projectPath: P21_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 5. Evidence Ledger Claims
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p21_ent_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Enterprise Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      // 6. Master Enterprise Governance Gate Certification (All 10 Tiers)
      const entCert = EnterpriseGovernanceGate.evaluate(P21_PROJ_DIR, "org_global_enterprise_node");
      expect(entCert.status).toBe("ENTERPRISE_GOVERNANCE_CERTIFIED");
      expect(entCert.totalCertifiedGates).toBe(10);
      expect(existsSync(join(P21_PROJ_DIR, ".aegis", "enterprise-governance-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("ent_worker_primary", "gym_p21_ent_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
