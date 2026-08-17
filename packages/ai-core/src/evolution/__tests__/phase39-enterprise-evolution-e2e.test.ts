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
import { EnterpriseEvolutionStateEngine } from "../enterprise-evolution-state.js";
import { ChangeOpportunityEngine } from "../change-opportunity-engine.js";
import { EvolutionProposalEngine } from "../evolution-proposal-engine.js";
import { EvolutionImpactEngine } from "../evolution-impact-engine.js";
import { EvolutionSimulationEngine } from "../evolution-simulator.js";
import { EvolutionAuthorizationEngine } from "../evolution-authorization.js";
import { EvolutionExecutionEngine } from "../evolution-execution-engine.js";
import { EvolutionVerificationEngine } from "../evolution-verification-engine.js";
import { EvolutionRecoveryEngine } from "../evolution-recovery-engine.js";

import { EvolutionLearningEngine } from "../evolution-learning-engine.js";
import { EvolutionPortfolioEngine } from "../evolution-portfolio-engine.js";
import { EvolutionWorkQueue } from "../evolution-work-queue.js";
import { EvolutionDecisionEngine } from "../evolution-decision-engine.js";
import { EvolutionDecisionLedger } from "../evolution-decision-ledger.js";
import { EvolutionEvidenceLedger } from "../evolution-evidence-ledger.js";
import { EnterpriseEvolutionGate } from "../enterprise-evolution-gate.js";
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

const P39_PROJ_DIR = join(process.cwd(), ".tmp_test_p39_e2e");

