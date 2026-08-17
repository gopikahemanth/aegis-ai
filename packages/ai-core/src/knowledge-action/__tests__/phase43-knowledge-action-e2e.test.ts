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
import { CrossDomainKnowledgeGraph } from "../../knowledge-synthesis/cross-domain-knowledge-graph.js";
import { EnterpriseKnowledgeSynthesisEngine } from "../../knowledge-synthesis/enterprise-knowledge-synthesis-engine.js";
import { InsightActionMapper } from "../insight-action-mapper.js";
import { KnowledgeActionPlanner } from "../knowledge-action-planner.js";
import { ActionEligibilityEngine } from "../action-eligibility-engine.js";
import { OrganizationalChangeImpactEngine } from "../organizational-change-impact.js";
import { KnowledgeFreshnessEngine } from "../knowledge-freshness-engine.js";
import { InsightOutcomeEngine } from "../insight-outcome-engine.js";
import { ActionEffectivenessEngine } from "../action-effectiveness-engine.js";
import { ClosedLoopLearningEngine } from "../closed-loop-learning-engine.js";
import { KnowledgeGapEngine } from "../knowledge-gap-engine.js";
import { EnterpriseActionPrioritizer } from "../enterprise-action-prioritizer.js";
import { KnowledgeActionSimulator } from "../knowledge-action-simulator.js";
import { KnowledgeActionDecisionEngine } from "../knowledge-action-decision-engine.js";
import { EnterpriseKnowledgeActionWorkQueue } from "../enterprise-knowledge-action-work-queue.js";
import { KnowledgeActionLedger } from "../knowledge-action-ledger.js";
import { EnterpriseKnowledgeActionGate } from "../enterprise-knowledge-action-gate.js";
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

const P43_PROJ_DIR = join(process.cwd(), ".tmp_test_p43_e2e");

