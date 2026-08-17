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
import { ResilienceRiskEngine } from "../../resilience/enterprise-risk-engine.js";
import { DisasterRecoveryEngine } from "../../resilience/disaster-recovery-engine.js";
import { BusinessContinuityEngine } from "../../resilience/business-continuity-engine.js";
import { ResilienceLearningEngine } from "../resilience-learning-engine.js";
import { RecoveryOutcomeAnalyzer } from "../recovery-outcome-analyzer.js";
import { DisasterRecoveryOptimizer } from "../disaster-recovery-optimizer.js";
import { RedundancyOptimizationEngine } from "../redundancy-optimization-engine.js";
import { ContinuityCapacityPlanner } from "../continuity-capacity-planner.js";
import { RecoveryGameDayEngine } from "../recovery-game-day-engine.js";
import { EnterpriseContinuityDecisionEngine } from "../continuity-decision-engine.js";
import { ContinuityScoreEngine } from "../continuity-score-engine.js";
import { ContinuityDecisionLedger } from "../continuity-decision-ledger.js";
import { EnterpriseContinuityOptimizationGate } from "../enterprise-continuity-optimization-gate.js";
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

const P28_PROJ_DIR = join(process.cwd(), ".tmp_test_p28_e2e");

describe("AEGIS Phase 28 — Master Autonomous Resilience Optimization & Enterprise Continuity E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P28_PROJ_DIR)) rmSync(P28_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P28_PROJ_DIR, { recursive: true });
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
    ResilienceRiskEngine.reset();
    DisasterRecoveryEngine.reset();
    BusinessContinuityEngine.reset();
    ContinuityDecisionLedger.reset();
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
    ResilienceRiskEngine.reset();
    DisasterRecoveryEngine.reset();
    BusinessContinuityEngine.reset();
    ContinuityDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P28_PROJ_DIR)) rmSync(P28_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete enterprise continuity lifecycle across all 17 governance tiers and issues EnterpriseContinuityCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_cont_core",
      name: "Enterprise Continuity Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_continuity", name: "Business Continuity & DR", memberUserIds: ["continuity_director_1"] }],
      projectIds: ["gym_p28_cont_proj"],
    });

    IdentityManager.registerActor({
      userId: "continuity_director_1",
      name: "Continuity Director",
      organizationId: "org_cont_core",
      role: "PLATFORM_ADMIN",
    });

    // 2. Redundancy & Capacity Planning
    const redundancy = RedundancyOptimizationEngine.evaluateRedundancy("Primary PostgreSQL DB", 2, true);
    expect(redundancy.status).toBe("OPTIMAL");

    const capacity = ContinuityCapacityPlanner.planCapacity("WORKER_NODES", 20, 40, 10);
    expect(capacity.status).toBe("NORMAL");

    // 3. Zero-Mutation Game-Day Drill
    const gameDay = RecoveryGameDayEngine.runGameDay("Worker Fleet Outage", ["worker_pool_alpha"]);
    expect(gameDay.mutationsAttempted).toBe(0);
    expect(gameDay.isSimulationOnly).toBe(true);

    // 4. Secret Masking & Worker Lease
    SecretProvider.setSecret("CONT_TOKEN", "secure_cont_key_1122");
    expect(SecretProvider.maskSecrets("Bearer secure_cont_key_1122")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("cont_worker_1");
    expect(WorkerManager.acquireLease("cont_worker_1", "gym_p28_cont_proj", "job_p28_cont")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_cont_core",
      projectId: "gym_p28_cont_proj",
      name: "Gym Continuity Master Node",
      projectPath: P28_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 5. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p28_cont_proj",
      projectPath: P28_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Continuity Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Continuity Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P28_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P28_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P28_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P28_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P28_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P28_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P28_PROJ_DIR, "prisma/schema.prisma"),
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

      // 6. Production Release & Staged Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P28_PROJ_DIR,
        projectId: "gym_p28_cont_proj",
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
        projectId: "gym_p28_cont_proj",
        projectPath: P28_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 7. Recovery Outcome Analysis & Resilience Learning
      const outcomeAnalysis = RecoveryOutcomeAnalyzer.analyzeOutcome({
        projectId: "gym_p28_cont_proj",
        plannedRTOSeconds: 120,
        actualRTOSeconds: 110,
        plannedRPOSeconds: 60,
        actualRPOSeconds: 30,
        dataIntegrityPassed: true,
        businessWorkflowIntegrityPassed: true,
      });
      expect(outcomeAnalysis.outcomeStatus).toBe("MEETS_TARGET");

      const learning = ResilienceLearningEngine.evaluateLearning("gym_p28_cont_proj", 120, 110);
      expect(learning.classification).toBe("CONFIRMED");
      expect(learning.policyMutationsAttempted).toBe(0);

      const continuityScore = ContinuityScoreEngine.calculateScore({
        projectId: "gym_p28_cont_proj",
        recoveryReadiness: 100,
        rtoCompliance: 100,
        rpoCompliance: 100,
        backupReliability: 100,
        redundancySufficiency: 95,
      });
      expect(continuityScore.status).toBe("OPTIMIZED");
      expect(continuityScore.overallScore).toBeGreaterThanOrEqual(95);

      // 8. Record Evidence Claims & Decision
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p28_cont_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Continuity Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      ContinuityDecisionLedger.recordDecision({
        actorId: "continuity_director_1",
        organizationId: "org_cont_core",
        projectId: "gym_p28_cont_proj",
        operation: "CERTIFY_CONTINUITY_OPTIMIZATION",
        decisionType: "CONTINUITY_CERTIFIED",
        evidenceSummary: "Calibrated resilience learning, verified live restore, and 99% continuity score validated.",
      });

      const recommendation = EnterpriseContinuityDecisionEngine.evaluateContinuity(
        "gym_p28_cont_proj",
        continuityScore.overallScore,
        false
      );
      expect(recommendation.action).toBe("OBSERVE");

      // 9. Master Enterprise Continuity Optimization Gate Certification (All 17 Tiers)
      const contCert = EnterpriseContinuityOptimizationGate.evaluate(P28_PROJ_DIR, "org_cont_core");
      expect(contCert.status).toBe("ENTERPRISE_CONTINUITY_CERTIFIED");
      expect(contCert.totalCertifiedGates).toBe(17);
      expect(existsSync(join(P28_PROJ_DIR, ".aegis", "enterprise-continuity-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("cont_worker_1", "gym_p28_cont_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
