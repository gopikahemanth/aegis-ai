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
import { ResilienceRiskEngine } from "../enterprise-risk-engine.js";
import { SystemicRiskAnalyzer } from "../systemic-risk-analyzer.js";

import { FailureScenarioEngine } from "../failure-scenario-engine.js";
import { DisasterRecoveryEngine } from "../disaster-recovery-engine.js";
import { BusinessContinuityEngine } from "../business-continuity-engine.js";
import { ResilienceScoreEngine } from "../resilience-score-engine.js";
import { RecoveryVerificationEngine } from "../recovery-verification-engine.js";
import { ResilienceDecisionLedger } from "../resilience-decision-ledger.js";
import { EnterpriseResilienceGate } from "../enterprise-resilience-gate.js";
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

const P27_PROJ_DIR = join(process.cwd(), ".tmp_test_p27_e2e");

describe("AEGIS Phase 27 — Master Enterprise Risk Intelligence & Resilience Governance E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P27_PROJ_DIR)) rmSync(P27_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P27_PROJ_DIR, { recursive: true });
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
    ResilienceDecisionLedger.reset();
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
    ResilienceDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P27_PROJ_DIR)) rmSync(P27_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete enterprise resilience lifecycle across all 16 governance tiers and issues EnterpriseResilienceCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_resil_core",
      name: "Enterprise Resilience Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_sre", name: "Site Reliability & Resilience", memberUserIds: ["sre_director_1"] }],
      projectIds: ["gym_p27_resil_proj"],
    });

    IdentityManager.registerActor({
      userId: "sre_director_1",
      name: "SRE Director",
      organizationId: "org_resil_core",
      role: "PLATFORM_ADMIN",
    });

    // 2. Risk Detection & Systemic Dependency Analysis
    const risk = ResilienceRiskEngine.registerRisk({

      organizationId: "org_resil_core",
      projectId: "gym_p27_resil_proj",
      category: "DATABASE",
      severity: "LOW",
      probabilityScore: 20,
      impactScore: 80,
      classification: "OBSERVED",
      affectedProjects: ["gym_p27_resil_proj"],
      mitigationRecommendation: "Automated snapshot and live restore verification",
    });
    expect(risk.classification).toBe("OBSERVED");

    const findings = SystemicRiskAnalyzer.analyzeDependencies([
      { sourceProject: "gym_p27_resil_proj", targetProject: "core_db_node", isCritical: true },
    ]);
    expect(findings.length).toBe(0); // Clean single point of failure boundary

    // 3. Zero-Mutation Failure Scenario Simulation
    const scenario = FailureScenarioEngine.simulateFault("Database Network Blip", "DATABASE_UNAVAILABLE");
    expect(scenario.mutationsAttempted).toBe(0);
    expect(scenario.dataLossRisk).toBe("NONE");

    // 4. Disaster Recovery Status & Business Continuity
    DisasterRecoveryEngine.updateStatus({
      projectId: "gym_p27_resil_proj",
      rpoSeconds: 30,
      rtoMinutes: 2,
      backupFreshnessMinutes: 5,
      status: "READY",
      lastVerifiedAt: new Date().toISOString(),
    });

    BusinessContinuityEngine.registerCapability({
      capabilityId: "cap_gym_mgmt",
      name: "Member Management & Attendance",
      criticality: "TIER_1_MISSION_CRITICAL",
      dependentProjects: ["gym_p27_resil_proj"],
      fallbackStrategy: "Offline sync & local cache replay",
      continuityStatus: "FULLY_RESILIENT",
    });

    // 5. Secret Masking & Worker Lease
    SecretProvider.setSecret("RESIL_TOKEN", "secure_resil_key_9988");
    expect(SecretProvider.maskSecrets("Bearer secure_resil_key_9988")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("resil_worker_1");
    expect(WorkerManager.acquireLease("resil_worker_1", "gym_p27_resil_proj", "job_p27_resil")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_resil_core",
      projectId: "gym_p27_resil_proj",
      name: "Gym Resilience Master Node",
      projectPath: P27_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 6. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p27_resil_proj",
      projectPath: P27_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Resilience Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Resilience Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P27_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P27_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P27_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P27_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P27_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P27_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P27_PROJ_DIR, "prisma/schema.prisma"),
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
        projectPath: P27_PROJ_DIR,
        projectId: "gym_p27_resil_proj",
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
        projectId: "gym_p27_resil_proj",
        projectPath: P27_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 8. Recovery Verification & Resilience Score
      const recoveryResult = RecoveryVerificationEngine.verifyRecovery(
        "gym_p27_resil_proj",
        true,
        true,
        true
      );
      expect(recoveryResult.status).toBe("VERIFIED_RECOVERABLE");

      const resilienceScore = ResilienceScoreEngine.computeResilience("gym_p27_resil_proj", 99, 98, 100, 95);
      expect(resilienceScore.status).toBe("RESILIENT");
      expect(resilienceScore.overallScore).toBeGreaterThanOrEqual(95);

      // 9. Record Evidence Claims & Resilience Decision
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p27_resil_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Resilience Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      ResilienceDecisionLedger.recordDecision({
        actorId: "sre_director_1",
        organizationId: "org_resil_core",
        projectId: "gym_p27_resil_proj",
        operation: "CERTIFY_RESILIENCE",
        decisionType: "RESILIENCE_CERTIFIED",
        evidenceSummary: "Live restore and 98% resilience score verified.",
      });

      // 10. Master Enterprise Resilience Gate Certification (All 16 Tiers)
      const resilCert = EnterpriseResilienceGate.evaluate(P27_PROJ_DIR, "org_resil_core");
      expect(resilCert.status).toBe("ENTERPRISE_RESILIENCE_CERTIFIED");
      expect(resilCert.totalCertifiedGates).toBe(16);
      expect(existsSync(join(P27_PROJ_DIR, ".aegis", "enterprise-resilience-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("resil_worker_1", "gym_p27_resil_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