describe("AEGIS Phase 43 — Master Enterprise Knowledge-to-Action & Closed-Loop Learning E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P43_PROJ_DIR)) rmSync(P43_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P43_PROJ_DIR, { recursive: true });
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
    CrossDomainKnowledgeGraph.reset();
    ClosedLoopLearningEngine.reset();
    EnterpriseKnowledgeActionWorkQueue.reset();
    KnowledgeActionLedger.reset();
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
    CrossDomainKnowledgeGraph.reset();
    ClosedLoopLearningEngine.reset();
    EnterpriseKnowledgeActionWorkQueue.reset();
    KnowledgeActionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P43_PROJ_DIR)) rmSync(P43_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete knowledge-to-action closed loop, zero-mutation simulation, outcome measurement, learning calibration, and 32-tier certification", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_action_core",
      name: "Global Enterprise Action Core",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_action", name: "Enterprise Action Guild", memberUserIds: ["vp_eng_action"] }],
      projectIds: ["gym_p43_action_proj"],
    });

    IdentityManager.registerActor({
      userId: "vp_eng_action",
      name: "VP of Enterprise Action & Closed-Loop Learning",
      organizationId: "org_action_core",
      role: "VP_ENGINEERING",
    });

    // 2. Synthesize Evidence (Phase 42)
    const synthesis = EnterpriseKnowledgeSynthesisEngine.synthesize(
      "org_action_core",
      ["Engineering", "Reliability", "Economics"],
      ["ev_pool_sat_log", "ev_p99_metric"],
      [
        {
          statement: "Clustered connection pool sizing reduces P99 latency by 58%",
          classification: "VERIFIED",
          confidence: 0.98,
          evidence: ["ev_pool_sat_log"],
        },
      ]
    );

    // 3. Insight-to-Action Mapping (INSIGHT != ACTION)
    const proposal = InsightActionMapper.mapInsightToAction(
      synthesis.findings[0].findingId,
      "STANDARDIZE",
      "Standardize connection pool size across all fleet nodes",
      "Enforce maximum pool size of 50 in base service template",
      ["ev_pool_sat_log"],
      ["Engineering", "Reliability"],
      ["gym_p43_action_proj"],
      "+50% P99 latency stabilization",
      "MODERATE"
    );
    expect(proposal.authorizationRequirement).toBe("REQUIRES_AUTHORIZATION");

    // 4. Action Planning & Lineage
    const plan = KnowledgeActionPlanner.createPlan(
      synthesis.findings[0].findingId,
      "Fleet-Wide Database Connection Pool Resiliency Plan",
      ["Set Prisma pool limit 50", "Deploy health check probes"],
      ["gym_p43_action_proj"],
      ["Engineering", "Reliability"],
      {
        evidenceIds: ["ev_pool_sat_log"],
        synthesisId: synthesis.synthesisId,
        insightId: synthesis.findings[0].findingId,
        recommendationId: "rec_pool_std_01",
      },
      "MODERATE"
    );
    expect(plan.status).toBe("READY_FOR_REVIEW");

    // 5. Eligibility, Organizational Impact, and Freshness Checks
    const eligibility = ActionEligibilityEngine.evaluateEligibility(plan.planId, "production", 1, 0.96, true, true);
    expect(eligibility.isEligible).toBe(true);

    const impact = OrganizationalChangeImpactEngine.analyzeImpact(["team_infra"], ["gym_p43_action_proj"]);
    expect(impact.scope).toBe("TEAM");

    const freshness = KnowledgeFreshnessEngine.evaluateFreshness(synthesis.findings[0].findingId, 5, false);
    expect(freshness.state).toBe("FRESH");
    expect(freshness.isAuthoritative).toBe(true);

    // 6. Action Prioritization
    const ranked = EnterpriseActionPrioritizer.rankActions([
      { actionId: plan.planId, title: plan.title, business: 85, reliability: 95, security: 80, risk: 10 },
    ]);
    expect(ranked[0].priority).toBe("CRITICAL");

    // 7. Zero-Mutation Action Simulation (SIMULATION != EXECUTION)
    const simulation = KnowledgeActionSimulator.simulateAction(plan.planId, ["gym_p43_action_proj"]);
    expect(simulation.sourceMutations).toBe(0);
    expect(simulation.databaseMutations).toBe(0);
    expect(simulation.deploymentMutations).toBe(0);
    expect(simulation.policyMutations).toBe(0);
    expect(simulation.authorizationMutations).toBe(0);

    // 8. Governed Action Decision Proposal (INTELLIGENCE != AUTHORIZATION)
    const decision = KnowledgeActionDecisionEngine.evaluateDecision(plan.planId, true, false, 0.96, "LOW");
    expect(decision.recommendedDecision).toBe("REQUEST_AUTHORIZATION");

    // 9. Work Queue Enqueue
    const workItem = EnterpriseKnowledgeActionWorkQueue.enqueue({
      actionId: plan.planId,
      sourceInsightId: synthesis.findings[0].findingId,
      title: plan.title,
      priorityScore: 95,
      assignedTeam: "team_infra",
    });
    EnterpriseKnowledgeActionWorkQueue.transitionState(workItem.itemId, "AUTHORIZED");

    // 10. Cryptographic Action Ledger Record
    KnowledgeActionLedger.recordEntry({
      actor: "vp_eng_action",
      tenant: "org_action_core",
      project: "gym_p43_action_proj",
      eventType: "KNOWLEDGE_ACTION_AUTHORIZED",
      actionId: plan.planId,
      evidenceReferences: ["ev_pool_sat_log"],
    });
    expect(KnowledgeActionLedger.verifyIntegrity()).toBe(true);

    // 11. Worker Lease & Project Execution
    SecretProvider.setSecret("ACTION_SECRET", "action_secret_key_8899");
    WorkerManager.heartbeat("action_worker_1");
    expect(WorkerManager.acquireLease("action_worker_1", "gym_p43_action_proj", "job_p43_act")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_action_core",
      projectId: "gym_p43_action_proj",
      name: "Gym Action Node",
      projectPath: P43_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p43_action_proj",
      projectPath: P43_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Knowledge Action Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Knowledge Action Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P43_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P43_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P43_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P43_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P43_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P43_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P43_PROJ_DIR, "prisma/schema.prisma"),
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

      // 12. Release Gate & Staged Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P43_PROJ_DIR,
        projectId: "gym_p43_action_proj",
        generationId: completedG1.generationId,
        productSuccessReport: {
          status: "SUCCESS",
          specificationPassed: true,
          matrixPassed: true,
          goldenWorkflowsPassed: true,
          realityPassed: true,
          summary: "G1 action verified.",
        },
      });

      const deployG1 = await DeploymentOrchestrator.executeDeployment({
        projectId: "gym_p43_action_proj",
        projectPath: P43_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 13. Outcome Measurement & Effectiveness Scoring (ACTION EXECUTED != ACTION EFFECTIVE)
      const outcome = InsightOutcomeEngine.measureOutcome(plan.planId, synthesis.findings[0].findingId, 50, 58, true);
      expect(outcome.realizationStatus).toBe("REALIZED");

      const effectiveness = ActionEffectivenessEngine.evaluateEffectiveness(plan.planId, 3200000, 800000, 25, 30, 0);
      expect(effectiveness.rating).toBe("EFFECTIVE");

      // 14. Closed-Loop Learning Calibration (Zero Policy Mutation)
      const calibration = ClosedLoopLearningEngine.calibrateModel("Engineering", true);
      expect(calibration.safetyPoliciesMutated).toBe(0);
      expect(calibration.authorizationBypassesAttempted).toBe(0);

      // Record Outcome in Cryptographic Ledger
      KnowledgeActionLedger.recordEntry({
        actor: "vp_eng_action",
        tenant: "org_action_core",
        project: "gym_p43_action_proj",
        eventType: "ACTION_OUTCOME_REALIZED",
        actionId: plan.planId,
        evidenceReferences: ["ev_pool_sat_log", "ev_measured_p99_18ms"],
      });

      // 15. Supreme Tier 32 Enterprise Knowledge Action Gate Certification
      const actionCert = EnterpriseKnowledgeActionGate.evaluate(P43_PROJ_DIR, "org_action_core");
      expect(actionCert.status).toBe("ENTERPRISE_KNOWLEDGE_ACTION_CERTIFIED");
      expect(actionCert.totalCertifiedGates).toBe(32);
      expect(existsSync(join(P43_PROJ_DIR, ".aegis", "enterprise-knowledge-action-certificate.json"))).toBe(true);

      // Release Lease
      WorkerManager.releaseLease("action_worker_1", "gym_p43_action_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
