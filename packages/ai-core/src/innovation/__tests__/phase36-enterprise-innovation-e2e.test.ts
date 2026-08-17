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
import { InnovationSignalEngine } from "../innovation-signal-engine.js";
import { ProductOpportunityEngine } from "../product-opportunity-engine.js";
import { InnovationPrioritizer } from "../innovation-prioritizer.js";
import { InnovationImpactEngine } from "../innovation-impact-engine.js";
import { InnovationSimulationEngine } from "../innovation-simulator.js";
import { InnovationExperimentEngine } from "../innovation-experiment-engine.js";
import { ProductEvolutionPlanner } from "../product-evolution-planner.js";
import { InnovationAuthorizationEngine } from "../innovation-authorization.js";
import { InnovationExecutionEngine } from "../innovation-execution-engine.js";
import { InnovationVerificationEngine } from "../innovation-verification-engine.js";
import { InnovationOutcomeEngine } from "../innovation-outcome-engine.js";
import { InnovationLearningEngine } from "../innovation-learning-engine.js";
import { InnovationPatternEngine } from "../innovation-pattern-engine.js";
import { InnovationPortfolioEngine } from "../innovation-portfolio-engine.js";
import { EnterpriseInnovationWorkQueue } from "../innovation-work-queue.js";
import { EnterpriseInnovationDecisionEngine } from "../innovation-decision-engine.js";
import { EnterpriseInnovationDecisionLedger } from "../innovation-decision-ledger.js";
import { EnterpriseInnovationGovernanceGate } from "../enterprise-innovation-governance-gate.js";
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

const P36_PROJ_DIR = join(process.cwd(), ".tmp_test_p36_e2e");

