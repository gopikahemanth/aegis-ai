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
import { EvolutionDiscoveryEngine } from "../evolution-discovery-engine.js";
import { EvolutionOpportunityRegistry } from "../evolution-opportunity.js";
import { ArchitectureImprovementEngine } from "../architecture-improvement-engine.js";
import { EvolutionBenefitEngine } from "../evolution-benefit-engine.js";
import { EvolutionImpactEngine } from "../evolution-impact-engine.js";
import { EvolutionSimulationEngine } from "../evolution-simulator.js";
import { EvolutionRiskEngine } from "../evolution-risk-engine.js";
import { EvolutionAuthorizationEngine } from "../evolution-authorization.js";
import { EvolutionPlanner } from "../evolution-planner.js";
import { EvolutionExecutionEngine } from "../evolution-execution-engine.js";
import { EvolutionVerificationEngine } from "../evolution-verification-engine.js";
import { EvolutionOutcomeEngine } from "../evolution-outcome-engine.js";
import { EvolutionLearningEngine } from "../evolution-learning-engine.js";
import { EvolutionPatternEngine } from "../evolution-pattern-engine.js";
import { EvolutionPortfolioEngine } from "../evolution-portfolio-engine.js";
import { ContinuousEvolutionRoadmap } from "../continuous-evolution-roadmap.js";
import { EnterpriseEvolutionWorkQueue } from "../evolution-work-queue.js";
import { EnterpriseEvolutionDecisionEngine } from "../evolution-decision-engine.js";
import { EnterpriseEvolutionDecisionLedger } from "../evolution-decision-ledger.js";
import { EnterpriseEvolutionGovernanceGate } from "../enterprise-evolution-governance-gate.js";
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

const P35_PROJ_DIR = join(process.cwd(), ".tmp_test_p35_e2e");

