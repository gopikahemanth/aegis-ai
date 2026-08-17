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
import { EnterpriseChangeRegistry } from "../enterprise-change-registry.js";
import { ChangeImpactEngine } from "../change-impact-engine.js";
import { ChangeRiskEngine } from "../change-risk-engine.js";
import { ChangeDependencyEngine } from "../change-dependency-engine.js";
import { ChangeSimulationEngine } from "../change-simulator.js";
import { ChangeApprovalEngine } from "../change-approval-engine.js";
import { ChangeScheduler } from "../change-scheduler.js";
import { ChangeVerificationEngine } from "../change-verification-engine.js";
import { ChangeOutcomeEngine } from "../change-outcome-engine.js";
import { ChangeLearningEngine } from "../change-learning-engine.js";
import { ChangePatternEngine } from "../change-pattern-engine.js";
import { ChangePortfolioEngine } from "../change-portfolio-engine.js";
import { ContinuousImprovementEngine } from "../continuous-improvement-engine.js";
import { EnterpriseChangeWorkQueue } from "../change-work-queue.js";
import { EnterpriseChangeDecisionEngine } from "../change-decision-engine.js";
import { EnterpriseChangeDecisionLedger } from "../change-decision-ledger.js";
import { EnterpriseChangeGovernanceGate } from "../enterprise-change-governance-gate.js";
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

const P34_PROJ_DIR = join(process.cwd(), ".tmp_test_p34_e2e");

