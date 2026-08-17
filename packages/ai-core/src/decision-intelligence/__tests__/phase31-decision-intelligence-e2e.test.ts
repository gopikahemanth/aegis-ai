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
import { EnterpriseDecisionKnowledgeGraph } from "../enterprise-decision-knowledge-graph.js";
import { DecisionQualityEngine } from "../decision-quality-engine.js";
import { EvidenceProvenanceEngine } from "../evidence-provenance-engine.js";
import { GovernanceDriftEngine } from "../governance-drift-engine.js";
import { DecisionImpactEngine } from "../decision-impact-engine.js";
import { DecisionCounterfactualEngine } from "../decision-counterfactual-engine.js";
import { OrganizationalLearningEngine } from "../organizational-learning-engine.js";
import { ExecutiveDecisionEngine } from "../executive-decision-engine.js";
import { DecisionReviewEngine } from "../decision-review-engine.js";
import { DecisionPortfolioEngine } from "../decision-portfolio-engine.js";
import { GovernanceRiskForecaster } from "../governance-risk-forecaster.js";
import { DecisionIntelligenceLedger } from "../decision-intelligence-ledger.js";
import { EnterpriseDecisionIntelligenceGate } from "../enterprise-decision-intelligence-gate.js";
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

const P31_PROJ_DIR = join(process.cwd(), ".tmp_test_p31_e2e");

