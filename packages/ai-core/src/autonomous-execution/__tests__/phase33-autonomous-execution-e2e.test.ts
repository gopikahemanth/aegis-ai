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
import { ExecutionPlanManager } from "../execution-plan.js";
import { ExecutionAuthorizationEngine } from "../execution-authorization.js";
import { ExecutionPreflightEngine } from "../execution-preflight-engine.js";
import { AutonomousExecutionEngine } from "../execution-engine.js";
import { ExecutionCanaryEngine } from "../execution-canary-engine.js";
import { ExecutionMonitor } from "../execution-monitor.js";
import { ExecutionRollbackEngine } from "../execution-rollback-engine.js";
import { ExecutionVerificationEngine } from "../execution-verification-engine.js";
import { ExecutionOutcomeEngine } from "../execution-outcome-engine.js";
import { ExecutionLearningEngine } from "../execution-learning-engine.js";

import { AutonomousExecutionWorkQueue } from "../execution-work-queue.js";
import { ExecutionResourceGovernanceEngine } from "../execution-resource-governance.js";
import { AutonomousExecutionDecisionEngine } from "../execution-decision-engine.js";
import { AutonomousExecutionLedger } from "../execution-ledger.js";
import { EnterpriseAutonomousExecutionGate } from "../autonomous-execution-gate.js";
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

const P33_PROJ_DIR = join(process.cwd(), ".tmp_test_p33_e2e");

