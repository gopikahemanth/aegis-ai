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
import { EnterpriseReliabilityStateEngine } from "../enterprise-reliability-state.js";
import { ReliabilityDependencyGraph } from "../reliability-dependency-graph.js";
import { BusinessContinuityImpactEngine } from "../business-continuity-impact.js";
import { MultiSystemRecoveryCoordinator } from "../multi-system-recovery-coordinator.js";
import { ReliabilityInterventionOptimizer } from "../reliability-intervention-optimizer.js";
import { RecoveryCostOptimizer } from "../recovery-cost-optimizer.js";
import { EnterpriseRecoverySimulator } from "../enterprise-recovery-simulator.js";
import { EnterpriseReliabilityDecisionEngine } from "../enterprise-reliability-decision-engine.js";
import { AutonomousIncidentCommandEngine } from "../autonomous-incident-command.js";
import { RecoveryOutcomeEngine } from "../recovery-outcome-engine.js";
import { EnterpriseReliabilityLearningEngine } from "../enterprise-reliability-learning.js";
import { EnterpriseReliabilityScoreEngine } from "../enterprise-reliability-score.js";
import { EnterpriseReliabilityLedger } from "../enterprise-reliability-ledger.js";
import { EnterpriseReliabilityOrchestrationGate } from "../enterprise-reliability-orchestration-gate.js";
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

const P30_PROJ_DIR = join(process.cwd(), ".tmp_test_p30_e2e");

describe("AEGIS Phase 30 — Master Enterprise Reliability Orchestration & Continuity E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P30_PROJ_DIR)) rmSync(P30_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P30_PROJ_DIR, { recursive: true });
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
    EnterpriseReliabilityStateEngine.reset();
    EnterpriseReliabilityLedger.reset();
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
    EnterpriseReliabilityStateEngine.reset();
    EnterpriseReliabilityLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P30_PROJ_DIR)) rmSync(P30_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete reliability orchestration lifecycle across all 19 governance tiers and issues EnterpriseReliabilityOrchestrationCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_rel_core",
      name: "Enterprise Reliability Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_sre", name: "Enterprise SRE & Reliability", memberUserIds: ["sre_director_1"] }],
      projectIds: ["gym_p30_rel_proj"],
    });

    IdentityManager.registerActor({
      userId: "sre_director_1",
      name: "SRE Director",
      organizationId: "org_rel_core",
      role: "PLATFORM_ADMIN",
    });

    // 2. Cross-Project Dependency Topology & Impact Assessment
    const depAnalysis = ReliabilityDependencyGraph.analyzeGraph("gym_db_cluster", [
      { sourceProject: "gym_p30_rel_proj", targetProject: "gym_db_cluster", dependencyType: "DATABASE", isCritical: true },
      { sourceProject: "gym_billing_proj", targetProject: "gym_db_cluster", dependencyType: "DATABASE", isCritical: true },
    ]);
    expect(depAnalysis.isSinglePointOfFailure).toBe(true);

    const impact = BusinessContinuityImpactEngine.assessImpact("gym_p30_rel_proj", "Member Management Service", 1500, "VERIFIED");
    expect(impact.classification).toBe("VERIFIED");

    // 3. Zero-Mutation Recovery Simulation & Cost Analysis
    const sim = EnterpriseRecoverySimulator.simulateRecovery("DATABASE_POOL_FAILOVER", ["gym_p30_rel_proj", "gym_billing_proj"]);
    expect(sim.mutationsAttempted).toBe(0);
    expect(sim.isSimulationOnly).toBe(true);

    const costAnalysis = RecoveryCostOptimizer.evaluateEconomics("gym_p30_rel_proj", 10000, 250000);
    expect(costAnalysis.recommendation).toBe("HIGH_VALUE");

    // 4. Secret Masking & Worker Lease
    SecretProvider.setSecret("REL_TOKEN", "secure_rel_key_8899");
    expect(SecretProvider.maskSecrets("Bearer secure_rel_key_8899")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("rel_worker_1");
    expect(WorkerManager.acquireLease("rel_worker_1", "gym_p30_rel_proj", "job_p30_rel")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_rel_core",
      projectId: "gym_p30_rel_proj",
      name: "Gym Reliability Orchestration Node",
      projectPath: P30_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 5. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p30_rel_proj",
      projectPath: P30_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Reliability Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Reliability Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P30_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P30_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P30_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P30_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P30_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P30_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P30_PROJ_DIR, "prisma/schema.prisma"),
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
        projectPath: P30_PROJ_DIR,
        projectId: "gym_p30_rel_proj",
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
        projectId: "gym_p30_rel_proj",
        projectPath: P30_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 7. Multi-System Recovery Orchestration & Incident Command
      const recoveryPlan = MultiSystemRecoveryCoordinator.executeMultiSystemRecovery("gym_p30_rel_proj");
      expect(recoveryPlan.isCompleted).toBe(true);

      const incidentCmd = AutonomousIncidentCommandEngine.coordinateIncident("gym_p30_rel_proj", "Replica sync validated");
      expect(incidentCmd.isResolved).toBe(true);

      // 8. Outcome Verification: SERVICE_RECOVERED vs BUSINESS_RECOVERED
      const outcome = RecoveryOutcomeEngine.verifyOutcome(
        "gym_p30_rel_proj",
        true, // technical
        true, // data
        true, // api
        true  // business workflow
      );
      expect(outcome.finalOutcome).toBe("BUSINESS_RECOVERED");

      // 9. Model Calibration & Reliability Score
      const learning = EnterpriseReliabilityLearningEngine.calibrateReliability("gym_p30_rel_proj", 90, 90);
      expect(learning.rtoAccuracy).toBe(100);
      expect(learning.policyMutationsAttempted).toBe(0);

      const score = EnterpriseReliabilityScoreEngine.calculateScore({
        projectId: "gym_p30_rel_proj",
        technicalReliability: 100,
        businessContinuity: 100,
        recoveryReadiness: 100,
        predictionAccuracy: 100,
        rtoCompliance: 100,
      });
      expect(score.status).toBe("OPTIMIZED");
      expect(score.overallScore).toBe(100);

      // 10. Record State, Claims & Cryptographic Ledger Entry
      EnterpriseReliabilityStateEngine.updateState({
        projectId: "gym_p30_rel_proj",
        organizationId: "org_rel_core",
        environment: "production",
        state: "BUSINESS_RECOVERED",
        activeIncidentsCount: 0,
        rtoCompliancePercentage: 100,
        rpoCompliancePercentage: 100,
        lastVerifiedAt: new Date().toISOString(),
      });

      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p30_rel_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Reliability Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      EnterpriseReliabilityLedger.recordDecision({
        actorId: "sre_director_1",
        organizationId: "org_rel_core",
        projectId: "gym_p30_rel_proj",
        operation: "CERTIFY_ENTERPRISE_RELIABILITY_ORCHESTRATION",
        decisionType: "RELIABILITY_CERTIFIED",
        evidenceSummary: "Multi-system recovery verified across technical, data, API, and business workflow layers. 100% RTO compliance.",
      });

      // 11. Master Enterprise Reliability Orchestration Gate Certification (All 19 Tiers)
      const relCert = EnterpriseReliabilityOrchestrationGate.evaluate(P30_PROJ_DIR, "org_rel_core");
      expect(relCert.status).toBe("ENTERPRISE_RELIABILITY_CERTIFIED");
      expect(relCert.totalCertifiedGates).toBe(19);
      expect(existsSync(join(P30_PROJ_DIR, ".aegis", "enterprise-reliability-orchestration-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("rel_worker_1", "gym_p30_rel_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