describe("AEGIS Phase 34 — Master Autonomous Enterprise Change Governance E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P34_PROJ_DIR)) rmSync(P34_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P34_PROJ_DIR, { recursive: true });
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
    EnterpriseChangeRegistry.reset();
    ChangeApprovalEngine.reset();
    EnterpriseChangeWorkQueue.reset();
    EnterpriseChangeDecisionLedger.reset();
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
    EnterpriseChangeRegistry.reset();
    ChangeApprovalEngine.reset();
    EnterpriseChangeWorkQueue.reset();
    EnterpriseChangeDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P34_PROJ_DIR)) rmSync(P34_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete enterprise change governance lifecycle across all 23 governance tiers and issues EnterpriseChangeGovernanceCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_chg_core",
      name: "Enterprise Change Governance Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_chg", name: "Enterprise Change Council", memberUserIds: ["chg_lead_1"] }],
      projectIds: ["gym_p34_chg_proj"],
    });

    IdentityManager.registerActor({
      userId: "chg_lead_1",
      name: "Change Governance Lead",
      organizationId: "org_chg_core",
      role: "PLATFORM_ADMIN",
    });

    // 2. Register Change & Evaluate Impact, Risk, and Dependencies
    const chg = EnterpriseChangeRegistry.registerChange({
      projectId: "gym_p34_chg_proj",
      organizationId: "org_chg_core",
      teamId: "t_chg",
      environment: "production",
      sourceExecutionId: "exec_perf_boost_v4",
      sourceDecisionId: "dec_perf_boost_v4",
      title: "Deploy Gym Gateway V4 Performance Boost",
      affectedFiles: ["server/routes/members.ts"],
      affectedServices: ["GymGateway"],
      affectedDatabases: ["PostgreSQL"],
      dependencies: [],
      riskClassification: "LOW",
      expectedOutcome: "Increase Member Throughput by 25%",
      actor: "chg_lead_1",
    });

    expect(chg.status).toBe("PROPOSED");

    const impact = ChangeImpactEngine.calculateImpact(chg.changeId, ["gym_p34_chg_proj"], ["GymGateway"], ["/api/members"], ["PostgreSQL"]);
    expect(impact.scope).toBe("ISOLATED");

    const risk = ChangeRiskEngine.evaluateRisk({
      changeId: chg.changeId,
      dependencyCount: 0,
      hasDatabaseMigration: false,
      isSecuritySensitive: false,
      hasRollbackProcedure: true,
      historicalFailureRatePercentage: 0,
    });
    expect(risk.riskLevel).toBe("LOW");

    const deps = ChangeDependencyEngine.analyzeDependencies([{ changeId: chg.changeId, dependsOnChangeIds: [] }]);
    expect(deps.status).toBe("SAFE_ORDER");

    // 3. Zero-Mutation Simulation & Human Approval
    const sim = ChangeSimulationEngine.simulateChange(chg.changeId, 1, 1);
    expect(sim.sourceMutationsAttempted).toBe(0);
    expect(sim.classification).toBe("SIMULATED");

    ChangeApprovalEngine.requestApproval(chg.changeId, "chg_lead_1");
    const approval = ChangeApprovalEngine.grantApproval(chg.changeId, "chg_lead_1", "sig_chg_lead_p34_valid");
    expect(approval.status).toBe("APPROVED");

    // 4. Scheduling Evaluation
    const schedule = ChangeScheduler.evaluateSchedule({
      changeId: chg.changeId,
      hasActiveIncidents: false,
      isSloExhausted: false,
      isInMaintenanceWindow: true,
      concurrentChangesCount: 1,
    });
    expect(schedule.decision).toBe("EXECUTE_NOW");

    // 5. Secret Masking & Worker Lease
    SecretProvider.setSecret("CHG_TOKEN", "secure_chg_key_3344");
    expect(SecretProvider.maskSecrets("Bearer secure_chg_key_3344")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("chg_worker_1");
    expect(WorkerManager.acquireLease("chg_worker_1", "gym_p34_chg_proj", "job_p34_chg")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_chg_core",
      projectId: "gym_p34_chg_proj",
      name: "Gym Change Governance Node",
      projectPath: P34_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 6. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p34_chg_proj",
      projectPath: P34_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Change Governance Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Change Governance Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P34_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P34_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P34_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P34_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P34_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P34_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P34_PROJ_DIR, "prisma/schema.prisma"),
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
        projectPath: P34_PROJ_DIR,
        projectId: "gym_p34_chg_proj",
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
        projectId: "gym_p34_chg_proj",
        projectPath: P34_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 8. Change Verification & Outcome Reconciliation
      const verifyReport = ChangeVerificationEngine.verifyChange({
        changeId: chg.changeId,
        buildAndTestsPassed: true,
        apiContractValid: true,
        operationalLatencyHealthy: true,
        businessKpiPreserved: true,
      });
      expect(verifyReport.overallPassed).toBe(true);

      const outcomeReport = ChangeOutcomeEngine.evaluateOutcome(chg.changeId, "gym_p34_chg_proj", 25, 27, 85000);
      expect(outcomeReport.classification).toBe("EXPECTED_SUCCESS");

      // 9. Pattern Intelligence & Continuous Improvement Proposal
      const pattern = ChangePatternEngine.detectPatterns("GymGateway", 10, 0);
      expect(pattern.patternType).toBe("REPEATED_SUCCESS");

      const improvement = ContinuousImprovementEngine.proposeImprovement("gym_p34_chg_proj", "INCREASE_OBSERVABILITY");
      expect(improvement.authorizationRequired).toBe(true);

      const portfolio = ChangePortfolioEngine.calculatePortfolioMetrics(50, 48, 2, 1);
      expect(portfolio.changeSuccessRatePercentage).toBe(96);

      // 10. Record Evidence Claims & Cryptographic Ledger Entry
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p34_chg_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Change Governance Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      EnterpriseChangeDecisionLedger.recordEvent({
        actorId: "chg_lead_1",
        organizationId: "org_chg_core",
        projectId: "gym_p34_chg_proj",
        changeId: chg.changeId,
        eventType: "CHANGE_GOVERNANCE_CERTIFIED",
        evidenceSummary: "Enterprise change verified across Technical, Operational, and Business layers with 0 safety policy mutations.",
      });

      // 11. Master Enterprise Change Governance Gate Certification (All 23 Tiers)
      const chgCert = EnterpriseChangeGovernanceGate.evaluate(P34_PROJ_DIR, "org_chg_core");
      expect(chgCert.status).toBe("ENTERPRISE_CHANGE_GOVERNANCE_CERTIFIED");
      expect(chgCert.totalCertifiedGates).toBe(23);
      expect(existsSync(join(P34_PROJ_DIR, ".aegis", "enterprise-change-governance-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("chg_worker_1", "gym_p34_chg_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