describe("AEGIS Phase 33 — Master Governed Autonomous Execution E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P33_PROJ_DIR)) rmSync(P33_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P33_PROJ_DIR, { recursive: true });
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
    ExecutionPlanManager.reset();
    AutonomousExecutionWorkQueue.reset();
    AutonomousExecutionLedger.reset();
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
    ExecutionPlanManager.reset();
    AutonomousExecutionWorkQueue.reset();
    AutonomousExecutionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P33_PROJ_DIR)) rmSync(P33_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete governed autonomous execution lifecycle across all 22 governance tiers and issues EnterpriseAutonomousExecutionCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_exec_core",
      name: "Enterprise Autonomous Execution Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_ops", name: "Autonomous Execution Operations", memberUserIds: ["exec_lead_1"] }],
      projectIds: ["gym_p33_exec_proj"],
    });

    IdentityManager.registerActor({
      userId: "exec_lead_1",
      name: "Autonomous Execution Lead",
      organizationId: "org_exec_core",
      role: "PLATFORM_ADMIN",
    });

    // 2. Execution Plan Creation with Strict Lineage
    const plan = ExecutionPlanManager.createPlan({
      tenantId: "t_gym",
      organizationId: "org_exec_core",
      projectId: "gym_p33_exec_proj",
      environment: "production",
      sourcePredictionId: "fc_gym_throughput_99",
      sourceDecisionId: "dec_gym_opt_v3",
      plannedActions: [
        { actionId: "act_deploy_routes", actionType: "DEPLOY_MEMBER_ROUTES", targetComponent: "GymRoutes", sequenceOrder: 1 },
      ],
      preconditions: ["Clean repo", "Healthy database", "Zero active incidents"],
      expectedImpact: "Increase member throughput by 20%",
      riskLevel: "LOW",
      rollbackPlan: {
        rollbackActionId: "rb_gym_v3",
        rollbackSteps: ["Rollback to snapshot gen_0 baseline"],
        isDeterministic: true,
      },
      verificationPlan: {
        verificationSteps: ["POST /api/members (201)", "GET /api/members (200)"],
        requiredConfidence: 0.98,
      },
      resourceBudget: {
        maxTokens: 50000,
        maxComputeMs: 10000,
        maxDbMutations: 10,
      },
      createdBy: "exec_lead_1",
    });

    expect(plan.status).toBe("PLANNED");

    // 3. Authorization & Preflight Safety Checks
    const authResult = ExecutionAuthorizationEngine.evaluateAuthorization({
      actorId: "exec_lead_1",
      organizationId: "org_exec_core",
      tenantId: "t_gym",
      projectId: "gym_p33_exec_proj",
      environment: "production",
      isSafeReadonlyAction: false,
      hasHumanApprovalSignature: true,
    });
    expect(authResult.isAuthorized).toBe(true);

    const preflight = ExecutionPreflightEngine.runPreflight({
      projectId: "gym_p33_exec_proj",
      environment: "production",
      hasActiveIncidents: false,
      isSloBreached: false,
      hasRollbackPlan: true,
      isBackupFresh: true,
      hasDependencyFailures: false,
      isReleaseMatched: true,
    });
    expect(preflight.passed).toBe(true);

    // 4. Resource Governance & Decision Check
    const budgetReport = ExecutionResourceGovernanceEngine.checkBudget(plan.executionId, 12000, 50000, 1500, 10000);
    expect(budgetReport.isBlocked).toBe(false);

    const nextStep = AutonomousExecutionDecisionEngine.decideNextStep(plan.executionId, true, true, false);
    expect(nextStep.action).toBe("CANARY");

    // 5. Secret Masking & Worker Lease
    SecretProvider.setSecret("EXEC_TOKEN", "secure_exec_key_9900");
    expect(SecretProvider.maskSecrets("Bearer secure_exec_key_9900")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("exec_worker_1");
    expect(WorkerManager.acquireLease("exec_worker_1", "gym_p33_exec_proj", "job_p33_exec")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_exec_core",
      projectId: "gym_p33_exec_proj",
      name: "Gym Autonomous Execution Node",
      projectPath: P33_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 6. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p33_exec_proj",
      projectPath: P33_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Autonomous Execution Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Autonomous Execution Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P33_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P33_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P33_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P33_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P33_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P33_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P33_PROJ_DIR, "prisma/schema.prisma"),
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
        projectPath: P33_PROJ_DIR,
        projectId: "gym_p33_exec_proj",
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
        projectId: "gym_p33_exec_proj",
        projectPath: P33_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 8. Governed Action Execution & Canary Progression
      const execRun = await AutonomousExecutionEngine.executePlan(plan, true, true, async () => ({
        beforeState: "GEN_0_INITIAL",
        afterState: "GEN_1_DEPLOYED",
      }));
      expect(execRun.success).toBe(true);

      const canary1 = ExecutionCanaryEngine.evaluateCanary(plan.executionId, "PREVIEW", {
        errorRatePercentage: 0.0,
        p99LatencyMs: 42,
        apiSuccessRatePercentage: 100.0,
        healthProbePassed: true,
      });
      expect(canary1.status).toBe("STAGE_PASSED");
      expect(canary1.stage).toBe("CANARY");

      const canary2 = ExecutionCanaryEngine.evaluateCanary(plan.executionId, "CANARY", {
        errorRatePercentage: 0.0,
        p99LatencyMs: 40,
        apiSuccessRatePercentage: 100.0,
        healthProbePassed: true,
      });
      expect(canary2.stage).toBe("PARTIAL");

      // 9. Post-Execution Verification & Outcome Reconciliation
      const postVerification = ExecutionVerificationEngine.verifyExecution({
        executionId: plan.executionId,
        technicalChecksPassed: true,
        operationalSloHealthy: true,
        businessKpiTrendPositive: true,
      });
      expect(postVerification.overallPassed).toBe(true);

      const outcomeReport = ExecutionOutcomeEngine.reconcileOutcome(plan.executionId, "gym_p33_exec_proj", 20, 24, 60000);
      expect(outcomeReport.classification).toBe("SUCCESS");

      // 10. Execution Learning Calibration
      const learning = ExecutionLearningEngine.extractLearning(15, 0.02);
      expect(learning.safetyPolicyMutationsAttempted).toBe(0);

      // 11. Record Evidence Claims & Cryptographic Ledger Entry
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p33_exec_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Autonomous Execution Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      AutonomousExecutionLedger.recordEvent({
        actorId: "exec_lead_1",
        organizationId: "org_exec_core",
        projectId: "gym_p33_exec_proj",
        environment: "production",
        executionId: plan.executionId,
        eventType: "EXECUTION_CERTIFIED",
        evidenceSummary: "Execution verified across Technical, Operational, and Business dimensions with 0 safety policy mutations.",
      });

      // 12. Master Enterprise Autonomous Execution Gate Certification (All 22 Tiers)
      const execCert = EnterpriseAutonomousExecutionGate.evaluate(P33_PROJ_DIR, "org_exec_core");
      expect(execCert.status).toBe("ENTERPRISE_AUTONOMOUS_EXECUTION_CERTIFIED");
      expect(execCert.totalCertifiedGates).toBe(22);
      expect(existsSync(join(P33_PROJ_DIR, ".aegis", "enterprise-autonomous-execution-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("exec_worker_1", "gym_p33_exec_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("handles execution failure path: Canary Degradation -> ROLLBACK_REQUIRED -> Verified Rollback", async () => {
    const plan = ExecutionPlanManager.createPlan({
      tenantId: "t_gym",
      organizationId: "org_exec_core",
      projectId: "gym_p33_exec_proj",
      environment: "production",
      sourcePredictionId: "fc_1",
      sourceDecisionId: "dec_1",
      plannedActions: [
        { actionId: "act_flaky", actionType: "UPDATE_ALGORITHM", targetComponent: "Scheduler", sequenceOrder: 1 },
      ],
      preconditions: ["Clean"],
      expectedImpact: "Algorithm tweak",
      riskLevel: "HIGH",
      rollbackPlan: {
        rollbackActionId: "rb_flaky",
        rollbackSteps: ["Restore deterministic stable algorithm"],
        isDeterministic: true,
      },
      verificationPlan: {
        verificationSteps: ["Check stability"],
        requiredConfidence: 0.95,
      },
      resourceBudget: { maxTokens: 10000, maxComputeMs: 2000, maxDbMutations: 2 },
      createdBy: "exec_lead_1",
    });

    // 1. Canary failure trigger
    const canaryFail = ExecutionCanaryEngine.evaluateCanary(plan.executionId, "CANARY", {
      errorRatePercentage: 8.2, // Exceeds threshold
      p99LatencyMs: 900,
      apiSuccessRatePercentage: 91.8,
      healthProbePassed: false,
    });
    expect(canaryFail.status).toBe("ROLLBACK_REQUIRED");

    // 2. Execute and verify rollback
    const rollbackRes = await ExecutionRollbackEngine.executeRollback(plan.executionId, true, async () => ({
      restoredHash: "RESTORED_GEN0_HASH",
      success: true,
    }));
    expect(rollbackRes.rollbackState).toBe("VERIFIED");
    expect(rollbackRes.isVerified).toBe(true);
  });
});