describe("AEGIS Phase 31 — Master Enterprise Decision Intelligence & Governance E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P31_PROJ_DIR)) rmSync(P31_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P31_PROJ_DIR, { recursive: true });
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
    EnterpriseDecisionKnowledgeGraph.reset();
    EvidenceProvenanceEngine.reset();
    DecisionReviewEngine.reset();
    DecisionPortfolioEngine.reset();
    DecisionIntelligenceLedger.reset();
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
    EnterpriseDecisionKnowledgeGraph.reset();
    EvidenceProvenanceEngine.reset();
    DecisionReviewEngine.reset();
    DecisionPortfolioEngine.reset();
    DecisionIntelligenceLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P31_PROJ_DIR)) rmSync(P31_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete decision intelligence lifecycle across all 20 governance tiers and issues EnterpriseDecisionIntelligenceCertificate", async () => {
    // 1. Enterprise Setup
    OrganizationManager.createOrganization({
      organizationId: "org_dec_core",
      name: "Enterprise Decision Intelligence Node",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_exec", name: "Executive Engineering Council", memberUserIds: ["cto_lead_1"] }],
      projectIds: ["gym_p31_dec_proj"],
    });

    IdentityManager.registerActor({
      userId: "cto_lead_1",
      name: "Chief Technology Officer",
      organizationId: "org_dec_core",
      role: "PLATFORM_ADMIN",
    });

    // 2. Decision Intelligence: Knowledge Graph, Provenance & Counterfactual Simulation
    EnterpriseDecisionKnowledgeGraph.addNode({
      nodeId: "init_gym_scale",
      nodeType: "INITIATIVE",
      label: "Scale Gym Enterprise Architecture",
      projectId: "gym_p31_dec_proj",
      timestamp: new Date().toISOString(),
      isVerified: true,
    });

    EvidenceProvenanceEngine.recordClaim({
      claimId: "claim_perf_sla",
      source: "ProductionTelemetry",
      evidenceType: "MEASURED",
      timestamp: new Date().toISOString(),
      confidence: 1.0,
      provenance: "Load balancer telemetry 99.99% latency SLA compliant",
      verificationStatus: "VERIFIED",
    });

    const sim = DecisionCounterfactualEngine.simulateWhatIf(
      "Deploy High-Performance Member Engine Now",
      "Defer Deployment by 1 Week",
      15,
      50000,
      -20
    );
    expect(sim.mutationsAttempted).toBe(0);
    expect(sim.classification).toBe("SIMULATED");

    // 3. Executive Recommendation & Decision Review
    const recommendation = ExecutiveDecisionEngine.recommendAction(
      "gym_p31_dec_proj",
      "ACCELERATE",
      "High verified demand with 99.99% SLA headroom. Safe to accelerate release.",
      ["claim_perf_sla"]
    );
    expect(recommendation.action).toBe("ACCELERATE");

    DecisionReviewEngine.proposeDecision("dec_p31_deploy", "gym_p31_dec_proj", "Deploy Gym Generation 1", "cto_lead_1");
    const approvedReview = DecisionReviewEngine.approveDecision("dec_p31_deploy", "cto_lead_1", "sig_auth_p31_cto");
    expect(approvedReview.stage).toBe("APPROVED");

    // 4. Secret Masking & Worker Lease
    SecretProvider.setSecret("DEC_TOKEN", "secure_dec_key_1122");
    expect(SecretProvider.maskSecrets("Bearer secure_dec_key_1122")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("dec_worker_1");
    expect(WorkerManager.acquireLease("dec_worker_1", "gym_p31_dec_proj", "job_p31_dec")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_dec_core",
      projectId: "gym_p31_dec_proj",
      name: "Gym Decision Intelligence Node",
      projectPath: P31_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 5. Generation 1
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p31_dec_proj",
      projectPath: P31_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Decision Intelligence Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Decision Intelligence Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P31_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P31_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P31_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P31_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P31_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P31_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P31_PROJ_DIR, "prisma/schema.prisma"),
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
        projectPath: P31_PROJ_DIR,
        projectId: "gym_p31_dec_proj",
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
        projectId: "gym_p31_dec_proj",
        projectPath: P31_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 7. Decision Quality & Governance Drift Check
      const quality = DecisionQualityEngine.evaluateDecision({
        decisionId: "dec_p31_deploy",
        projectId: "gym_p31_dec_proj",
        predictionAccuracy: 98,
        outcomeAchievement: 100,
        riskEstimationAccuracy: 95,
        costEstimationAccuracy: 92,
        reliabilityImpact: 100,
      });
      expect(quality.classification).toBe("EFFECTIVE");

      const drift = GovernanceDriftEngine.evaluateDrift("org_dec_core", "gym_p31_dec_proj", 0, 0, 0);
      expect(drift.driftClassification).toBe("NO_DRIFT");
      expect(drift.isBlocked).toBe(false);

      // 8. Organizational Learning & Governance Risk Forecast
      const learning = OrganizationalLearningEngine.extractLearning("org_dec_core", 10);
      expect(learning.safetyPolicyMutationsAttempted).toBe(0);

      const govForecast = GovernanceRiskForecaster.forecastRisk("org_dec_core", "AUTHORIZATION_BOTTLENECK", 20, 60);
      expect(govForecast.classification).toBe("FORECAST");

      // 9. Record Evidence Claims & Cryptographic Ledger Entry
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p31_dec_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Decision Intelligence Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      DecisionIntelligenceLedger.recordDecision({
        actorId: "cto_lead_1",
        organizationId: "org_dec_core",
        projectId: "gym_p31_dec_proj",
        operation: "CERTIFY_ENTERPRISE_DECISION_INTELLIGENCE",
        decisionType: "DECISION_INTELLIGENCE_CERTIFIED",
        evidenceSummary: "Decision quality evaluated as EFFECTIVE with zero governance drift across all 20 tiers.",
      });

      // 10. Master Enterprise Decision Intelligence Gate Certification (All 20 Tiers)
      const decCert = EnterpriseDecisionIntelligenceGate.evaluate(P31_PROJ_DIR, "org_dec_core");
      expect(decCert.status).toBe("ENTERPRISE_DECISION_INTELLIGENCE_CERTIFIED");
      expect(decCert.totalCertifiedGates).toBe(20);
      expect(existsSync(join(P31_PROJ_DIR, ".aegis", "enterprise-decision-intelligence-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("dec_worker_1", "gym_p31_dec_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
