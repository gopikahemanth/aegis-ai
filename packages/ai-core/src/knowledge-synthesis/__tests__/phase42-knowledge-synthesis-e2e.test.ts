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
import { CrossDomainKnowledgeGraph } from "../cross-domain-knowledge-graph.js";
import { EnterpriseKnowledgeSynthesisEngine } from "../enterprise-knowledge-synthesis-engine.js";
import { CausalAnalysisEngine } from "../causal-analysis-engine.js";
import { CrossDomainPatternEngine } from "../cross-domain-pattern-engine.js";
import { TradeoffIntelligenceEngine } from "../tradeoff-intelligence-engine.js";
import { SystemicOpportunityEngine } from "../systemic-opportunity-engine.js";
import { SystemicRiskInsightEngine } from "../systemic-risk-insight-engine.js";
import { EvidenceConfidencePropagationEngine } from "../evidence-confidence-propagation.js";
import { KnowledgeReconciliationEngine } from "../knowledge-reconciliation-engine.js";
import { OrganizationalIntelligenceEngine } from "../organizational-intelligence-engine.js";
import { EnterpriseInsightEngine } from "../enterprise-insight-engine.js";
import { InsightValidationEngine } from "../insight-validation-engine.js";
import { AdaptiveIntelligenceEngine } from "../adaptive-intelligence-engine.js";
import { EnterpriseInsightPortfolioEngine } from "../enterprise-insight-portfolio.js";
import { InsightLifecycleEngine } from "../insight-lifecycle-engine.js";
import { CrossDomainScenarioEngine } from "../cross-domain-scenario-engine.js";
import { EnterpriseIntelligenceWorkQueue } from "../enterprise-intelligence-work-queue.js";
import { EnterpriseSynthesisDecisionEngine } from "../enterprise-synthesis-decision-engine.js";
import { EnterpriseSynthesisLedger } from "../enterprise-synthesis-ledger.js";
import { EnterpriseKnowledgeSynthesisGate } from "../enterprise-knowledge-synthesis-gate.js";
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

const P42_PROJ_DIR = join(process.cwd(), ".tmp_test_p42_e2e");

