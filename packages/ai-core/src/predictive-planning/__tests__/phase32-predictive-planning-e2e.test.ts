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
import { PredictiveEnterpriseStateEngine } from "../predictive-enterprise-state.js";
import { EnterpriseForecastEngine } from "../enterprise-forecast-engine.js";
import { PredictiveRiskPropagationEngine } from "../predictive-risk-propagation.js";
import { CapacityDemandForecaster } from "../capacity-demand-forecaster.js";
import { BusinessOutcomeForecaster } from "../business-outcome-forecaster.js";
import { EnterpriseScenarioEngine } from "../enterprise-scenario-engine.js";
import { EnterpriseScenarioOptimizer } from "../enterprise-scenario-optimizer.js";
import { AutonomousActionPlanner } from "../autonomous-action-planner.js";
import { ActionAuthorizationEngine } from "../action-authorization-engine.js";
import { PredictiveWorkQueue } from "../predictive-work-queue.js";
import { ForecastCalibrationEngine } from "../forecast-calibration-engine.js";
import { PredictivePlanningDecisionEngine } from "../predictive-decision-engine.js";
import { PredictivePlanningLedger } from "../predictive-planning-ledger.js";
import { EnterprisePredictivePlanningGate } from "../enterprise-predictive-planning-gate.js";
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

const P32_PROJ_DIR = join(process.cwd(), ".tmp_test_p32_e2e");

describe("AEGIS Phase 32 — Master Predictive Enterprise Planning & Governed Action E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P32_PROJ_DIR)) rmSync(P32_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P32_PROJ_DIR, { recursive: true });
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
    PredictiveWorkQueue.reset();
    PredictivePlanningLedger.reset();
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
    PredictiveWorkQueue.reset();
    PredictivePlanningLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P32_PROJ_DIR)) rmSync(P32_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete predictive planning lifecycle across all 21 governance tiers and issues EnterprisePredictivePlanningCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_plan_core",
      name: "Enterprise Predictive Planning Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_strat", name: "Strategic Architecture & Planning", memberUserIds: ["strat_lead_1"] }],
      projectIds: ["gym_p32_plan_proj"],
    });

    IdentityManager.registerActor({
      userId: "strat_lead_1",
      name: "Strategic Planning Lead",
      organizationId: "org_plan_core",
      role: "PLATFORM_ADMIN",
    });

    // 2. Predictive Enterprise State, Multi-Horizon Forecast & Risk Propagation
    const predState = PredictiveEnterpriseStateEngine.buildState("org_plan_core", "30_DAYS", ["ev_hist_sla_1"]);
    expect(predState.currentState).toBe("OPTIMIZED");

    const forecast = EnterpriseForecastEngine.generateForecast("RELIABILITY_INDEX", 99.9, 99.95, "30_DAYS", ["ev_hist_sla_1"]);
    expect(forecast.classification).toBe("FORECAST");

    const riskReport = PredictiveRiskPropagationEngine.propagateRisk("Database Pool", ["gym_p32_plan_proj"], ["Member Check-in"], 40);
    expect(riskReport.classification).toBe("FORECAST");

    // 3. Capacity & Business Outcome Forecasting
    const capForecast = CapacityDemandForecaster.forecastCapacity("AI_WORKERS", 100, 45);
    expect(capForecast.status).toBe("NO_CONSTRAINT");

    const outcomeForecast = BusinessOutcomeForecaster.forecastOutcome("out_1", "gym_p32_plan_proj", "Member Retention >= 95%", 94, 30);
    expect(outcomeForecast.classification).toBe("FORECAST");

    // 4. Zero-Mutation Scenario Simulation & Optimization
    const scenario = EnterpriseScenarioEngine.simulateScenario("Accelerate V2 Member Gateway", 5, 12000, 10, -15);
    expect(scenario.mutationsAttempted).toBe(0);
    expect(scenario.classification).toBe("SIMULATED");

    const ranked = EnterpriseScenarioOptimizer.rankScenarios([
      { scenarioName: "Accelerate V2 Member Gateway", expectedValueScore: 92, riskScore: 10, costImpactINR: 12000, isRecommended: false },
    ]);
    expect(ranked[0].isRecommended).toBe(true);

    // 5. Autonomous Action Planning & Authorization
    const candidateAction = AutonomousActionPlanner.planAction("gym_p32_plan_proj", "RUN_ADDITIONAL_RECOVERY_TEST");
    expect(candidateAction.safetyClassification).toBe("SAFE_AUTOMATION");

    const authDecision = ActionAuthorizationEngine.evaluateAction(candidateAction.actionId, "gym_p32_plan_proj", true, false);
    expect(authDecision.decision).toBe("ALLOW");

    // 6. Secret Masking & Worker Lease
    SecretProvider.setSecret("PLAN_TOKEN", "secure_plan_key_7788");
    expect(SecretProvider.maskSecrets("Bearer secure_plan_key_7788")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("plan_worker_1");
    expect(WorkerManager.acquireLease("plan_worker_1", "gym_p32_plan_proj", "job_p32_plan")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_plan_core",
      projectId: "gym_p32_plan_proj",
      name: "Gym Predictive Planning Node",
      projectPath: P32_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 7. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p32_plan_proj",
      projectPath: P32_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Predictive Planning Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Predictive Planning Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P32_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P32_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P32_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P32_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P32_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P32_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P32_PROJ_DIR, "prisma/schema.prisma"),
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

      // 8. Production Release & Staged Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P32_PROJ_DIR,
        projectId: "gym_p32_plan_proj",
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
        projectId: "gym_p32_plan_proj",
        projectPath: P32_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 9. Forecast Calibration & Predictive Planning Decision
      const calibration = ForecastCalibrationEngine.calibrate("RELIABILITY_INDEX", 99.95, 99.95);
      expect(calibration.predictionAccuracyPercentage).toBe(100);
      expect(calibration.safetyPolicyMutationsAttempted).toBe(0);

      const decision = PredictivePlanningDecisionEngine.formulateDecision("gym_p32_plan_proj", 20, false);
      expect(decision.type).toBe("OBSERVE");

      // 10. Record Evidence Claims & Cryptographic Ledger Entry
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p32_plan_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Predictive Planning Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      PredictivePlanningLedger.recordDecision({
        actorId: "strat_lead_1",
        organizationId: "org_plan_core",
        projectId: "gym_p32_plan_proj",
        operation: "CERTIFY_ENTERPRISE_PREDICTIVE_PLANNING",
        decisionType: "PLANNING_CERTIFIED",
        evidenceSummary: "Multi-horizon forecasts calibrated with 100% accuracy and zero safety policy mutations across all 21 tiers.",
      });

      // 11. Master Enterprise Predictive Planning Gate Certification (All 21 Tiers)
      const planCert = EnterprisePredictivePlanningGate.evaluate(P32_PROJ_DIR, "org_plan_core");
      expect(planCert.status).toBe("ENTERPRISE_PREDICTIVE_PLANNING_CERTIFIED");
      expect(planCert.totalCertifiedGates).toBe(21);
      expect(existsSync(join(P32_PROJ_DIR, ".aegis", "enterprise-predictive-planning-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("plan_worker_1", "gym_p32_plan_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
