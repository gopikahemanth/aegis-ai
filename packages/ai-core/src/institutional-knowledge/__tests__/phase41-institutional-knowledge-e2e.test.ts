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
import { KnowledgeDiscoveryEngine } from "../knowledge-discovery-engine.js";
import { OrganizationalExperienceEngine } from "../organizational-experience-engine.js";
import { EngineeringPatternEngine } from "../engineering-pattern-engine.js";
import { KnowledgeProvenanceEngine } from "../knowledge-provenance-engine.js";
import { KnowledgeConfidenceEngine } from "../knowledge-confidence-engine.js";
import { KnowledgeRetrievalEngine } from "../knowledge-retrieval-engine.js";
import { IncidentMemoryEngine } from "../incident-memory-engine.js";
import { ArchitectureMemoryEngine } from "../architecture-memory-engine.js";
import { KnowledgeConflictEngine } from "../knowledge-conflict-engine.js";
import { KnowledgeFreshnessEngine } from "../knowledge-freshness-engine.js";
import { OrganizationalLearningEngine } from "../organizational-learning-engine.js";
import { KnowledgeReuseEngine } from "../knowledge-reuse-engine.js";
import { KnowledgePortfolioEngine } from "../knowledge-portfolio-engine.js";
import { KnowledgeGapEngine } from "../knowledge-gap-engine.js";
import { KnowledgeDecisionEngine } from "../knowledge-decision-engine.js";
import { KnowledgeDecisionLedger } from "../knowledge-decision-ledger.js";
import { EnterpriseKnowledgeGate } from "../enterprise-knowledge-gate.js";
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

const P41_PROJ_DIR = join(process.cwd(), ".tmp_test_p41_e2e");