describe("AEGIS Phase 42 — Master Enterprise Knowledge Synthesis & Cross-Domain Intelligence E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P42_PROJ_DIR)) rmSync(P42_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P42_PROJ_DIR, { recursive: true });
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
    InsightLifecycleEngine.reset();
    EnterpriseIntelligenceWorkQueue.reset();
    EnterpriseSynthesisLedger.reset();
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
    InsightLifecycleEngine.reset();
    EnterpriseIntelligenceWorkQueue.reset();
    EnterpriseSynthesisLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P42_PROJ_DIR)) rmSync(P42_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete cross-domain knowledge synthesis, causal reasoning, zero-mutation scenario simulation, and 31-tier certification", async () => {
    // 1. Enterprise Organization & Actor Setup
    OrganizationManager.createOrganization({
      organizationId: "org_synthesis_core",
      name: "Global Enterprise Synthesis Core",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_synth", name: "Enterprise Intelligence Guild", memberUserIds: ["vp_eng_synth"] }],
      projectIds: ["gym_p42_synth_proj"],
    });

    IdentityManager.registerActor({
      userId: "vp_eng_synth",
      name: "VP of Enterprise Systems & Intelligence",
      organizationId: "org_synthesis_core",
      role: "VP_ENGINEERING",
    });

    // 2. Cross-Domain Knowledge Graph Population
    const edge1 = CrossDomainKnowledgeGraph.addEdge({
      sourceId: "ADR-014",
      sourceDomain: "Architecture",
      targetId: "INC-401",
      targetDomain: "Reliability",
      relationshipType: "MITIGATED",
      evidenceIds: ["ev_p99_latency_18ms"],
      confidence: 0.98,
      verificationStatus: "EMPIRICALLY_VERIFIED",
    });
    expect(edge1.edgeId).toBeDefined();

    const edge2 = CrossDomainKnowledgeGraph.addEdge({
      sourceId: "INC-401",
      sourceDomain: "Reliability",
      targetId: "CUST-RETENTION",
      targetDomain: "Customer",
      relationshipType: "INCREASED",
      evidenceIds: ["ev_retention_lift"],
      confidence: 0.95,
      verificationStatus: "EMPIRICALLY_VERIFIED",
    });
    expect(edge2.edgeId).toBeDefined();

    // 3. Causal Relationship Analysis (CORRELATION != CAUSATION)
    const causalReport = CausalAnalysisEngine.analyzeChain("Connection Pool Sizing to Customer Retention", [
      {
        cause: "Clustered Database Pool Limit 50",
        effect: "P99 Latency Stabilized at 18ms",
        experimentVerified: true,
        evidence: ["ev_pool_log", "ev_p99_metric"],
      },
      {
        cause: "P99 Latency 18ms",
        effect: "Customer Retention Increased +4.2%",
        experimentVerified: true,
        evidence: ["ev_retention_data", "ev_p40_trial"],
      },
    ]);
    expect(causalReport.overallConfidence).toBe("VERIFIED");

    // 4. Cross-Domain Pattern Recognition
    const pattern = CrossDomainPatternEngine.detectPattern(
      "Cascading Connection Pool Depletion Under Bursty Traffic",
      ["Engineering", "Reliability", "Economics"],
      ["WebSocket Saturation", "504 Gateway Timeouts"],
      "Database Thread Depletion",
      ["ev_pool_log", "ev_504_log", "ev_cost_metric", "ev_telemetry"]
    );
    expect(pattern.state).toBe("HIGH_CONFIDENCE");

    // 5. Trade-Off Intelligence & Systemic Opportunities/Risks
    const tradeoff = TradeoffIntelligenceEngine.analyzeTradeoff(
      "Reliability Rigor",
      "Infrastructure Cost",
      50,
      ["gym_p42_synth_proj"],
      ["ev_sla_metrics", "ev_cloud_spend"]
    );
    expect(tradeoff.confidence).toBeGreaterThanOrEqual(0.9);

    const opportunity = SystemicOpportunityEngine.discoverSystemicOpportunity(
      "Fleet-Wide Zero-Copy Streaming Standard",
      "ENTERPRISE",
      4200000,
      15,
      ["gym_p42_synth_proj"],
      ["ev_p40_trial"]
    );
    expect(opportunity.scope).toBe("ENTERPRISE");

    const risk = SystemicRiskInsightEngine.evaluateRisk(
      "Unpatched Shared WebSocket Driver",
      4,
      "@aegis/ws-router@0.1.0",
      ["ev_cve_alert", "ev_dependency_audit"]
    );
    expect(risk.severity).toBe("SYSTEMIC_RISK");

    // 6. Enterprise Knowledge Synthesis (INFERRED != VERIFIED)
    const synthesis = EnterpriseKnowledgeSynthesisEngine.synthesize(
      "org_synthesis_core",
      ["Engineering", "Reliability", "Customer", "Economics"],
      ["ev_pool_log", "ev_retention_data"],
      [
        {
          statement: "Clustered connection pool sizing reduces P99 latency by 58%",
          classification: "VERIFIED",
          confidence: 0.98,
          evidence: ["ev_pool_log"],
        },
        {
          statement: "Fleet-wide standardization will yield ₹42,00,000 INR annual efficiency gain",
          classification: "INFERRED",
          confidence: 0.92,
          evidence: ["ev_retention_data"],
        },
      ]
    );
    expect(synthesis.findings.length).toBe(2);

    // 7. Evidence Confidence Propagation (Weak + Weak != Strong)
    const confReport = EvidenceConfidencePropagationEngine.calculateConfidence([
      { evidenceId: "ev_pool_log", sourceType: "CONTROLLED_TRIAL", isEmpiricallyVerified: true, qualityScore: 0.98, isContradicted: false },
      { evidenceId: "ev_retention_data", sourceType: "ANALYTICS", isEmpiricallyVerified: true, qualityScore: 0.94, isContradicted: false },
    ]);
    expect(confReport.isVerified).toBe(true);

    // 8. Knowledge Reconciliation & Organizational Intelligence
    const recon = KnowledgeReconciliationEngine.reconcile(
      "Engineering",
      "Connection pool limit 50 resolved latency",
      "Reliability",
      "Connection pool limit 50 resolved latency"
    );
    expect(recon.conflictType).toBe("CONTEXTUAL_CONFLICT");


    const orgIntel = OrganizationalIntelligenceEngine.evaluateCapabilities("org_synthesis_core", 12);
    expect(orgIntel.overallMaturityLevel).toBe("EXCELLENT");

    // 9. Enterprise Insight Generation, Validation, and Lifecycle
    const insight = EnterpriseInsightEngine.generateInsight(
      "org_synthesis_core",
      "Deployment latency incidents decreased by 58% after connection pool resizing",
      ["ev_pool_log", "ev_retention_data"],
      "ADR-014 directly improves Reliability SLAs and Customer Retention",
      "Saves ~240 engineering recovery hours annually",
      "Standardize connection pool limits in base deployment template"
    );
    expect(insight.authorizationStatus).toBe("NOT_GRANTED");

    const valReport = InsightValidationEngine.validateInsight(insight.insightId, 2, false, true);
    expect(valReport.status).toBe("VERIFIED");

    InsightLifecycleEngine.initializeLifecycle(insight.insightId);
    InsightLifecycleEngine.transitionStage(insight.insightId, "SYNTHESIZING");
    InsightLifecycleEngine.transitionStage(insight.insightId, "VALIDATING");
    const activeStage = InsightLifecycleEngine.transitionStage(insight.insightId, "SUPPORTED");
    expect(activeStage.currentStage).toBe("SUPPORTED");

    // 10. Adaptive Intelligence Recommendation & Zero-Mutation Scenario Simulation
    const rec = AdaptiveIntelligenceEngine.recommendAction(
      insight.insightId,
      "STANDARDIZE",
      "Standardize connection pool limits across all 12 microservices",
      ["gym_p42_synth_proj"]
    );
    expect(rec.requiresHumanReview).toBe(true);

    const scenario = CrossDomainScenarioEngine.simulateScenario(
      "Fleet-Wide Connection Pool Standardization",
      ["gym_p42_synth_proj"]
    );
    expect(scenario.sourceMutationsAttempted).toBe(0);
    expect(scenario.databaseMutationsAttempted).toBe(0);
    expect(scenario.deploymentMutationsAttempted).toBe(0);
    expect(scenario.policyMutationsAttempted).toBe(0);

    const decision = EnterpriseSynthesisDecisionEngine.evaluateDecision(false, false, 0.96);
    expect(decision.recommendedAction).toBe("RECOMMEND");

    // 11. Secret Masking & Worker Lease
    SecretProvider.setSecret("SYNTHESIS_SECRET", "synthesis_secret_key_7766");
    expect(SecretProvider.maskSecrets("Bearer synthesis_secret_key_7766")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("synth_worker_1");
    expect(WorkerManager.acquireLease("synth_worker_1", "gym_p42_synth_proj", "job_p42_synth")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_synthesis_core",
      projectId: "gym_p42_synth_proj",
      name: "Gym Synthesis Node",
      projectPath: P42_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 12. Generation 1 Execution
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p42_synth_proj",
      projectPath: P42_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Knowledge Synthesis Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Knowledge Synthesis Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P42_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P42_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P42_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P42_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P42_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P42_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P42_PROJ_DIR, "prisma/schema.prisma"),
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

      // 13. Production Release & Staged Deployment
      const releaseCertG1 = await ProductionReleaseGate.evaluate({
        projectPath: P42_PROJ_DIR,
        projectId: "gym_p42_synth_proj",
        generationId: completedG1.generationId,
        productSuccessReport: {
          status: "SUCCESS",
          specificationPassed: true,
          matrixPassed: true,
          goldenWorkflowsPassed: true,
          realityPassed: true,
          summary: "G1 synthesis verified.",
        },
      });

      const deployG1 = await DeploymentOrchestrator.executeDeployment({
        projectId: "gym_p42_synth_proj",
        projectPath: P42_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 14. Record Claims & Cryptographic Synthesis Ledger Entries
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p42_synth_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Knowledge Synthesis Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      EnterpriseSynthesisLedger.recordEntry({
        actor: "vp_eng_synth",
        organizationId: "org_synthesis_core",
        operation: "CROSS_DOMAIN_SYNTHESIS_VERIFIED",
        sourceIds: [synthesis.synthesisId, insight.insightId],
        evidenceIds: ["ev_pool_log", "ev_retention_data"],
      });

      // 15. Supreme Tier 31 Enterprise Knowledge Synthesis Gate Certification
      const synthCert = EnterpriseKnowledgeSynthesisGate.evaluate(P42_PROJ_DIR, "org_synthesis_core");
      expect(synthCert.status).toBe("ENTERPRISE_KNOWLEDGE_SYNTHESIS_CERTIFIED");
      expect(synthCert.totalCertifiedGates).toBe(31);
      expect(existsSync(join(P42_PROJ_DIR, ".aegis", "enterprise-knowledge-synthesis-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("synth_worker_1", "gym_p42_synth_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
