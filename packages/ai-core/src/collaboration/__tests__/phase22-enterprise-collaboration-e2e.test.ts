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
import { EnterpriseWorkflowEngine } from "../workflow-engine.js";
import { AssignmentEngine } from "../assignment-engine.js";
import { ApprovalCenter } from "../approval-center.js";
import { DependencyCoordinationEngine } from "../dependency-coordination.js";
import { NotificationOrchestrator } from "../notification-orchestrator.js";
import { EnterpriseDecisionLedger } from "../decision-ledger.js";
import { EnterpriseCollaborationGate } from "../enterprise-collaboration-gate.js";
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

const P22_PROJ_DIR = join(process.cwd(), ".tmp_test_p22_e2e");

describe("AEGIS Phase 22 — Master Enterprise Collaboration & Governance E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P22_PROJ_DIR)) rmSync(P22_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P22_PROJ_DIR, { recursive: true });
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
    EnterpriseWorkflowEngine.reset();
    AssignmentEngine.reset();
    ApprovalCenter.reset();
    DependencyCoordinationEngine.reset();
    NotificationOrchestrator.reset();
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
    EnterpriseWorkflowEngine.reset();
    AssignmentEngine.reset();
    ApprovalCenter.reset();
    DependencyCoordinationEngine.reset();
    NotificationOrchestrator.reset();
    EnterpriseDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P22_PROJ_DIR)) rmSync(P22_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete enterprise collaboration lifecycle across all 11 governance tiers and issues EnterpriseCollaborationCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_collab_node",
      name: "Collaboration Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_core", name: "Core Engineering", memberUserIds: ["lead_arch_1", "rel_mgr_1"] }],
      projectIds: ["gym_p22_collab_proj"],
    });

    IdentityManager.registerActor({
      userId: "lead_arch_1",
      name: "Lead Architect",
      organizationId: "org_collab_node",
      role: "PLATFORM_ADMIN",
    });

    IdentityManager.registerActor({
      userId: "rel_mgr_1",
      name: "Release Manager",
      organizationId: "org_collab_node",
      role: "RELEASE_MANAGER",
    });

    // 2. Workflow & Task Assignment
    const workflow = EnterpriseWorkflowEngine.createWorkflow({
      workflowId: "wf_gym_rollout",
      organizationId: "org_collab_node",
      projectId: "gym_p22_collab_proj",
      environment: "production",
      title: "Gym Management Multi-Team Production Rollout",
    });
    expect(workflow.state).toBe("CREATED");

    AssignmentEngine.assignTask({
      assignmentId: "asgn_rollout_1",
      workflowId: "wf_gym_rollout",
      organizationId: "org_collab_node",
      projectId: "gym_p22_collab_proj",
      actorId: "lead_arch_1",
      assigneeType: "HUMAN",
      priority: "HIGH",
    });

    // 3. Secret Redaction & Worker Lease
    SecretProvider.setSecret("COLLAB_TOKEN", "secure_collab_key_3344");
    expect(SecretProvider.maskSecrets("Authorization: Bearer secure_collab_key_3344")).toContain("[REDACTED_SECRET]");

    NotificationOrchestrator.sendNotification({
      organizationId: "org_collab_node",
      category: "APPROVAL_REQUIRED",
      recipientUserIds: ["rel_mgr_1"],
      channel: "DESKTOP",
      title: "Production Rollout Approval Requested",
      rawMessage: "Rollout requires key: secure_collab_key_3344",
    });

    WorkerManager.heartbeat("collab_worker_1");
    expect(WorkerManager.acquireLease("collab_worker_1", "gym_p22_collab_proj", "job_p22_collab")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_collab_node",
      projectId: "gym_p22_collab_proj",
      name: "Gym Collaboration Master Node",
      projectPath: P22_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 4. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p22_collab_proj",
      projectPath: P22_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Collaboration Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Collaboration Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P22_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P22_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P22_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P22_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P22_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P22_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P22_PROJ_DIR, "prisma/schema.prisma"),
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

      // 5. Release Certification & Approval
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P22_PROJ_DIR,
        projectId: "gym_p22_collab_proj",
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

      ApprovalCenter.requestApproval({
        approvalId: "appr_p22_deploy",
        organizationId: "org_collab_node",
        projectId: "gym_p22_collab_proj",
        environment: "production",
        operation: "DEPLOY_PRODUCTION",
        requesterId: "lead_arch_1",
      });

      const approvalDecision = ApprovalCenter.decideApproval(
        "appr_p22_deploy",
        "rel_mgr_1",
        "APPROVED",
        "All 11 governance tiers validated."
      );
      expect(approvalDecision.success).toBe(true);

      // Record Decision in Immutable Ledger
      EnterpriseDecisionLedger.recordDecision({
        actorId: "rel_mgr_1",
        organizationId: "org_collab_node",
        projectId: "gym_p22_collab_proj",
        operation: "DEPLOY_PRODUCTION",
        decision: "APPROVED",
        reason: "Release Manager verified production release readiness.",
      });

      const deployG1 = await DeploymentOrchestrator.executeDeployment({
        projectId: "gym_p22_collab_proj",
        projectPath: P22_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      EnterpriseWorkflowEngine.transitionState("wf_gym_rollout", "COMPLETED");

      // 6. Record Evidence Claims
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p22_collab_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Collaboration Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      // 7. Master Enterprise Collaboration Gate Certification (All 11 Tiers)
      const collabCert = EnterpriseCollaborationGate.evaluate(P22_PROJ_DIR, "org_collab_node");
      expect(collabCert.status).toBe("COLLABORATION_CERTIFIED");
      expect(collabCert.totalCertifiedGates).toBe(11);
      expect(existsSync(join(P22_PROJ_DIR, ".aegis", "enterprise-collaboration-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("collab_worker_1", "gym_p22_collab_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