describe("AEGIS Phase 41 — Master Enterprise Institutional Knowledge & Organizational Memory E2E Test", () => {
  beforeEach(() => {
    if (existsSync(P41_PROJ_DIR)) rmSync(P41_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P41_PROJ_DIR, { recursive: true });
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
    KnowledgeRetrievalEngine.reset();
    IncidentMemoryEngine.reset();
    ArchitectureMemoryEngine.reset();
    KnowledgeDecisionLedger.reset();
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
    KnowledgeRetrievalEngine.reset();
    IncidentMemoryEngine.reset();
    ArchitectureMemoryEngine.reset();
    KnowledgeDecisionLedger.reset();
    SecretProvider.clear();
    EvidenceLedger.clear();
    EngineeringLearningEngine.clear();
    if (existsSync(P41_PROJ_DIR)) rmSync(P41_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete institutional memory capture, indexing, zero-mutation retrieval, recommendation, and 30-tier certification", async () => {
    // 1. Enterprise Organization & Actor Setup
    OrganizationManager.createOrganization({
      organizationId: "org_memory_core",
      name: "Global Enterprise Institutional Memory Core",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_arch", name: "Principal Architecture Board", memberUserIds: ["vp_eng_arch"] }],
      projectIds: ["gym_p41_memory_proj"],
    });

    IdentityManager.registerActor({
      userId: "vp_eng_arch",
      name: "VP of Enterprise Architecture",
      organizationId: "org_memory_core",
      role: "VP_ENGINEERING",
    });

    // 2. Institutional Knowledge Discovery (DISCOVERY != KNOWLEDGE)
    const rawPostmortem = "Production incident observed with websocket connection pool timeout saturation and 504 gateway errors.";
    const discoveries = KnowledgeDiscoveryEngine.discoverKnowledge(
      "org_memory_core",
      "INCIDENT_POSTMORTEM",
      "inc_p41_001",
      rawPostmortem
    );
    expect(discoveries.length).toBeGreaterThan(0);
    const chosenDisc = discoveries[0];

    // 3. Organizational Experience Extraction (EXPERIENCE != VERIFIED KNOWLEDGE)
    const exp = OrganizationalExperienceEngine.createExperience(
      "org_memory_core",
      "INCIDENT_POSTMORTEM",
      [chosenDisc.sourceId],
      { concurrency: 150, runtime: "Node.js" },
      ["Connection Pool Saturation", "504 Gateway Latency"],
      "Prisma default connection limit (10) depleted under concurrent client load",
      ["Configured connection_limit=50 in DATABASE_URL", "Set pool_timeout=10s"],
      "P99 latency stabilized at 18ms with 0 timeouts",
      ["ev_pool_sat_log", "ev_p99_metric_18ms", "ev_db_pool_stats"]
    );

    expect(exp.experienceId).toBeDefined();

    // 4. Engineering Pattern Recognition
    const pattern = EngineeringPatternEngine.recognizePattern(
      "PERFORMANCE_BOTTLENECK",
      "Database Connection Pool Saturation Under High Concurrency",
      5,
      ["gym_p41_memory_proj"],
      ["t_arch"],
      exp.evidenceIds
    );
    expect(pattern.status).toBe("HIGH_CONFIDENCE");

    // 5. Knowledge Provenance & Confidence Evaluation (HIGH_CONFIDENCE != AUTHORIZED)
    const prov = KnowledgeProvenanceEngine.buildProvenance(
      exp.experienceId,
      "EXPERIENCE",
      exp.experienceId,
      exp.evidenceIds,
      "vp_eng_arch"
    );
    expect(prov.verificationStatus).toBe("EMPIRICALLY_VALIDATED");

    const conf = KnowledgeConfidenceEngine.evaluateConfidence(
      exp.experienceId,
      exp.evidenceIds.length,
      5,
      true,
      false
    );
    expect(conf.confidenceLevel).toBe("VERIFIED");

    // 6. Architecture Decision Memory (ADR-001 -> ADR-014 Supersession Chain)
    ArchitectureMemoryEngine.recordADR({
      decisionId: "ADR-001",
      organizationId: "org_memory_core",
      projectId: "gym_p41_memory_proj",
      title: "Monolithic Database Pool Sizing",
      context: "Initial single-tenant prototype",
      decision: "Default Prisma pool limit 10",
      tradeoffs: ["Minimal memory overhead", "Cannot scale >20 concurrent clients"],
      author: "init_arch",
      status: "ACTIVE",
      recordedAt: new Date().toISOString(),
    });

    ArchitectureMemoryEngine.recordADR({
      decisionId: "ADR-014",
      organizationId: "org_memory_core",
      projectId: "gym_p41_memory_proj",
      title: "Enterprise Clustered Connection Pool Configuration",
      context: "Scale to >10,000 active sessions",
      decision: "Set connection pool limit to 50 with 10s idle eviction",
      tradeoffs: ["Higher baseline RAM", "Guaranteed sub-20ms P99 latency"],
      author: "vp_eng_arch",
      status: "ACTIVE",
      recordedAt: new Date().toISOString(),
    });

    ArchitectureMemoryEngine.supersedeADR("ADR-001", "ADR-014", "Enterprise scale requirements");

    // 7. Incident Memory Indexing
    IncidentMemoryEngine.recordIncidentMemory({
      incidentId: "inc_mem_p41",
      organizationId: "org_memory_core",
      projectId: "gym_p41_memory_proj",
      symptoms: ["Websocket connection starvation", "504 Gateway Timeout"],
      rootCause: "Database connection pool exhausted",
      successfulResolution: "Configured connection_limit=50 in Prisma schema pool",
      failedApproaches: ["Application retry backoff without pool resizing"],
      recoveryDurationMinutes: 4.2,
      lessonsLearned: ["Always configure database connection limits proportional to concurrency"],
      evidenceIds: exp.evidenceIds,
      recordedAt: new Date().toISOString(),
    });

    // 8. Index Knowledge & Context-Aware Zero-Mutation Retrieval
    KnowledgeRetrievalEngine.indexKnowledge("org_memory_core", {
      knowledgeId: exp.experienceId,
      itemType: "HISTORICAL_FACT",
      title: "Enterprise Connection Pool Optimization",
      content: "Set database connection pool limit to 50 for Express + Prisma websocket workloads to maintain sub-20ms latency.",
      confidence: 0.98,
      relevanceScore: 0.99,
      sourceEvidenceIds: exp.evidenceIds,
    });

    const retrieved = KnowledgeRetrievalEngine.retrieve({
      organizationId: "org_memory_core",
      projectId: "gym_p41_memory_proj",
      environment: "production",
      symptoms: ["saturation", "latency"],
      technologyStack: ["Node", "Express", "Prisma"],
    });

    expect(retrieved.items.length).toBeGreaterThan(0);
    expect(retrieved.sourceMutationsAttempted).toBe(0);
    expect(retrieved.databaseMutationsAttempted).toBe(0);
    expect(retrieved.deploymentMutationsAttempted).toBe(0);

    // 9. Knowledge Conflict Detection & Freshness
    const conflict = KnowledgeConflictEngine.detectConflict(
      exp.experienceId,
      "Connection pool limit 50 resolved latency",
      "k_other",
      "Connection pool limit 50 resolved latency"
    );
    expect(conflict.conflictType).toBe("NO_CONFLICT");

    const freshness = KnowledgeFreshnessEngine.evaluateFreshness(exp.experienceId, 2, false);
    expect(freshness.status).toBe("CURRENT");

    // 10. Organizational Learning Recommendation & Human Decision
    const rec = OrganizationalLearningEngine.generateRecommendation(
      "org_memory_core",
      "Standardize Database Connection Pool Limit to 50 in Production Template",
      "ENGINEERING_STANDARD",
      "Eliminates websocket concurrency starvation incidents based on verified incident inc_p41_001.",
      [exp.experienceId]
    );
    expect(rec.requiresHumanReview).toBe(true);

    const decision = KnowledgeDecisionEngine.formulateAction(true, 0.98, false);
    expect(decision.recommendedAction).toBe("RECOMMEND");

    // 11. Secret Masking & Worker Lease
    SecretProvider.setSecret("MEMORY_SECRET", "memory_secret_key_9988");
    expect(SecretProvider.maskSecrets("Bearer memory_secret_key_9988")).toContain("[REDACTED_SECRET]");

    WorkerManager.heartbeat("memory_worker_1");
    expect(WorkerManager.acquireLease("memory_worker_1", "gym_p41_memory_proj", "job_p41_memory")).toBe(true);

    AegisPlatform.createProject({
      organizationId: "org_memory_core",
      projectId: "gym_p41_memory_proj",
      name: "Gym Memory Node",
      projectPath: P41_PROJ_DIR,
    });

    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 12. Generation 1 Execution
    const jobG1 = AegisPlatform.createGenerationJob({
      projectId: "gym_p41_memory_proj",
      projectPath: P41_PROJ_DIR,
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
        res.end("<html><body><h1>Gym Institutional Memory Master</h1></body></html>");
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
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Institutional Memory Master" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P41_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P41_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P41_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P41_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P41_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P41_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P41_PROJ_DIR, "prisma/schema.prisma"),
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
        projectPath: P41_PROJ_DIR,
        projectId: "gym_p41_memory_proj",
        generationId: completedG1.generationId,
        productSuccessReport: {
          status: "SUCCESS",
          specificationPassed: true,
          matrixPassed: true,
          goldenWorkflowsPassed: true,
          realityPassed: true,
          summary: "G1 memory verified.",
        },
      });

      const deployG1 = await DeploymentOrchestrator.executeDeployment({
        projectId: "gym_p41_memory_proj",
        projectPath: P41_PROJ_DIR,
        environment: "production",
        releaseId: releaseCertG1.releaseId,
        generationId: completedG1.generationId,
        liveServerUrl: baseUrl,
        isAuthorized: true,
      });
      expect(deployG1.status).toBe("COMPLETED");

      // 14. Knowledge Reuse Metrics Calculation
      const reuseMetrics = KnowledgeReuseEngine.calculateReuseMetrics(
        "org_memory_core",
        1,
        1,
        1,
        4.5
      );
      expect(reuseMetrics.reuseRatePct).toBe(100);
      expect(reuseMetrics.estimatedEngineeringHoursSaved).toBe(4.5);

      // 15. Record Claims & Cryptographic Ledger Entries
      EvidenceLedger.recordClaim({
        claimType: "DEPLOYMENT_SUCCESS",
        projectId: "gym_p41_memory_proj",
        evidence: {
          runtimeHealth: "HEALTHY",
          apiChecks: ["POST /api/members (201)", "GET /api/members (200)"],
          browserChecks: ["Rendered Gym Institutional Memory Master cleanly"],
          dbPoolHealth: "HEALTHY (0 timeouts)",
          certificateHashes: [releaseCertG1.releaseId],
        },
        verified: true,
      });

      KnowledgeDecisionLedger.recordEntry({
        actorId: "vp_eng_arch",
        organizationId: "org_memory_core",
        knowledgeId: exp.experienceId,
        action: "KNOWLEDGE_VALIDATED",
        evidenceIds: exp.evidenceIds,
        evidenceSummary: "Connection pool standard validated across 30 tiers.",
      });

      KnowledgeDecisionLedger.recordEntry({
        actorId: "vp_eng_arch",
        organizationId: "org_memory_core",
        knowledgeId: exp.experienceId,
        action: "KNOWLEDGE_REUSED",
        evidenceIds: ["ev_p41_deploy"],
        evidenceSummary: "Reused connection pool runbook in gym management project.",
      });

      // 16. Supreme Tier 30 Enterprise Knowledge Gate Certification
      const knowCert = EnterpriseKnowledgeGate.evaluate(P41_PROJ_DIR, "org_memory_core");
      expect(knowCert.status).toBe("ENTERPRISE_KNOWLEDGE_CERTIFIED");
      expect(knowCert.totalCertifiedGates).toBe(30);
      expect(existsSync(join(P41_PROJ_DIR, ".aegis", "enterprise-knowledge-certificate.json"))).toBe(true);

      // Release Worker Lease
      WorkerManager.releaseLease("memory_worker_1", "gym_p41_memory_proj");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