describe("AEGIS Phase 35 — Master Autonomous Enterprise Evolution E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P35_PROJ_DIR)) rmSync(P35_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P35_PROJ_DIR, { recursive: true });
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
    EvolutionOpportunityRegistry.reset();
    EvolutionAuthorizationEngine.reset();
    EnterpriseEvolutionWorkQueue.reset();
    EnterpriseEvolutionDecisionLedger.reset();
    ContinuousEvolutionRoadmap.reset();
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
    EvolutionOpportunityRegistry.reset();
    EvolutionAuthorizationEngine.reset();
    EnterpriseEvolutionWorkQueue.reset();
    EnterpriseEvolutionDecisionLedger.reset();
    ContinuousEvolutionRoadmap.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P35_PROJ_DIR)) rmSync(P35_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete enterprise evolution lifecycle across all 24 governance tiers and issues EnterpriseEvolutionGovernanceCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_evo_core",
      name: "Enterprise Evolution Core Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_evo", name: "Enterprise Architecture Council", memberUserIds: ["arch_lead_1"] }],
      projectIds: ["gym_p35_evo_proj"],
    });

    IdentityManager.registerActor({
      userId: "arch_lead_1",
      name: "Principal Enterprise Architect",
      organizationId: "org_evo_core",
      role: "ENTERPRISE_ARCHITECT",
    });

    // 2. Discover Opportunities & Register Opportunity
    const discovered = EvolutionDiscoveryEngine.discoverOpportunities("gym_p35_evo_proj", 1, 60, 4);
    expect(discovered.length).toBeGreaterThan(0);

    const opp = EvolutionOpportunityRegistry.registerOpportunity({
      organizationId: "org_evo_core",
      projectId: "gym_p35_evo_proj",
      teamId: "t_evo",
      environment: "production",
      type: "ARCHITECTURAL_IMPROVEMENT",
      title: "Decouple Gym Gateway Core",
      sourceEvidence: "Coupling metrics score 60% with 1 downstream latency incident",
      affectedSystems: ["GymGateway", "AuthModule"],
      expectedBenefit: "+30% Maintainability & +25% Throughput",
      estimatedCostINR: 20000,
      riskLevel: "LOW",
      confidenceScore: 0.96,
      dependencies: [],
    });

    expect(opp.status).toBe("DISCOVERED");

    // 3. Benefit, Impact, and Risk Analysis
    const benefit = EvolutionBenefitEngine.estimateBenefit(opp.opportunityId, 95000, 20000, 30);
    expect(benefit.classification).toBe("VERY_HIGH_VALUE");
    expect(benefit.roiRatio).toBe(4.75);

    const impact = EvolutionImpactEngine.evaluateImpact(opp.opportunityId, ["gym_p35_evo_proj"], ["GymGateway"], ["@aegis/ai-core"], ["PostgreSQL"]);
    expect(impact.scope).toBe("LOCAL");

    const risk = EvolutionRiskEngine.evaluateRisk({
      opportunityId: opp.opportunityId,
      hasRollbackPlan: true,
      isDatabaseRestructure: false,
      affectedComponentsCount: 1,
      historicalFailureRate: 0,
    });
    expect(risk.riskLevel).toBe("LOW");

    // 4. Zero-Mutation Simulation & Human Authorization
    const sim = EvolutionSimulationEngine.simulateEvolution(opp.opportunityId, 4, 1);
    expect(sim.sourceMutationsAttempted).toBe(0);
    expect(sim.simulationHash).toBeDefined();

    EvolutionOpportunityRegistry.transitionState(opp.opportunityId, "SIMULATED");

    EvolutionAuthorizationEngine.requestAuthorization(opp.opportunityId, "arch_lead_1", "ENTERPRISE_ARCHITECT");
    const auth = EvolutionAuthorizationEngine.grantAuthorization(opp.opportunityId, "arch_lead_1", "sig_arch_lead_p35_valid");
    expect(auth.status).toBe("APPROVED");

    EvolutionOpportunityRegistry.transitionState(opp.opportunityId, "APPROVED");

    // 5. Compile Multi-Phase Plan & Execute Evolution
    const plan = EvolutionPlanner.compilePlan(opp.opportunityId, sim.simulationId, auth.authorizationId);
    expect(plan.phases.length).toBe(6);

    EvolutionOpportunityRegistry.transitionState(opp.opportunityId, "PLANNED");
    EvolutionOpportunityRegistry.transitionState(opp.opportunityId, "EXECUTING");

    const execResult = await EvolutionExecutionEngine.executeEvolution(plan);
    expect(execResult.status).toBe("COMPLETED");


    // 6. Secret Masking & Worker Lease
    SecretProvider.setSecret("EVO_TOKEN", "secure_evo_key_8899");
    expect(SecretProvider.maskSecrets("Bearer secure_evo_key_8899")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("evo_worker_1");
    expect(WorkerManager.acquireLease("evo_worker_1", "gym_p35_evo_proj", "job_p35_evo")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_evo_core",
      projectId: "gym_p35_evo_proj",
      name: "Gym Evolution Node",
      projectPath: P35_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 7. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p35_evo_proj",
      projectPath: P35_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Evolution Governance Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Evolution Governance Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P35_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P35_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P35_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P35_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P35_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P35_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P35_PROJ_DIR, "prisma/schema.prisma"),
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
        projectPath: P35_PROJ_DIR,
        projectId: "gym_p35_evo_proj",
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
        projectId: "gym_p35_evo_proj",
        projectPath: P35_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 9. 4-Tier Verification & Outcome Realization
      EvolutionOpportunityRegistry.transitionState(opp.opportunityId, "VERIFYING");

      const verifyReport = EvolutionVerificationEngine.verifyEvolution({
        opportunityId: opp.opportunityId,
        technicalBuildPassed: true,
        architecturalCouplingReduced: true,
        operationalLatencyHealthy: true,
        businessKpiPreserved: true,
      });
      expect(verifyReport.overallPassed).toBe(true);

      const outcomeReport = EvolutionOutcomeEngine.evaluateOutcome(
        opp.opportunityId,
        "gym_p35_evo_proj",
        30,
        32,
        95000,
        105000,
        20000
      );
      expect(outcomeReport.classification).toBe("IMPROVEMENT_REALIZED");
      expect(outcomeReport.realizedRoi).toBe(5.25);

      EvolutionOpportunityRegistry.transitionState(opp.opportunityId, "COMPLETED");

      // 10. Pattern Intelligence, Learning & Immutable Roadmap Publishing
      const pattern = EvolutionPatternEngine.detectPatterns("GymGateway", 0, 0);
      expect(pattern.patternType).toBe("REPEATED_TECHNICAL_DEBT");

      const learning = EvolutionLearningEngine.extractLearning(25);
      expect(learning.safetyPolicyMutationsAttempted).toBe(0);

      const roadmap = ContinuousEvolutionRoadmap.publishVersion([
        { itemId: "item_1", opportunityId: opp.opportunityId, horizon: "NOW", title: "Decouple Gym Gateway Core", targetQuarter: "Q3 2026" },
      ]);
      expect(roadmap.versionId).toBe("roadmap_v1");

      const portfolio = EvolutionPortfolioEngine.calculatePortfolio(10, 9, 8, 1, 0);
      expect(portfolio.evolutionSuccessRatePercentage).toBe(89);

      // 11. Record Evidence Claims & Cryptographic Ledger Entry
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p35_evo_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Evolution Governance Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      EnterpriseEvolutionDecisionLedger.recordEvent({
        actorId: "arch_lead_1",
        organizationId: "org_evo_core",
        projectId: "gym_p35_evo_proj",
        opportunityId: opp.opportunityId,
        eventType: "EVOLUTION_GOVERNANCE_CERTIFIED",
        evidenceSummary: "Enterprise system evolution verified across Technical, Architectural, Operational, and Business layers with 0 safety policy mutations.",
      });

      // 12. Master Enterprise Evolution Governance Gate Certification (All 24 Tiers)
      const evoCert = EnterpriseEvolutionGovernanceGate.evaluate(P35_PROJ_DIR, "org_evo_core");
      expect(evoCert.status).toBe("ENTERPRISE_EVOLUTION_GOVERNANCE_CERTIFIED");
      expect(evoCert.totalCertifiedGates).toBe(24);
      expect(existsSync(join(P35_PROJ_DIR, ".aegis", "enterprise-evolution-governance-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("evo_worker_1", "gym_p35_evo_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
