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
import { InnovationDiscoveryEngine } from "../innovation-discovery-engine.js";
import { EngineeringHypothesisEngine } from "../engineering-hypothesis-engine.js";
import { ExperimentDesignEngine } from "../experiment-design-engine.js";
import { ExperimentSimulationEngine } from "../experiment-simulation-engine.js";
import { ControlledTrialEngine } from "../controlled-trial-engine.js";
import { ExperimentMeasurementEngine } from "../experiment-measurement-engine.js";
import { InnovationComparisonEngine } from "../innovation-comparison-engine.js";
import { AdoptionAuthorizationEngine } from "../adoption-authorization-engine.js";
import { InnovationRolloutEngine } from "../innovation-rollout-engine.js";
import { InnovationVerificationEngine } from "../innovation-verification-engine.js";
import { InnovationLearningEngine } from "../innovation-learning-engine.js";
import { InnovationDecisionLedger } from "../innovation-decision-ledger.js";
import { InnovationEvidenceLedger } from "../innovation-evidence-ledger.js";
import { EnterpriseInnovationGate } from "../enterprise-innovation-gate.js";
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

const P40_PROJ_DIR = join(process.cwd(), ".tmp_test_p40_e2e");

describe("AEGIS Phase 40 — Master Autonomous Enterprise Innovation & Verified Transformation E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P40_PROJ_DIR)) rmSync(P40_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P40_PROJ_DIR, { recursive: true });
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
    ControlledTrialEngine.reset();
    AdoptionAuthorizationEngine.reset();
    InnovationRolloutEngine.reset();
    InnovationDecisionLedger.reset();
    InnovationEvidenceLedger.reset();
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
    ControlledTrialEngine.reset();
    AdoptionAuthorizationEngine.reset();
    InnovationRolloutEngine.reset();
    InnovationDecisionLedger.reset();
    InnovationEvidenceLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P40_PROJ_DIR)) rmSync(P40_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete innovation experimentation, trial, adoption, and verification cycle across all 29 tiers and issues EnterpriseInnovationCertificate", async () => {
    // 1. Enterprise Organization & Actor Setup
    OrganizationManager.createOrganization({
      organizationId: "org_innovation_core",
      name: "Global Enterprise Innovation Core",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_rnd", name: "R&D Architecture Team", memberUserIds: ["vp_eng_1"] }],
      projectIds: ["gym_p40_innov_proj"],
    });

    IdentityManager.registerActor({
      userId: "vp_eng_1",
      name: "VP of Engineering & Architecture",
      organizationId: "org_innovation_core",
      role: "VP_ENGINEERING",
    });

    // 2. Innovation Discovery (DISCOVERY != RECOMMENDATION)
    const opps = InnovationDiscoveryEngine.discoverOpportunities("gym_p40_innov_proj", 65, 2, 0.25);
    expect(opps.length).toBeGreaterThan(0);
    const chosenOpp = opps[0];

    // 3. Hypothesis Formulation (IDEA != HYPOTHESIS)
    const hypothesis = EngineeringHypothesisEngine.formulateHypothesis(
      chosenOpp.opportunityId,
      "Replacing in-memory event dispatch with zero-copy stream processing reduces P99 latency by >=50%",
      "p99LatencyMs",
      42,
      18,
      "OpenTelemetry Span Telemetry",
      chosenOpp.affectedSystems
    );
    expect(hypothesis.hypothesisId).toBeDefined();

    // 4. Experiment Design (HYPOTHESIS != EXPERIMENT DESIGN)
    const experiment = ExperimentDesignEngine.designExperiment(
      hypothesis.hypothesisId,
      "Zero-Copy Streaming In-Memory Trial",
      "Standard Event Dispatcher",
      "Zero-Copy Stream Router",
      ["bufferSize", "flushIntervalMs"],
      30,
      15
    );
    expect(experiment.experimentId).toBeDefined();

    // 5. Zero-Mutation Experiment Simulation (Guaranteed 0 Mutations)
    const sim = ExperimentSimulationEngine.simulateExperiment(
      experiment.experimentId,
      hypothesis.baselineValue,
      hypothesis.targetValue
    );
    expect(sim.sourceMutationsAttempted).toBe(0);
    expect(sim.databaseMutationsAttempted).toBe(0);
    expect(sim.deploymentMutationsAttempted).toBe(0);
    expect(sim.productionMutationsAttempted).toBe(0);
    expect(sim.simulationHash).toBeDefined();

    // 6. Controlled Trial Stage Coordination
    const trial = ControlledTrialEngine.initializeTrial(
      experiment.experimentId,
      "gym_p40_innov_proj",
      "CANARY",
      15
    );
    ControlledTrialEngine.transitionStage(trial.trialId, "SIMULATED");
    ControlledTrialEngine.transitionStage(trial.trialId, "AUTHORIZED");
    ControlledTrialEngine.transitionStage(trial.trialId, "RUNNING");

    // 7. Secret Masking & Worker Lease
    SecretProvider.setSecret("INNOV_SECRET", "innov_master_secret_8899");
    expect(SecretProvider.maskSecrets("Bearer innov_master_secret_8899")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("innov_worker_1");
    expect(WorkerManager.acquireLease("innov_worker_1", "gym_p40_innov_proj", "job_p40_innov")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_innovation_core",
      projectId: "gym_p40_innov_proj",
      name: "Gym Innovation Node",
      projectPath: P40_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 8. Generation 1 Execution
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p40_innov_proj",
      projectPath: P40_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Enterprise Innovation Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Enterprise Innovation Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P40_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P40_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P40_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P40_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P40_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P40_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P40_PROJ_DIR, "prisma/schema.prisma"),
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

      // 9. Production Release & Staged Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P40_PROJ_DIR,
        projectId: "gym_p40_innov_proj",
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
        projectId: "gym_p40_innov_proj",
        projectPath: P40_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 10. Empirical Measurement & Statistical Comparison (MEASURED != INFERRED)
      ControlledTrialEngine.transitionStage(trial.trialId, "MEASURING");
      const measurement = ExperimentMeasurementEngine.measureTrial(trial.trialId, experiment.experimentId, 18, 0.0, 1200);
      expect(measurement.technicalMetrics.latencyP99Ms).toBe(18);

      const comparison = InnovationComparisonEngine.compare(experiment.experimentId, 42, 18, 0.0, 0.0);
      expect(comparison.classification).toBe("STRONGLY_POSITIVE");
      ControlledTrialEngine.transitionStage(trial.trialId, "COMPLETED");

      // 11. Human VP Engineering Adoption Authorization (EXPERIMENT SUCCESS != AUTOMATIC ADOPTION)
      AdoptionAuthorizationEngine.requestAdoption(experiment.experimentId, "VP_ENGINEERING", 240000);
      const adoption = AdoptionAuthorizationEngine.grantAdoption(
        experiment.experimentId,
        "vp_eng_1",
        "sig_vp_eng_p40_valid"
      );
      expect(adoption.decision).toBe("APPROVE_ADOPTION");

      // 12. Phased Rollout Promotion (PREVIEW -> CANARY -> FULL)
      const rollout = InnovationRolloutEngine.initializeRollout(experiment.experimentId);
      InnovationRolloutEngine.advanceStage(rollout.rolloutId, "CANARY");
      const fullRollout = InnovationRolloutEngine.advanceStage(rollout.rolloutId, "FULL");
      expect(fullRollout.currentStage).toBe("FULL");
      expect(fullRollout.trafficPercentage).toBe(100);

      // 13. Multi-Dimensional Innovation Verification (SUCCESSFUL TRIAL != VERIFIED TRANSFORMATION)
      const verifyReport = InnovationVerificationEngine.verifyInnovation({
        opportunityId: chosenOpp.opportunityId,
        technicalBuildPassed: true,
        securityChecksPassed: true,
        productFeaturesVerified: true,
        operationalLatencyHealthy: true,
        businessKpiPreserved: true,
      });
      expect(verifyReport.overallPassed).toBe(true);


      // 14. Innovation Learning Engine (0 Policy Mutations)
      const learnReport = InnovationLearningEngine.extractLearning(10);
      expect(learnReport.safetyPolicyMutationsAttempted).toBe(0);

      // 15. Record Evidence Claims & Cryptographic Ledgers
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p40_innov_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Enterprise Innovation Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      InnovationEvidenceLedger.recordClaim(
        experiment.experimentId,
        "gym_p40_innov_proj",
        "TRANSFORMATION_VERIFIED",
        { p99LatencyMs: 18, throughputRps: 1200, annualRealizedValueINR: 240000 },
        true
      );

      InnovationDecisionLedger.recordEvent({
        actorId: "vp_eng_1",
        tenantId: "tenant_enterprise",
        organizationId: "org_innovation_core",
        projectId: "gym_p40_innov_proj",
        opportunityId: chosenOpp.opportunityId,
        eventType: "INNOVATION_VERIFIED",
        evidenceSummary: "Zero-copy streaming innovation trial verified across all 29 governance tiers delivering ₹2,40,000 INR verified transformation value.",
      });

      // 16. Master Enterprise Innovation Gate Certification (All 29 Tiers)
      const innovCert = EnterpriseInnovationGate.evaluate(P40_PROJ_DIR, "org_innovation_core");
      expect(innovCert.status).toBe("ENTERPRISE_INNOVATION_CERTIFIED");
      expect(innovCert.totalCertifiedGates).toBe(29);
      expect(existsSync(join(P40_PROJ_DIR, ".aegis", "enterprise-innovation-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("innov_worker_1", "gym_p40_innov_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