describe("AEGIS Phase 36 — Master Autonomous Enterprise Innovation E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P36_PROJ_DIR)) rmSync(P36_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P36_PROJ_DIR, { recursive: true });
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
    ProductOpportunityEngine.reset();
    InnovationExperimentEngine.reset();
    InnovationAuthorizationEngine.reset();
    EnterpriseInnovationWorkQueue.reset();
    EnterpriseInnovationDecisionLedger.reset();
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
    ProductOpportunityEngine.reset();
    InnovationExperimentEngine.reset();
    InnovationAuthorizationEngine.reset();
    EnterpriseInnovationWorkQueue.reset();
    EnterpriseInnovationDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P36_PROJ_DIR)) rmSync(P36_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete enterprise innovation lifecycle across all 25 governance tiers and issues EnterpriseInnovationGovernanceCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_innov_core",
      name: "Enterprise Innovation Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_innov", name: "Product Innovation Council", memberUserIds: ["prod_lead_1"] }],
      projectIds: ["gym_p36_innov_proj"],
    });

    IdentityManager.registerActor({
      userId: "prod_lead_1",
      name: "Head of Product Innovation",
      organizationId: "org_innov_core",
      role: "PRODUCT_LEAD",
    });

    // 2. Discover Innovation Signals & Create Opportunity
    const signals = InnovationSignalEngine.discoverSignals("gym_p36_innov_proj", 10, 2, 0.3);
    expect(signals.length).toBeGreaterThan(0);

    const opp = ProductOpportunityEngine.createOpportunity({
      projectId: "gym_p36_innov_proj",
      organizationId: "org_innov_core",
      teamId: "t_innov",
      title: "Real-Time Member Attendance Analytics Hub",
      sourceSignalId: signals[0].signalId,
      sourceEvidenceSummary: signals[0].sourceEvidenceSummary,
      affectedProjects: ["gym_p36_innov_proj"],
      affectedTeams: ["t_innov"],
      expectedUsers: 600,
      expectedValueINR: 150000,
      estimatedCostINR: 25000,
      riskLevel: "LOW",
      confidenceScore: 0.96,
      authorizationRequired: true,
    });
    expect(opp.status).toBe("DISCOVERED");

    // 3. Deterministic Prioritization, Impact Analysis & Zero-Mutation Simulation
    const ranked = InnovationPrioritizer.prioritizeOpportunities([opp]);
    expect(ranked[0].priorityTier).toBe("CRITICAL");

    const impact = InnovationImpactEngine.evaluateImpact(opp.opportunityId, ["gym_p36_innov_proj"], ["/api/members/attendance"], ["PostgreSQL"], false);
    expect(impact.impactLevel).toBe("LOCAL");
    expect(impact.tenantIsolationPreserved).toBe(true);

    const sim = InnovationSimulationEngine.simulateInnovation(opp.opportunityId, 150000, 25000);
    expect(sim.sourceMutationsAttempted).toBe(0);
    expect(sim.simulationHash).toBeDefined();

    ProductOpportunityEngine.transitionState(opp.opportunityId, "SIMULATED");

    // 4. Human Authorization & Governed Experimentation
    InnovationAuthorizationEngine.requestAuthorization(opp.opportunityId, "prod_lead_1", "tenant_gym", "org_innov_core", "PRODUCT_LEAD");
    const auth = InnovationAuthorizationEngine.grantAuthorization(opp.opportunityId, "prod_lead_1", "sig_prod_lead_p36_valid");
    expect(auth.status).toBe("APPROVED");

    ProductOpportunityEngine.transitionState(opp.opportunityId, "APPROVED");

    const exp = InnovationExperimentEngine.createExperiment(
      opp.opportunityId,
      "gym_p36_innov_proj",
      "canary_attendance_v1",
      10,
      "latency < 50ms & 0 errors",
      1.0,
      3600
    );
    expect(exp.status).toBe("PROPOSED");

    // 5. Product Evolution Planning & Governed Execution
    const plan = ProductEvolutionPlanner.compilePlan(opp.opportunityId, ["gym_p36_innov_proj"], "NOW");
    expect(plan.milestones.length).toBe(3);

    ProductOpportunityEngine.transitionState(opp.opportunityId, "PLANNED");
    ProductOpportunityEngine.transitionState(opp.opportunityId, "IMPLEMENTING");

    const execResult = await InnovationExecutionEngine.executeInnovation(plan, auth.authorizationId);
    expect(execResult.status).toBe("COMPLETED");

    // 6. Secret Masking & Worker Lease
    SecretProvider.setSecret("INNOV_TOKEN", "secure_innov_key_9900");
    expect(SecretProvider.maskSecrets("Bearer secure_innov_key_9900")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("innov_worker_1");
    expect(WorkerManager.acquireLease("innov_worker_1", "gym_p36_innov_proj", "job_p36_innov")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_innov_core",
      projectId: "gym_p36_innov_proj",
      name: "Gym Innovation Node",
      projectPath: P36_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 7. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p36_innov_proj",
      projectPath: P36_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Innovation Governance Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Innovation Governance Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P36_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P36_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P36_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P36_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P36_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P36_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P36_PROJ_DIR, "prisma/schema.prisma"),
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
        projectPath: P36_PROJ_DIR,
        projectId: "gym_p36_innov_proj",
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
        projectId: "gym_p36_innov_proj",
        projectPath: P36_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 9. Multi-Dimensional Verification & Verified Value Realization
      ProductOpportunityEngine.transitionState(opp.opportunityId, "VERIFYING");

      const verifyReport = InnovationVerificationEngine.verifyInnovation({
        opportunityId: opp.opportunityId,
        technicalBuildPassed: true,
        securityChecksPassed: true,
        productFeaturesVerified: true,
        operationalLatencyHealthy: true,
        businessKpiPreserved: true,
      });
      expect(verifyReport.overallPassed).toBe(true);

      const outcomeReport = InnovationOutcomeEngine.evaluateOutcome(
        opp.opportunityId,
        "gym_p36_innov_proj",
        150000,
        155000,
        150000,
        25000
      );
      expect(outcomeReport.classification).toBe("VALUE_REALIZED");
      expect(outcomeReport.realizedRoi).toBe(6.0);

      ProductOpportunityEngine.transitionState(opp.opportunityId, "REALIZED");

      // 10. Pattern Intelligence & Model Learning
      const pattern = InnovationPatternEngine.detectPatterns("MemberAnalytics", 6, 0);
      expect(pattern.patternType).toBe("REPEATED_CUSTOMER_REQUEST");

      const learning = InnovationLearningEngine.extractLearning(20);
      expect(learning.safetyPolicyMutationsAttempted).toBe(0);

      const portfolio = InnovationPortfolioEngine.calculatePortfolio(10, 2, 8, 7, 800000, 780000, 130000);
      expect(portfolio.realizationRatePercentage).toBe(98);

      // 11. Record Evidence Claims & Cryptographic Ledger Entry
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p36_innov_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Innovation Governance Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      EnterpriseInnovationDecisionLedger.recordEvent({
        actorId: "prod_lead_1",
        tenantId: "tenant_gym",
        organizationId: "org_innov_core",
        projectId: "gym_p36_innov_proj",
        opportunityId: opp.opportunityId,
        eventType: "INNOVATION_GOVERNANCE_CERTIFIED",
        evidenceSummary: "Product innovation verified across Technical, Security, Product, and Business layers delivering ₹1,50,000 INR verified value.",
      });

      // 12. Master Enterprise Innovation Governance Gate Certification (All 25 Tiers)
      const innovCert = EnterpriseInnovationGovernanceGate.evaluate(P36_PROJ_DIR, "org_innov_core");
      expect(innovCert.status).toBe("ENTERPRISE_INNOVATION_GOVERNANCE_CERTIFIED");
      expect(innovCert.totalCertifiedGates).toBe(25);
      expect(existsSync(join(P36_PROJ_DIR, ".aegis", "enterprise-innovation-governance-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("innov_worker_1", "gym_p36_innov_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