describe("AEGIS Phase 39 — Master Autonomous Enterprise Evolution & Verified Continuous Improvement E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P39_PROJ_DIR)) rmSync(P39_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P39_PROJ_DIR, { recursive: true });
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
    EnterpriseEvolutionStateEngine.reset();
    EvolutionWorkQueue.reset();
    EvolutionDecisionLedger.reset();
    EvolutionEvidenceLedger.reset();
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
    EnterpriseEvolutionStateEngine.reset();
    EvolutionWorkQueue.reset();
    EvolutionDecisionLedger.reset();
    EvolutionEvidenceLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P39_PROJ_DIR)) rmSync(P39_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete enterprise evolution governance cycle across all 28 tiers and issues EnterpriseEvolutionCertificate", async () => {
    // 1. Enterprise Organization & Actor Setup
    OrganizationManager.createOrganization({
      organizationId: "org_enterprise_core",
      name: "Global Enterprise Architecture Core",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_arch", name: "Architecture Evolution Team", memberUserIds: ["platform_admin_1"] }],
      projectIds: ["gym_p39_evol_proj"],
    });

    IdentityManager.registerActor({
      userId: "platform_admin_1",
      name: "Principal Platform Architect",
      organizationId: "org_enterprise_core",
      role: "PLATFORM_ADMIN",
    });

    // 2. Enterprise Evolution State Initialization
    const stateRecord = EnterpriseEvolutionStateEngine.initializeEvolution(
      "evol_gym_arch_v2",
      "gym_p39_evol_proj",
      "tenant_enterprise",
      1,
      1
    );
    expect(stateRecord.stage).toBe("OBSERVED");

    // 3. Change Opportunity Discovery (OPPORTUNITY != CHANGE)
    const opps = ChangeOpportunityEngine.discoverOpportunities("gym_p39_evol_proj", 2, 0.28, 1);
    expect(opps.length).toBeGreaterThan(0);
    const chosenOpp = opps[0];

    EnterpriseEvolutionStateEngine.transitionStage("evol_gym_arch_v2", "OPPORTUNITY_IDENTIFIED");

    // 4. Evolution Proposal Creation
    const proposal = EvolutionProposalEngine.createProposal(
      chosenOpp.opportunityId,
      "ARCHITECTURE_CHANGE",
      "Event-Driven Telemetry & Real-Time Sync Hub",
      ["gym_p39_evol_proj"],
      150000,
      25000,
      chosenOpp.evidenceSummary
    );
    expect(proposal.proposalId).toBeDefined();

    EnterpriseEvolutionStateEngine.transitionStage("evol_gym_arch_v2", "PROPOSED");

    // 5. Blast Radius & Impact Analysis
    const impact = EvolutionImpactEngine.evaluateImpact(
      chosenOpp.opportunityId,
      ["gym_p39_evol_proj"],
      ["api-gateway", "telemetry-service"],
      ["@aegis/ai-core"],
      ["postgres-primary"]
    );
    expect(impact.scope).toBe("LOCAL");

    // 6. Zero-Mutation Simulation (Guaranteed 0 Mutations)
    const sim = EvolutionSimulationEngine.simulateEvolution(chosenOpp.opportunityId, 4, 1);
    expect(sim.sourceMutationsAttempted).toBe(0);
    expect(sim.databaseMutationsAttempted).toBe(0);
    expect(sim.deploymentMutationsAttempted).toBe(0);
    expect(sim.productionMutationsAttempted).toBe(0);
    expect(sim.simulationHash).toBeDefined();

    EnterpriseEvolutionStateEngine.transitionStage("evol_gym_arch_v2", "SIMULATED");

    // 7. Human Platform Admin Authorization
    EvolutionAuthorizationEngine.requestAuthorization(
      chosenOpp.opportunityId,
      "platform_admin_1",
      "PLATFORM_ADMIN"
    );
    const auth = EvolutionAuthorizationEngine.grantAuthorization(
      chosenOpp.opportunityId,
      "platform_admin_1",
      "sig_platform_admin_p39_valid"
    );
    expect(auth.status).toBe("APPROVED");


    EnterpriseEvolutionStateEngine.transitionStage("evol_gym_arch_v2", "AUTHORIZED");

    // 8. Secret Masking & Worker Lease
    SecretProvider.setSecret("EVOL_TOKEN", "evol_master_auth_secret_7711");
    expect(SecretProvider.maskSecrets("Bearer evol_master_auth_secret_7711")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("evol_worker_1");
    expect(WorkerManager.acquireLease("evol_worker_1", "gym_p39_evol_proj", "job_p39_evol")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_enterprise_core",
      projectId: "gym_p39_evol_proj",
      name: "Gym Evolution Node",
      projectPath: P39_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 9. Generation 1 Execution
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p39_evol_proj",
      projectPath: P39_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Enterprise Evolution Master</h1></body></html>");
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    });

    await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));

    try {
      const baseUrl = `http://127.0.0.1:${port}`;

      EnterpriseEvolutionStateEngine.transitionStage("evol_gym_arch_v2", "EXECUTING");

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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Enterprise Evolution Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P39_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P39_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P39_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P39_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P39_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P39_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P39_PROJ_DIR, "prisma/schema.prisma"),
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

      // 10. Production Release & Staged Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P39_PROJ_DIR,
        projectId: "gym_p39_evol_proj",
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
        projectId: "gym_p39_evol_proj",
        projectPath: P39_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 11. Multi-Dimensional Evolution Verification
      EnterpriseEvolutionStateEngine.transitionStage("evol_gym_arch_v2", "VERIFYING");

      const verifyReport = EvolutionVerificationEngine.verifyEvolution({
        opportunityId: chosenOpp.opportunityId,
        technicalBuildPassed: true,
        architecturalCouplingReduced: true,
        operationalLatencyHealthy: true,
        businessKpiPreserved: true,
      });
      expect(verifyReport.overallPassed).toBe(true);


      EnterpriseEvolutionStateEngine.transitionStage("evol_gym_arch_v2", "VERIFIED");

      // 12. Recovery Capability Verification
      const recoveryTest = EvolutionRecoveryEngine.executeRecovery(
        "evol_gym_arch_v2",
        "gym_p39_evol_proj",
        "chk_baseline_pre_evol",
        "ROLLBACK"
      );
      expect(recoveryTest.recoveryVerified).toBe(true);

      // 13. Continuous Improvement Learning (0 Policy Mutations)
      const learnReport = EvolutionLearningEngine.recordEvolutionOutcome(
        chosenOpp.opportunityId,
        150000,
        148000,
        12,
        10
      );
      expect(learnReport.learningId).toBeDefined();

      EnterpriseEvolutionStateEngine.transitionStage("evol_gym_arch_v2", "LEARNED");

      // 14. Record Evidence Claims & Append-Only Ledgers
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p39_evol_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Enterprise Evolution Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      EvolutionEvidenceLedger.recordClaim(
        "evol_gym_arch_v2",
        "gym_p39_evol_proj",
        "OUTCOME_VERIFIED",
        { verifiedBenefitsINR: 148000, latencyReductionMs: 38 },
        true
      );

      EvolutionDecisionLedger.recordEvent({
        actorId: "platform_admin_1",
        organizationId: "org_enterprise_core",
        projectId: "gym_p39_evol_proj",
        opportunityId: chosenOpp.opportunityId,
        eventType: "EVOLUTION_VERIFIED",
        evidenceSummary: "Enterprise architectural evolution verified across all 28 governance tiers delivering ₹1,48,000 INR verified benefit.",
      });


      // 15. Master Enterprise Evolution Gate Certification (All 28 Tiers)
      const evolCert = EnterpriseEvolutionGate.evaluate(P39_PROJ_DIR, "org_enterprise_core");
      expect(evolCert.status).toBe("ENTERPRISE_EVOLUTION_CERTIFIED");
      expect(evolCert.totalCertifiedGates).toBe(28);
      expect(existsSync(join(P39_PROJ_DIR, ".aegis", "enterprise-evolution-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("evol_worker_1", "gym_p39_evol_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
