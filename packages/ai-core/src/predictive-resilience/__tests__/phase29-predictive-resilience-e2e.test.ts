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
import { PredictiveFailureEngine } from "../predictive-failure-engine.js";
import { ResilienceDegradationDetector } from "../resilience-degradation-detector.js";
import { RecoveryReadinessForecaster } from "../recovery-readiness-forecaster.js";
import { PreIncidentInterventionPlanner } from "../pre-incident-intervention.js";
import { RecoveryPlanCompiler } from "../recovery-plan-compiler.js";
import { AutonomousRecoveryExecutor } from "../autonomous-recovery-executor.js";
import { FailoverCoordinator } from "../failover-coordinator.js";
import { PredictiveCapacityScaler } from "../predictive-capacity-scaler.js";
import { BusinessImpactForecaster } from "../business-impact-forecaster.js";
import { PredictiveResilienceDecisionEngine } from "../predictive-resilience-decision-engine.js";
import { PredictiveResilienceScoreEngine } from "../predictive-resilience-score.js";
import { PredictiveResilienceLearningEngine } from "../predictive-resilience-learning.js";
import { PredictiveResilienceLedger } from "../predictive-resilience-ledger.js";
import { PredictiveResilienceGate } from "../predictive-resilience-gate.js";
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

const P29_PROJ_DIR = join(process.cwd(), ".tmp_test_p29_e2e");

describe("AEGIS Phase 29 — Master Predictive Resilience & Autonomous Recovery E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P29_PROJ_DIR)) rmSync(P29_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P29_PROJ_DIR, { recursive: true });
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
    PredictiveFailureEngine.reset();
    PredictiveResilienceLedger.reset();
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
    PredictiveFailureEngine.reset();
    PredictiveResilienceLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P29_PROJ_DIR)) rmSync(P29_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete predictive resilience lifecycle across all 18 governance tiers and issues PredictiveResilienceCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_pred_core",
      name: "Predictive Resilience Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_aiops", name: "AIOps & Predictive Recovery", memberUserIds: ["aiops_lead_1"] }],
      projectIds: ["gym_p29_pred_proj"],
    });

    IdentityManager.registerActor({
      userId: "aiops_lead_1",
      name: "AIOps Lead",
      organizationId: "org_pred_core",
      role: "PLATFORM_ADMIN",
    });

    // 2. Predictive Failure Intelligence & Degradation Detection
    const forecast = PredictiveFailureEngine.forecastFailure(
      "gym_p29_pred_proj",
      "MEMORY_CREEP",
      75,
      45,
      "Perform rolling container restart and warm replica sync"
    );
    expect(forecast.classification).toBe("PREDICTED");

    const degradation = ResilienceDegradationDetector.evaluateDegradation("gym_p29_pred_proj", 2.0, 72, 10);
    expect(degradation.status).toBe("DEGRADING");
    expect(degradation.leadTimeMinutes).toBe(45);

    // 3. Pre-Incident Intervention Planning & Failover Validation
    const intervention = PreIncidentInterventionPlanner.planIntervention("gym_p29_pred_proj", "RUN_BACKUP_VERIFICATION", 35);
    expect(intervention.mutationsAttempted).toBe(0);

    const failoverCheck = FailoverCoordinator.validateFailoverTarget("gym_db_replica_1", "gym_db_replica_1");
    expect(failoverCheck.status).toBe("VALIDATED");

    // 4. Secret Masking & Worker Lease
    SecretProvider.setSecret("PRED_TOKEN", "secure_pred_key_3344");
    expect(SecretProvider.maskSecrets("Bearer secure_pred_key_3344")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("pred_worker_1");
    expect(WorkerManager.acquireLease("pred_worker_1", "gym_p29_pred_proj", "job_p29_pred")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_pred_core",
      projectId: "gym_p29_pred_proj",
      name: "Gym Predictive Resilience Node",
      projectPath: P29_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 5. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p29_pred_proj",
      projectPath: P29_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Predictive Resilience Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Predictive Resilience Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P29_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P29_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P29_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P29_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P29_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P29_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P29_PROJ_DIR, "prisma/schema.prisma"),
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
        projectPath: P29_PROJ_DIR,
        projectId: "gym_p29_pred_proj",
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
        projectId: "gym_p29_pred_proj",
        projectPath: P29_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 7. Policy-Bounded Autonomous Recovery Plan Compilation & Execution
      const compiledPlan = RecoveryPlanCompiler.compilePlan("MEMORY_CREEP");
      expect(compiledPlan.steps.length).toBe(4);

      const recoveryExecution = AutonomousRecoveryExecutor.executePlan(
        "gym_p29_pred_proj",
        compiledPlan.planId,
        true, // Authorized
        true  // Policy-safe
      );
      expect(recoveryExecution.status).toBe("SUCCEEDED");

      // 8. Model Calibration & Predictive Resilience Score
      const learning = PredictiveResilienceLearningEngine.calibrate("gym_p29_pred_proj", 45, 45);
      expect(learning.predictionAccuracy).toBe(100);
      expect(learning.policyMutationsAttempted).toBe(0);

      const score = PredictiveResilienceScoreEngine.calculateScore({
        projectId: "gym_p29_pred_proj",
        predictionAccuracy: 100,
        recoveryReadiness: 95,
        leadTime: 90,
        failoverReadiness: 100,
      });
      expect(score.status).toBe("PREDICTIVE_RESILIENT");
      expect(score.overallScore).toBeGreaterThanOrEqual(95);

      // 9. Record Evidence Claims & Decision
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p29_pred_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Predictive Resilience Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      PredictiveResilienceLedger.recordDecision({
        actorId: "aiops_lead_1",
        organizationId: "org_pred_core",
        projectId: "gym_p29_pred_proj",
        operation: "CERTIFY_PREDICTIVE_RESILIENCE",
        decisionType: "PREDICTION_CALIBRATED",
        evidenceSummary: "Forecasted memory creep, executed policy-safe autonomous intervention, calibrated lead times with 100% accuracy.",
      });

      const recommendation = PredictiveResilienceDecisionEngine.evaluateDecision(
        "gym_p29_pred_proj",
        30,
        95
      );
      expect(recommendation.action).toBe("OBSERVE");

      // 10. Master Predictive Resilience Gate Certification (All 18 Tiers)
      const predCert = PredictiveResilienceGate.evaluate(P29_PROJ_DIR, "org_pred_core");
      expect(predCert.status).toBe("PREDICTIVE_RESILIENCE_CERTIFIED");
      expect(predCert.totalCertifiedGates).toBe(18);
      expect(existsSync(join(P29_PROJ_DIR, ".aegis", "predictive-resilience-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("pred_worker_1", "gym_p29_pred_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
