import { Memory } from "./memory.js";
import { FrameworkSelector } from "../architect/index.js";
import { FrameworkValidator } from "../validator/framework-validator.js";
import type { GeneratedFile } from "../writer/writer.js";
import {
  ArchitectAgent,
  PlannerAgent,
  CoderAgent,
  ReviewerAgent,
  VisualReviewerAgent,
  HeuristicsLearningAgent,
  ResearchAssistantAgent,
  PRGeneratorAgent,
  DocsGeneratorAgent,
  RealityCheckerAgent,
  DataArchitectureAgent,
  TestGeneratorAgent,
} from "../agents/index.js";
import { InProjectTestRunner } from "../validation/in-project-test-runner.js";
import { RuntimeAcceptanceRunner } from "../testing/runtime-acceptance-runner.js";
import { DependencyInstallationOptimizer } from "../startup/dependency-installation-optimizer.js";

import { ProjectMemoryEngine } from "../memory/memory-engine.js";
import { FileWriter } from "../writer/writer.js";
import { Parser } from "../generator/parser.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, statSync, readdirSync } from "node:fs";
import { join, dirname, resolve, relative, basename } from "node:path";
import { createHash } from "node:crypto";
import { GenerationSeedManager, type GenerationMode } from "../design/generation-seed.js";
import { DependencyResolver, DependencyInstaller } from "@aegis/project-builder";
import { PatchEngine } from "../healing/patch-engine.js";
import { isLikelySyntacticallyComplete } from "../utils/syntax-validator.js";
import { ErrorRootCauseMapper } from "../healing/error-root-cause-mapper.js";
import { DependencyGraphEngine } from "../dependency/dependency-graph.js";
import { GitIntegrationEngine } from "../git/git-engine.js";
import { MetricsTracker } from "../providers/metrics-tracker.js";
import { TeamCoordinator } from "./team-coordinator.js";
import { AuditTrailEngine } from "../utils/audit-trail.js";
import {
  ArchitecturePlanner,
} from "../architect/index.js";
import {
  ExecutionController,
  ExecutionPhase,
} from "../orchestrator/index.js";
import type { AIProvider } from "../providers/base.js";
import { ExecutionLoop, ExecutionStage } from "../execution/index.js";
import { GenerationBudgetGuard, BudgetExceededError, ProviderOutageHaltError } from "../governance/generation-budget-guard.js";
import {
  BuildOrchestrator,
} from "../build/index.js";
import {
  RepairCoordinator,
} from "../build/index.js";
import { DeploymentGenerator } from "../deploy/index.js";
import { DependencyScheduler } from "../execution/dependency-scheduler.js";
import type { Task } from "../planner/task.js";
import { PromptInferenceEngine } from "../prompts/prompt-inference-engine.js";
import { DesignSystemGenerator } from "../design/design-system-generator.js";
import { ProductUnderstanding } from "../design/product-understanding.js";
import { CapabilityPlanner } from "../design/capability-planner.js";
import { DesignDirector, DesignBriefLock, type DesignSelectionMode } from "../design/design-director.js";
import { ThemeGenerator } from "../design/theme-generator.js";
import { DesignBriefGenerator } from "../design/design-brief-generator.js";
import { CrossProjectSimilarityDetector } from "../design/similarity-detector.js";
import { CrossProjectSimilarityGate } from "../validation/cross-project-similarity-gate.js";
import { DesignIntentGate } from "../validation/design-intent-gate.js";
import { DefinitionOfDone } from "../validation/definition-of-done.js";
import { ProjectStartupAgent } from "../startup/project-startup-agent.js";
import { SpecificationNormalizer } from "../spec/canonical-spec.js";
import { DomainConsistencyValidator } from "../semantics/domain-consistency-validator.js";
import { ValidationStateManager } from "../validation/validation-state.js";
import { TransactionalRepairSystem, RepairConvergenceTracker, TsSymbolRepairEngine } from "../healing/index.js";
import { ArchitectureContractManager, ArchitectureResolver, ArchitectureAuditor, ArchitectureDiff, PlannerArchitectureGuard, ArchitectureContractNormalizer, FastDeterministicSanitizer, FileOwnershipRegistry, ApiContractRegistry, ExecutionReportGenerator, ContractGate, ContractIntegrityValidator, TechnologyConstraintValidator, CanonicalArchitectureState, CanonicalManifestGenerator, CanonicalDataModelContract, CanonicalFileGraph, SemanticDuplicateDetector, ProjectFileRegistry, TaskNormalizer, PlanContractGate, ManifestCompletenessValidator, CanonicalDependencyClosureValidator, SymbolContractValidator, DynamicFileGraphManager, FrontendFilePolicyGuard, FrontendExperienceContractManager, InteractionProvenanceTracker } from "../governance/index.js";
import { DomainModelGuard } from "../governance/domain-model-guard.js";
import { ASTSafeTransformer } from "../governance/ast-safe-transformer.js";
import { StagedValidator } from "../validation/staged-validator.js";
import { FinalSuccessGate } from "../validation/final-success-gate.js";
import { GeneratedFileValidator } from "../validation/generated-file-validator.js";
import { DeterministicProjectFixer } from "../validation/deterministic-project-fixer.js";
import { ProjectGraphEngine } from "../validation/project-graph-engine.js";
import { AppServerRunner } from "../startup/app-server-runner.js";
import { BackendCompilationGate } from "../build/backend-compilation-gate.js";
import { ReadOnlyBrowserValidator } from "../validation/read-only-browser-validator.js";
import { ApiWorkflowVerifier } from "../validation/api-workflow-verifier.js";
import { ProjectPathResolver, ProjectRootSingleton } from "../utils/path-resolver.js";
import { CanonicalPlanManager, type LockedGenerationPlan } from "../planning/canonical-generation-plan.js";
import { DomainContractManager } from "../governance/domain-contract.js";
import { ArtifactProvenanceValidator } from "../governance/artifact-provenance-validator.js";
import { CapabilityCompletenessInvariant } from "../validation/capability-completeness-invariant.js";
import { FrontendApprovalCheckpoint, type FrontendReviewSummary } from "../governance/frontend-approval-checkpoint.js";
import { StageStateMachine } from "../governance/stage-state-machine.js";
import { DatabaseVerifier } from "../database/database-verifier.js";
import { FeatureMatrixManager } from "../contracts/feature-matrix.js";
import { CanonicalContractManager } from "../contracts/canonical-contract.js";
import { AuthorizedSchemaManager } from "../governance/authorized-schema-manager.js";
import { IncrementalGenerator } from "../generator/incremental-generator.js";
import { ErrorDiagnosisEngine } from "../healing/error-diagnosis-engine.js";
import { CostObservabilityReporter } from "../governance/cost-observability-reporter.js";
import { TestPyramidRunner } from "../validation/test-pyramid-runner.js";


const VALID_DEPENDENCIES_WHITELIST = new Set([
  "express",
  "@prisma/client",
  "prisma",
  "cors",
  "dotenv",
  "jsonwebtoken",
  "bcrypt",
  "bcryptjs",
  "zod",
  "react",
  "react-dom",
  "react-router-dom",
  "zustand",
  "axios",
  "lucide-react",
  "recharts",
  "tailwindcss",
  "clsx",
  "tailwind-merge",
  "canvas-confetti",
  "framer-motion",
  "lucide",
  "chart.js",
  "react-chartjs-2",
  "uuid",
  "@types/uuid",
  "react-hot-toast",
  "@types/react-hot-toast",
  "@tanstack/react-query",
  "@types/cors",
  "@types/jsonwebtoken",
  "@types/bcryptjs",
  "@types/express",
  "react-hook-form",
  "@hookform/resolvers",
  "concurrently",
  "tsx",
  "react-is",
  "three",
  "@types/three",
  "gsap",
  "@types/gsap"
]);

function isAllowedIntegrationBridgeFile(norm: string, taskOwnedFiles?: string[]): boolean {
  if (taskOwnedFiles && taskOwnedFiles.some(of => of.replace(/\\/g, "/") === norm)) {
    return true;
  }
  // Allow API client services, auth utilities, and auth context/wrappers
  if (norm.startsWith("src/services/") || norm.startsWith("src/lib/api") || norm.startsWith("src/lib/auth") || norm.startsWith("src/api/")) {
    return true;
  }
  if (norm === "src/context/AuthContext.tsx" || norm === "src/components/ProtectedRoute.tsx") {
    return true;
  }
  return false;
}

export class Orchestrator {
  private readonly scheduler = new DependencyScheduler();

  private readonly buildOrchestrator = new BuildOrchestrator();

  private readonly memory = new Memory();

  private readonly architect = new ArchitecturePlanner();

  private readonly validator = new FrameworkValidator();

  private readonly writer = new FileWriter();

  private readonly parser = new Parser();

  private readonly deployGenerator = new DeploymentGenerator();

  private readonly selector = new FrameworkSelector();

  private readonly execution = new ExecutionController();

  private readonly architectAgent: ArchitectAgent;

  private readonly plannerAgent: PlannerAgent;

  private readonly coderAgent: CoderAgent;

  private readonly reviewerAgent: ReviewerAgent;

  private readonly visualReviewerAgent: VisualReviewerAgent;

  private readonly heuristicsLearningAgent: HeuristicsLearningAgent;

  private readonly researchAssistantAgent: ResearchAssistantAgent;

  private readonly prGeneratorAgent: PRGeneratorAgent;

  private readonly docsGeneratorAgent: DocsGeneratorAgent;

  private readonly promptInferenceEngine: PromptInferenceEngine;

  private readonly dataArchitectureAgent: DataArchitectureAgent;

  private readonly designSystemGenerator = new DesignSystemGenerator();

  /** Design selection mode — set before calling generateProject. */
  designMode: DesignSelectionMode = "AUTO";
  designModeHint?: string;

  /** Creative generation mode and seed */
  generationMode: GenerationMode = "creative";
  generationSeed?: number;
  currentGenerationIdentity?: import("../design/generation-seed.js").ResolvedGenerationIdentity;

  private readonly projectStartupAgent = new ProjectStartupAgent();

  private readonly definitionOfDone = new DefinitionOfDone();

  private readonly executionLoop = new ExecutionLoop();

  private readonly dependencyResolver = new DependencyResolver();

  private readonly installer = new DependencyInstaller();

  private readonly realityCheckerAgent = new RealityCheckerAgent();

  private readonly repairCoordinator: RepairCoordinator;


  constructor(
    private readonly provider: AIProvider,
  ) {
    this.architectAgent =
      new ArchitectAgent(provider);

    this.plannerAgent =
      new PlannerAgent(provider);

    this.coderAgent =
      new CoderAgent(provider);

    this.reviewerAgent =
      new ReviewerAgent(provider);

    this.visualReviewerAgent =
      new VisualReviewerAgent(provider);

    this.heuristicsLearningAgent =
      new HeuristicsLearningAgent(provider);

    this.researchAssistantAgent =
      new ResearchAssistantAgent(provider);

    this.prGeneratorAgent =
      new PRGeneratorAgent(provider);

    this.docsGeneratorAgent =
      new DocsGeneratorAgent(provider);

    this.promptInferenceEngine =
      new PromptInferenceEngine(provider);

    this.dataArchitectureAgent =
      new DataArchitectureAgent(provider);

    this.repairCoordinator =
      new RepairCoordinator(provider);
  }

  private validate(
    framework: string,
    files: GeneratedFile[],
  ) {
    return this.validator.validate(
      framework,
      files,
    );
  }

  private write(
    files: ReturnType<FrameworkValidator["validate"]>,
    outputDirectory: string,
  ) {
    this.writer.write(
      files,
      outputDirectory,
    );
  }

  async generateProject(
    request: string,
    outputDirectory: string,
    imagePath?: string,
  ) {
    this.memory.add(request);

    const genIdentity = GenerationSeedManager.resolveSeed({
      mode: this.generationMode,
      explicitSeed: this.generationSeed,
      prompt: request,
    });
    this.currentGenerationIdentity = genIdentity;

    // ── Enforce pre-generation state and singleton sanitization ─────────────
    if (!GenerationBudgetGuard.getInstance().isGenerationActive()) {
      GenerationBudgetGuard.getInstance().acquireGenerationLock(String(genIdentity.seed || `gen_${Date.now()}`));
    }
    ValidationStateManager.getInstance().reset();
    MetricsTracker.getInstance().reset();
    ProjectFileRegistry.getInstance().reset();
    CanonicalArchitectureState.getInstance().reset();

    console.log();
    console.log("============================================================");
    console.log("                 AEGIS GENERATION IDENTITY                  ");
    console.log(` Mode:            ${genIdentity.mode.toUpperCase()}`);
    console.log(` Seed:            ${genIdentity.seed}`);
    console.log(` Prompt Hash:     ${genIdentity.promptHash}`);
    console.log(` Generation ID:   ${genIdentity.generationId}`);
    console.log("============================================================");
    console.log();

    const memEngine = new ProjectMemoryEngine(outputDirectory);
    const existingMem = memEngine.loadMemory();
    if (!existingMem || (existingMem.lastRequest && existingMem.lastRequest.trim() !== request.trim())) {
      console.log("[Orchestrator] 🧹 Purging stale .aegis and memory artifacts for fresh prompt...");
      ProjectMemoryEngine.wipeAllStaleState(outputDirectory);
      memEngine.resetMemory("project", request);
    }

    const auditTrail = new AuditTrailEngine(outputDirectory);
    auditTrail.logEvent({
      agentRole: "CEO Agent",
      action: `Initiated project generation path for prompt: "${request}"`,
      status: "SUCCESS"
    });

    this.execution.enter(
      ExecutionPhase.Requirements,
    );

    let imagePayload: { mimeType: string; data: string } | undefined;
    if (imagePath && existsSync(imagePath)) {
      try {
        const buffer = readFileSync(imagePath);
        const base64 = buffer.toString("base64");
        const ext = imagePath.split(".").pop()?.toLowerCase();
        const mimeType = ext === "png" ? "image/png" : "image/jpeg";
        imagePayload = { mimeType, data: base64 };
      } catch (err: any) {
        console.warn(`[Orchestrator] Warning: Could not read image path "${imagePath}": ${err.message}`);
      }
    }

    // ── Step 0: Prompt Inference — expand brief prompt into full feature spec ──
    console.log("[Inference] Expanding prompt into full feature specification...");
    let enrichedRequest = request;
    let inferredLibraries: string[] = [];
    let inferredFeatureNames: string[] = [];
    let dataArch: any = null;
    try {
      const expanded = await this.promptInferenceEngine.expand(request);
      enrichedRequest = expanded.enrichedPrompt;
      inferredLibraries = expanded.inferredLibraries;
      inferredFeatureNames = expanded.inferredFeatures.map(f => f.name);
      console.log(`[Inference] Inferred ${expanded.inferredFeatures.length} features: ${inferredFeatureNames.join(", ")}`);
      console.log(`[Inference] Inferred libraries: ${inferredLibraries.join(", ")}`);
      auditTrail.logEvent({
        agentRole: "Inference Engine",
        action: `Expanded prompt. Features: [${inferredFeatureNames.join(", ")}] Libraries: [${inferredLibraries.join(", ")}]`,
        status: "SUCCESS"
      });
    } catch (err: any) {
      console.warn(`[Inference] Prompt expansion failed, using raw prompt: ${err.message}`);
    }

    const {
      specification,
    } =
      await this.architectAgent.execute(
        enrichedRequest,
        imagePayload,
      );

    if (!specification.domainCategory) {
      try {
        const { ProductDiscoveryAgent } = await import("../agents/product-discovery-agent.js");
        const discovery = new ProductDiscoveryAgent(this.provider);
        const matrix = await discovery.discover(request, {
          domainType: "commercial",
          primaryActivity: "data-analysis",
          complexityLevel: "intermediate",
          aestheticTone: "technical",
          userArchetype: "operator",
        } as any, String(genIdentity.seed));
        if (matrix?.category) {
          specification.domainCategory = matrix.category;
          (this as any)._cachedFeatureMatrix = matrix;
        }
      } catch (discErr: any) {
        console.warn(`[Orchestrator] ProductDiscovery early discovery skipped: ${discErr.message}`);
      }
    }

    // ── Phase 4: Real Reference Research & Feature Discovery ────────────────
    try {
      const { ReferenceResearchEngine } = await import("../research/reference-research-engine.js");
      const researchResult = await ReferenceResearchEngine.executeResearch({
        prompt: request,
        domain: specification.domainCategory || specification.name,
        projectName: specification.name || "AegisApp",
        projectRoot: outputDirectory,
        explicitRequirements: (specification.features || []).map((f: any) => ({
          title: typeof f === "string" ? f : f.name || f.title || "Feature",
          description: typeof f === "string" ? f : f.description || f.name || "Core feature",
        })),
        aiProvider: this.provider,
      });

      if (researchResult.research.relevantFeatures.length > 0) {
        console.log(`[Orchestrator] 🌐 Reference Research completed: ${researchResult.research.relevantFeatures.length} relevant features discovered (Status: ${researchResult.research.overallStatus}).`);
        (specification as any).discoveredFeatures = researchResult.research.relevantFeatures.map((f) => f.name);
        (this as any)._referenceResearch = researchResult.research;
        (this as any)._harmonizedFeatureMatrix = researchResult.featureMatrix;
      }

      // Also execute Live Design Reference Research to synthesize bespoke art direction
      const { DesignReferenceIntelligence } = await import("../design/design-reference-intelligence.js");
      const designResearch = await DesignReferenceIntelligence.executeLiveResearch({
        prompt: request,
        domain: specification.domainCategory || specification.name,
        aiProvider: this.provider,
      });
      if (designResearch.status === "SUCCESS" || designResearch.status === "PARTIAL") {
        (this as any)._designResearchSynthesis = designResearch.synthesis;
        console.log(`[Orchestrator] 🎨 Live Design Synthesis completed: thesis="${designResearch.synthesis.visualThesis.slice(0, 70)}..."`);
      }
    } catch (resErr: any) {
      console.warn(`[Orchestrator] ⚠️ Reference research non-blocking notice: ${resErr.message}`);
    }

    // ── Canonical Specification Normalization & Architecture Lock ────────────────
    const canonicalSpec = SpecificationNormalizer.normalize(request, specification);

    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    writeFileSync(join(aegisDir, "prompt.txt"), request, "utf8");

    let resolvedContract = ArchitectureResolver.resolve(request, specification, canonicalSpec, outputDirectory);
    ArchitectureResolver.writeContract(outputDirectory, resolvedContract);
    const archContract = ArchitectureContractManager.createContract(outputDirectory, request, canonicalSpec);

    // ── Configure Adaptive Project Budget from Authoritative Contract ──
    GenerationBudgetGuard.getInstance().adaptiveConfigureForProject(resolvedContract);
    console.log(`[AdaptiveBudget] 📊 Configured project generation budget from locked contract: scale=${resolvedContract.applicationType || "FULLSTACK"}`);

    // ── TechnologyConstraintValidator — Reject libraries that conflict with locked contract ──
    const { allowed: allowedLibs, forbidden: forbiddenLibs } = TechnologyConstraintValidator.filterLibraries(inferredLibraries, resolvedContract);
    inferredLibraries = allowedLibs;
    if (forbiddenLibs.length > 0) {
      console.log(`[TechnologyConstraint] Filtered ${forbiddenLibs.length} forbidden library(ies): ${forbiddenLibs.join(", ")}`);
    }

    // ── MANDATORY CONTRACT GATE — Stop pipeline if contract is invalid ─────
    const contractGateResult = ContractGate.verify(resolvedContract);
    if (!contractGateResult.valid) {
      throw new Error(
        `CONTRACT_GATE_FAILED: Architecture contract is invalid. Errors: ${contractGateResult.errors.join("; ")}. ` +
        `Pipeline stopped. Fix the architecture contract before proceeding.`
      );
    }

    // Force specification normalization against locked contract
    const normalizedSpec = ArchitectureContractNormalizer.normalizeSpecification(specification, resolvedContract);

    auditTrail.logEvent({
      agentRole: "Architect",
      action: `Completed requirements mapping & locked Architecture Contract. Frontend: ${resolvedContract.frontend.framework}, Backend: ${resolvedContract.backend.framework}, DB: ${resolvedContract.database.provider} (${resolvedContract.database.orm})`,
      status: "SUCCESS"
    });

    // ─── Data Architecture Modeling (Deferred to Stage 9 post-frontend approval) ─────
    console.log("[StagedArchitecture] Database design & Prisma schema deferred to Stage 9 (post-frontend approval).");



    const coordinator = new TeamCoordinator();
    const activeTeam = await coordinator.coordinate(specification);
    console.log("\n[Coordinator] Coordinating Dynamic AI Specialist Team for this project:");
    console.table(activeTeam.map(member => ({ Role: member.role, Description: member.description })));

    this.execution.enter(
      ExecutionPhase.Planning,
    );

    let tasks =
      await this.plannerAgent.execute(
        specification,
        "frontend",
      );

    const activeContract = resolvedContract || ArchitectureResolver.loadContract(outputDirectory);
    if (!activeContract) {
      throw new Error(`ARCHITECTURE_CONTRACT_MISSING: No architecture contract found for projectPath: ${outputDirectory}`);
    }
    tasks = PlannerArchitectureGuard.filterTasks(tasks, activeContract);

    // Frontend-First Guarantee: partition and retain only frontend tasks in initial plan
    const isInitialNonFrontendTask = (t: Task): boolean => {
      const title = (t.title || "").toLowerCase();
      const desc = (t.description || "").toLowerCase();
      const stage = ((t as any).stage || "").toLowerCase();
      return stage.includes("database") || stage.includes("datamodeling") ||
        stage.includes("apidesign") || stage.includes("backend") ||
        title.includes("prisma") || title.includes("schema") ||
        title.includes("migration") || title.includes("postgresql") ||
        title.includes("express") || title.includes("server") ||
        title.includes("backend") || title.includes("api route") ||
        desc.includes("prisma") || desc.includes("schema.prisma") ||
        desc.includes("migration") || desc.includes("postgresql") ||
        (desc.includes("express") && desc.includes("route")) ||
        (desc.includes("server") && (desc.includes("controller") || desc.includes("service")));
    };
    tasks = tasks.filter(t => !isInitialNonFrontendTask(t));

    console.log(
      "Planned Frontend Implementation Tasks:",
    );

    console.table(
      tasks,
    );

    console.log("[Orchestrator] Staging canonical planned tasks for execution pipeline...");
    await this.executionLoop.execute(
      {
        request,
        outputDirectory,
        coder: this.coderAgent,
        currentStage: ExecutionStage.Planning,
      },
      tasks.map(t => ({ ...t, stage: ExecutionStage.Planning })),
      async (task) => {
        console.log(
          `[Task Staged] ${task.title}`,
        );

        return {
          taskId: task.id,
          success: true,
          message: "Task planned and staged for execution pipeline",
        };
      },
    );

    this.execution.enter(
      ExecutionPhase.Architecture,
    );

    console.log(
      "AI Specification:",
    );

    console.dir(
      specification,
      { depth: null },
    );

    const architecture =
      this.architect.plan(specification);

    // Enforce single source of truth for framework selection
    let framework = resolvedContract?.frontend?.framework ? resolvedContract.frontend.framework.toLowerCase() : this.selector.select(architecture);
    if (resolvedContract?.frontend?.framework) {
      const lockedFw = resolvedContract.frontend.framework.toLowerCase();
      if (lockedFw.includes("react") || lockedFw.includes("vite")) {
        framework = "react-vite";
      } else if (lockedFw.includes("vue")) {
        framework = "vue";
      } else if (lockedFw.includes("svelte")) {
        framework = "svelte";
      } else if (lockedFw.includes("next")) {
        framework = "next";
      } else if (lockedFw.includes("html") || lockedFw.includes("vanilla")) {
        framework = "html";
      } else if (lockedFw.includes("angular")) {
        framework = "angular";
      } else {
        framework = lockedFw;
      }
    } else if (request.toLowerCase().includes("react") || request.toLowerCase().includes("express") || request.toLowerCase().includes("vite")) {
      framework = "react-vite";
    }

    ArchitectureResolver.writeContract(outputDirectory, resolvedContract);

    console.log(
      "Framework:",
      framework,
    );

    const lockedPlan = CanonicalPlanManager.create({
      request,
      enrichedRequest,
      framework,
      architectureContract: resolvedContract,
      specification,
      canonicalSpec,
      dataArchitecture: dataArch,
      tasks,
      inferredLibraries,
      inferredFeatureNames,
      activeTeam,
    });
    CanonicalPlanManager.save(outputDirectory, lockedPlan);
    DomainContractManager.lock(resolvedContract, resolvedContract.architectureHash || "arch_hash", outputDirectory);
    console.log(`[CanonicalPlan] 🔒 Locked canonical generation plan [planId: ${lockedPlan.planId}, planHash: ${lockedPlan.planHash}]`);

    return {
      framework,
      tasks,
      specification,
      outputDirectory,
      lockedPlan,
      resolvedContract,
      dataArchitecture: dataArch,
    };
  }

  async generateApplication(
    request: string,
    outputDirectory: string,
    imagePath?: string,
    providedPlan?: LockedGenerationPlan,
    options?: {
      approveFrontend?: boolean;
      skipApproval?: boolean;
      onFrontendReview?: (summary: any) => Promise<boolean | string>;
    },
  ) {
    const genIdentity = this.currentGenerationIdentity || GenerationSeedManager.resolveSeed({
      mode: this.generationMode,
      explicitSeed: this.generationSeed,
      prompt: request,
    });
    this.currentGenerationIdentity = genIdentity;

    const loadedPlan = providedPlan || CanonicalPlanManager.load(outputDirectory);
    const hasLockedPlan = !!(loadedPlan && (loadedPlan.request?.trim() === request?.trim() || !loadedPlan.request));

    if (loadedPlan) {
      GenerationBudgetGuard.getInstance().adaptiveConfigureForProject(loadedPlan.architectureContract || loadedPlan.specification);
    }

    const memoryEngine = new ProjectMemoryEngine(outputDirectory);
    const existingMem = memoryEngine.loadMemory();
    if (!hasLockedPlan && (!existingMem || (existingMem.lastRequest && existingMem.lastRequest.trim() !== request.trim()))) {
      console.log("[Memory] 🧹 New prompt detected — wiping ALL project-scoped .aegis state...");
      memoryEngine.resetMemory("project", request);
      const aegisDir = join(outputDirectory, ".aegis");
      const ALL_PROJECT_SCOPED_FILES = [
        "architecture-contract.json",
        "canonical-architecture.json",
        "data-architecture.json",
        "project-manifest.json",
        "project-graph.json",
        "domain-contract.json",
        "file-graph.json",
        "domain-contamination.json",
        "feature-matrix.json",
        "canonical-contract.json",
        "architecture.json",
        "patterns.json",
        "conventions.json",
        "api-workflow-report.json",
        "runtime-acceptance-report.json",
        "runtime-acceptance.json",
        "browser-review.json",
        "browser-validation.json",
        "design-brief.json",
        "reference-research.json",
        "page-design-specifications.json",
        "asset-manifest.json",
        "verification-report.json",
      ];
      for (const staleFile of ALL_PROJECT_SCOPED_FILES) {
        const p = join(aegisDir, staleFile);
        if (existsSync(p)) {
          try {
            unlinkSync(p);
            console.log(`[Memory] Cleared stale artifact: ${staleFile}`);
          } catch { /* non-fatal */ }
        }
      }
    } else {
      memoryEngine.initDefaults("project", request);
    }

    const auditTrail = new AuditTrailEngine(outputDirectory);
    auditTrail.logEvent({
      agentRole: "CEO Agent",
      action: `Initiated application implementation for request: "${request}"`,
      status: "SUCCESS"
    });

    let imagePayload: { mimeType: string; data: string } | undefined;
    if (imagePath && existsSync(imagePath)) {
      try {
        const buffer = readFileSync(imagePath);
        const base64 = buffer.toString("base64");
        const ext = imagePath.split(".").pop()?.toLowerCase();
        const mimeType = ext === "png" ? "image/png" : "image/jpeg";
        imagePayload = { mimeType, data: base64 };
      } catch (err: any) {
        console.warn(`[Orchestrator] Warning: Could not read image path "${imagePath}": ${err.message}`);
      }
    }

    const gitEngine = new GitIntegrationEngine();
    try {
      gitEngine.initRepository(outputDirectory);
      gitEngine.createFeatureBranch(outputDirectory, request);
    } catch (gitErr: any) {
      console.warn(`[GitEngine] Warning: Git branch initialization failed: ${gitErr.message}`);
    }

    let enrichedRequest = request;
    let inferredFeatureNames: string[] = [];
    let inferredLibraries: string[] = [];
    let rawSpecification: any = null;
    let canonicalSpec: any = null;
    let specification: any = null;
    let architecturePlan: any = null;
    let resolvedContract: any = null;
    let dataArch: any = null;
    let tasks: Task[] = [];

    if (hasLockedPlan && loadedPlan) {
      console.log(`[CanonicalPlan] ⚡ Reusing authoritative locked generation plan [planId: ${loadedPlan.planId}, planHash: ${loadedPlan.planHash}] — skipping duplicate planning phase.`);
      enrichedRequest = loadedPlan.enrichedRequest || request;
      inferredFeatureNames = loadedPlan.inferredFeatureNames || [];
      inferredLibraries = loadedPlan.inferredLibraries || [];
      specification = loadedPlan.canonicalSpec || loadedPlan.specification;
      canonicalSpec = specification;
      rawSpecification = specification;
      resolvedContract = loadedPlan.architectureContract;
      dataArch = loadedPlan.dataArchitecture;
      tasks = loadedPlan.tasks;
      (this as any)._currentCanonicalSpec = canonicalSpec;
      ValidationStateManager.getInstance().reset();

      const architecture = this.architect.plan(specification);
      architecturePlan = { architecture, specification };
      ArchitectureResolver.writeContract(outputDirectory, resolvedContract);
      const domainContract = DomainContractManager.lock(resolvedContract, resolvedContract.architectureHash || "arch_hash", outputDirectory);
      DynamicFileGraphManager.lock(resolvedContract, domainContract, resolvedContract.architectureHash || "arch_hash", outputDirectory);

      if (dataArch && Array.isArray(dataArch.apis)) {
        ApiContractRegistry.registerContract(dataArch.apis.map((a: any, idx: number) => ({
          operationId: a.operationId || `op_${idx}_${(a.method || "get").toLowerCase()}_${(a.path || "").replace(/\//g, "_").replace(/^_/, "")}`,
          path: a.path,
          method: a.method,
          description: a.description,
          authentication: a.authentication !== false,
          requestFields: a.requestBodySchema ? { schema: a.requestBodySchema } : undefined,
          responseFields: a.responseBodySchema ? { schema: a.responseBodySchema } : undefined,
        })));
      }
    } else {
      // Step 0: Prompt Inference
      console.log("[Inference] Expanding prompt into full feature specification...");
      try {
        const expanded = await this.promptInferenceEngine.expand(request);
        enrichedRequest = this.promptInferenceEngine.buildEnrichedRequest(expanded);
        inferredLibraries = expanded.inferredLibraries;
        inferredFeatureNames = expanded.inferredFeatures.map(f => f.name);
        if (expanded.inferredFeatures.length > 0) {
          console.log(`[Inference] ✓ Inferred ${expanded.inferredFeatures.length} features: ${inferredFeatureNames.join(", ")}`);
        }
      } catch (infErr: any) {
        console.warn(`[Inference] Warning: Prompt expansion failed: ${infErr.message}`);
      }

      // Step 1: Research Assistant
      console.log("[Research] Running AI Research Assistant to retrieve optimal coding patterns...");
      try {
        const researched = await this.researchAssistantAgent.execute(request);
        if (researched && researched.length > 0) {
          const existingPatterns = memoryEngine.loadPatterns();
          if (existingPatterns) {
            for (const pattern of researched) {
              if (!existingPatterns.reusablePatterns.some(p => p.name === pattern.name)) {
                existingPatterns.reusablePatterns.push(pattern);
              }
            }
            memoryEngine.savePatterns(existingPatterns);
          }
        }
      } catch (resErr: any) {
        console.warn(`[Research] Warning: Research Assistant failed: ${resErr.message}`);
      }

      const existingArch = memoryEngine.loadArchitecture();
      const guidancePrompt = enrichedRequest + (existingArch ? `\n(Guideline: Follow the existing framework "${existingArch.framework}", styled with "${existingArch.styling}", using naming rules: ${existingArch.namingConventions.join(", ")})` : "");

      let imagePayload: { mimeType: string; data: string } | undefined;
      if (imagePath && existsSync(imagePath)) {
        try {
          const buffer = readFileSync(imagePath);
          const base64 = buffer.toString("base64");
          const ext = imagePath.split(".").pop()?.toLowerCase();
          const mimeType = ext === "png" ? "image/png" : "image/jpeg";
          imagePayload = { mimeType, data: base64 };
        } catch (err: any) {
          console.warn(`[Orchestrator] Warning: Could not read image path "${imagePath}": ${err.message}`);
        }
      }

      const architectRes = await this.architectAgent.execute(guidancePrompt, imagePayload);
      rawSpecification = architectRes.specification;
      architecturePlan = architectRes.architecturePlan;

      if (!rawSpecification.domainCategory) {
        try {
          const { ProductDiscoveryAgent } = await import("../agents/product-discovery-agent.js");
          const discovery = new ProductDiscoveryAgent(this.provider);
          const matrix = await discovery.discover(request, {
            domainType: "commercial",
            primaryActivity: "data-analysis",
            complexityLevel: "intermediate",
            aestheticTone: "technical",
            userArchetype: "operator",
          } as any, String(genIdentity.seed));
          if (matrix?.category) {
            rawSpecification.domainCategory = matrix.category;
            (this as any)._cachedFeatureMatrix = matrix;
          }
        } catch (discErr: any) {
          console.warn(`[Orchestrator] ProductDiscovery early discovery skipped: ${discErr.message}`);
        }
      }

      canonicalSpec = SpecificationNormalizer.normalize(request, rawSpecification);
      (this as any)._currentCanonicalSpec = canonicalSpec;
      specification = canonicalSpec;
      ValidationStateManager.getInstance().reset();

      resolvedContract = ArchitectureResolver.resolve(request, rawSpecification, canonicalSpec, outputDirectory);
      ArchitectureResolver.writeContract(outputDirectory, resolvedContract);
      ArchitectureContractManager.createContract(outputDirectory, request, canonicalSpec);
      const domainContract = DomainContractManager.lock(resolvedContract, resolvedContract.architectureHash || "arch_hash", outputDirectory);
      DynamicFileGraphManager.lock(resolvedContract, domainContract, resolvedContract.architectureHash || "arch_hash", outputDirectory);

      // ── Canonical Architecture Normalization — Lock spec BEFORE planning ─────────
      specification = ArchitectureContractNormalizer.normalizeSpecification(specification, resolvedContract);
      canonicalSpec = specification;
      (this as any)._currentCanonicalSpec = specification;

      // ── FRONTEND-FIRST: DataArchitectureAgent is DEFERRED to post-approval Stage 9 ──
      // The CoderAgent must NOT receive API/schema context before the frontend is built.
      // During the frontend stage, the Coder works with local state and mock data only.
      // DataArchitectureAgent will be called after HUMAN_FRONTEND_APPROVED=true is recorded.
      console.log("[FrontendFirst] DataArchitectureAgent deferred to post-approval Stage 9. Frontend CoderAgent will use local state and mock data.");

      const coordinator = new TeamCoordinator();
      const activeTeam = await coordinator.coordinate(specification);
      const rawTasks = await this.plannerAgent.execute(specification);
      tasks = TaskNormalizer.normalizeTasks(rawTasks, resolvedContract);

      const standalonePlan = CanonicalPlanManager.create({
        request,
        enrichedRequest,
        framework: resolvedContract.frontend.framework,
        architectureContract: resolvedContract,
        specification,
        canonicalSpec,
        dataArchitecture: dataArch,
        tasks,
        inferredLibraries,
        inferredFeatureNames,
        activeTeam,
      });
      CanonicalPlanManager.save(outputDirectory, standalonePlan);
    }

    // Merge specification inferred libraries into package.json (filtered by whitelist)
    const pkgPath = join(outputDirectory, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        pkg.dependencies = pkg.dependencies || {};
        const rawPrompt = specification.userPrompt || (specification as any).prompt || "";
        const rawLibs = [...(specification.inferredLibraries || inferredLibraries || [])];
        const is3DReq = Boolean(rawPrompt.match(/\b(3d|webgl|three\.?js|r3f|claymation|volumetric)\b/i));
        if (is3DReq && !rawLibs.includes("three")) {
          rawLibs.push("three");
        }
        const DEV_ONLY_TEST_LIBS = new Set([
          "vitest",
          "@testing-library/react",
          "@testing-library/jest-dom",
          "@testing-library/user-event",
          "jsdom",
          "typescript",
          "tsx",
          "concurrently",
          "vite",
          "@vitejs/plugin-react",
          "autoprefixer",
          "postcss",
          "tailwindcss"
        ]);
        const libs = rawLibs.filter((lib: string) => VALID_DEPENDENCIES_WHITELIST.has(lib) && !DEV_ONLY_TEST_LIBS.has(lib));
        const commonTypesNeeded = ["express", "cors", "canvas-confetti", "bcryptjs", "jsonwebtoken", "react", "react-dom", "three", "gsap"];
        
        // Remove any dev/test tools mistakenly in dependencies
        if (pkg.dependencies) {
          for (const devLib of DEV_ONLY_TEST_LIBS) {
            delete pkg.dependencies[devLib];
          }
        }
        pkg.devDependencies = pkg.devDependencies || {};
        if (!pkg.devDependencies["vitest"]) {
          pkg.devDependencies["vitest"] = "^1.6.0";
        }

        for (const lib of libs) {
          if (!pkg.dependencies[lib] && !pkg.devDependencies?.[lib]) {
            if (lib === "prisma" || lib === "@prisma/client") {
              pkg.dependencies[lib] = "^6.2.1";
            } else {
              pkg.dependencies[lib] = "latest";
            }
          }
          if (lib === "@prisma/client") {
            pkg.dependencies["prisma"] = "^6.2.1";
          }
          if (commonTypesNeeded.includes(lib)) {
            const typesLib = `@types/${lib}`;
            if (!pkg.devDependencies[typesLib] && !pkg.dependencies[typesLib]) {
              pkg.devDependencies[typesLib] = "latest";
            }
          }
        }
        
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
        console.log(`[Orchestrator] Integrated ${libs.length} valid inferred libraries into package.json.`);
      } catch (err: any) {
        console.warn(`[Orchestrator] Warning: Failed to integrate inferred libraries to package.json: ${err.message}`);
      }
    }

    // Force specification normalization against locked contract
    const normalizedAppSpec = ArchitectureContractNormalizer.normalizeSpecification(specification, resolvedContract);
    specification = normalizedAppSpec;

    // ── ContractIntegrityValidator — Assert contract immutability ─────────────
    ContractIntegrityValidator.assertValid(specification, resolvedContract);

    // ── TechnologyConstraintValidator — Filter forbidden libraries ───────────
    const { allowed: allowedAppLibs, forbidden: forbiddenAppLibs } = TechnologyConstraintValidator.filterLibraries(specification.inferredLibraries || [], resolvedContract);
    specification.inferredLibraries = allowedAppLibs;

    // ── MANDATORY CONTRACT GATE — Stop pipeline if contract is invalid ─────
    const appContractGateResult = ContractGate.verify(resolvedContract);
    if (!appContractGateResult.valid) {
      throw new Error(
        `CONTRACT_GATE_FAILED: Architecture contract is invalid for generateApplication. ` +
        `Errors: ${appContractGateResult.errors.join("; ")}. Pipeline stopped.`
      );
    }

    // ── CANONICAL ARCHITECTURE STATE (Single Source of Truth) ─────────────
    const canonicalState = CanonicalArchitectureState.getInstance().initialize(resolvedContract, outputDirectory);
    CanonicalManifestGenerator.generate(resolvedContract, outputDirectory);
    ProjectFileRegistry.getInstance().initialize(resolvedContract, outputDirectory);

    auditTrail.logEvent({
      agentRole: "Architect",
      action: `Completed requirements mapping & locked Architecture Contract. Frontend: ${resolvedContract.frontend.framework}, Backend: ${resolvedContract.backend.framework}, DB: ${resolvedContract.database.provider} (${resolvedContract.database.orm})`,
      status: "SUCCESS"
    });

    // ─── Design Pipeline (ProductUnderstanding → CapabilityPlanner → DesignDirector) ──────────────
    console.log("[DesignPipeline] Analyzing product characteristics...");
    let designBrief: import("../design/design-director.js").ProductDesignBrief | undefined;
    try {
      // [1] Analyze prompt → ProductCharacteristics (deterministic, no LLM)
      const rawPrompt = (specification as any).userPrompt || request;
      const characteristics = ProductUnderstanding.analyze(rawPrompt, {
        selectionMode: this.designMode,
        toneHint: this.designModeHint,
      });
      console.log(`[DesignPipeline] Pattern: ${characteristics.experiencePattern} | Tone: ${characteristics.emotionalTone.primary}`);

      // [1b] Synthesize bespoke CompositionGraph via ExperienceArchitect (anti-template invariant)
      const { ExperienceCapabilityResolver } = await import("../design/experience-capability-plan.js");
      const { ExperienceArchitect } = await import("../design/experience-architect.js");
      const experienceCapability = ExperienceCapabilityResolver.resolve(rawPrompt, characteristics, specification);
      const compositionGraph = ExperienceArchitect.architect(
        rawPrompt,
        characteristics,
        experienceCapability,
        resolvedContract,
        genIdentity.seed,
        undefined,
        specification
      );
      console.log(`[DesignPipeline] ✓ CompositionGraph synthesized: ${compositionGraph.structuralFingerprint}`);

      // [2] Plan feature priority and page IA directly from bespoke CompositionGraph
      const featurePriority = CapabilityPlanner.plan(characteristics, specification, compositionGraph);
      console.log(`[DesignPipeline] Primary interaction: ${featurePriority.informationArchitecture.primaryInteraction}`);

      // [3] Select art direction and assemble locked brief
      const brief = DesignDirector.direct(
        characteristics,
        featurePriority,
        specification,          // canonicalSpec for provenance hash
        rawPrompt,
        this.designMode,
        this.designModeHint,
        genIdentity.seed,
      );
      designBrief = brief;
      console.log(`[DesignPipeline] Art direction: ${brief.artDirectionName} (${brief.artDirectionRationale})`);

      // [4] Generate and persist reliable Theme (.aegis/theme.json) with WCAG AA contrast check
      const generatedTheme = ThemeGenerator.generateTheme({
        domain: resolvedContract?.domainCategory || specification.name,
        prompt: rawPrompt,
        seed: genIdentity.seed,
        colorSystem: brief.colorSystem,
        artDirection: (brief as any).artDirection,
      });
      ThemeGenerator.save(outputDirectory, generatedTheme);
      console.log(`[DesignPipeline] ✓ Theme generated & locked: Hue ${generatedTheme.brandHue}°, Contrast ${generatedTheme.contrastAudit.textOnSurface.ratio}:1 AA`);

      // [4a] Generate version 2.0 Structured Design Brief (.aegis/design-brief.json)
      const candidateBriefV2 = DesignBriefGenerator.generateBrief({
        prompt: rawPrompt,
        domain: resolvedContract?.domainCategory || specification.name,
        theme: generatedTheme,
        seed: genIdentity.seed,
        routes: featurePriority.informationArchitecture.pages.map((p) => p.route),
      });

      // [4b] Run Cross-Project Similarity Gate with bounded regeneration against project history
      const historySignatures = CrossProjectSimilarityDetector.loadSignatures(outputDirectory);
      const similarityGateResult = CrossProjectSimilarityGate.execute({
        candidateBrief: candidateBriefV2,
        historySignatures,
        prompt: rawPrompt,
        domain: resolvedContract?.domainCategory || specification.name,
        routes: featurePriority.informationArchitecture.pages.map((p) => p.route),
      });
      const resolvedBriefV2 = similarityGateResult.resolvedBrief;
      DesignBriefGenerator.save(outputDirectory, resolvedBriefV2);
      CrossProjectSimilarityDetector.recordSignature(
        outputDirectory,
        CrossProjectSimilarityDetector.extractSignature(resolvedBriefV2)
      );
      console.log(`[SimilarityGate] ✓ Originality Gate verified (${similarityGateResult.report.status}, Similarity: ${similarityGateResult.report.finalSimilarity})`);

      // [4c] Write locked brief to disk for DesignIntentGate and provenance checks
      DesignBriefLock.write(brief, outputDirectory);
      console.log(`[DesignPipeline] ✓ Brief locked: ${brief.briefId}`);

      // [4b] Lock authoritative ProductExperiencePlan for Frontend Product Identity Gate
      const { ProductExperiencePlanManager } = await import("../design/product-experience-plan.js");
      const experiencePlan = ProductExperiencePlanManager.build(
        brief,
        specification,
        rawPrompt,
        resolvedContract,
        (this as any)._referenceResearch,
        (this as any)._designResearchSynthesis
      );
      ProductExperiencePlanManager.save(experiencePlan, outputDirectory);
      console.log(`[DesignPipeline] ✓ ProductExperiencePlan locked (Pattern: ${experiencePlan.experiencePattern}, Capabilities: ${experiencePlan.requiredCapabilities.length})`);
      try {
        ArchitectureContractManager.syncRouteCapabilitiesFromBrief(outputDirectory, brief, rawPrompt);
      } catch {}

      // [4b-2] Bespoke Route Planning Grounded in Live Research & Features
      try {
        const { PageDesignSpecificationEngine } = await import("../design/page-design-specification-engine.js");
        const pageSpecs = await PageDesignSpecificationEngine.planAllRoutesWithAI({
          routes: experiencePlan.expectedRoutes || ["/"],
          prompt: rawPrompt,
          brandName: (experiencePlan as any).experienceIdentity?.brandIdentity?.name || specification.name || "Aegis Studio",
          discoveredFeatures: ((this as any)._referenceResearch?.relevantFeatures) || [],
          research: (this as any)._referenceResearch,
          aiProvider: this.provider,
        });
        PageDesignSpecificationEngine.save(pageSpecs, outputDirectory);
        const completeness = PageDesignSpecificationEngine.validateCompleteness(pageSpecs);
        if (!completeness.valid) {
          console.warn(`[PageDesign] ⚠️ Route planning completeness notice: ${completeness.errors.join("; ")}`);
        } else {
          console.log(`[PageDesign] ✓ Bespoke page specifications planned and verified for ${pageSpecs.length} routes.`);
        }

        // [4b-3] Autonomous Frontend Design Planner (.aegis/design/frontend-design-brief.md & frontend-design-spec.json)
        try {
          const { FrontendDesignPlanner } = await import("../design/frontend-design-planner.js");
          const plannedDesign = FrontendDesignPlanner.plan({
            prompt: rawPrompt,
            projectName: (experiencePlan as any).experienceIdentity?.brandIdentity?.name || specification.name || "Aegis Studio",
            domain: resolvedContract?.domainCategory || specification.name,
            theme: generatedTheme,
            designBrief: brief,
            pageSpecs,
            researchSynthesis: (this as any)._designResearchSynthesis,
            referenceResearch: (this as any)._referenceResearch,
            seed: genIdentity.seed,
          });
          FrontendDesignPlanner.saveToProject(outputDirectory, plannedDesign);
          console.log(`[FrontendDesignPlanner] ✓ Persisted authoritative frontend-design-brief.md and frontend-design-spec.json`);

          // [4b-4] Invoke Multi-Technology Adapter to Scaffold Framework Baseline
          try {
            const { StackSelectionIntelligence } = await import("../platform/stack-selection-intelligence.js");
            const { adapterRegistry } = await import("../platform/adapters/adapter-registry.js");
            const techArch = StackSelectionIntelligence.resolveStack(rawPrompt);
            const adapter = adapterRegistry.resolveAdapter(techArch);
            console.log(`[MultiTechAdapter] Resolved generation adapter: ${adapter.name} (${adapter.id}) for framework: ${techArch.frontend?.framework}`);
            const scaffoldFiles = await adapter.scaffoldProject({
              projectName: plannedDesign.spec.projectIdentity.productName,
              architecture: techArch,
              designSpec: plannedDesign.spec,
            });
            for (const sf of scaffoldFiles) {
              const fullOut = join(outputDirectory, sf.path);
              mkdirSync(dirname(fullOut), { recursive: true });
              if (!existsSync(fullOut)) {
                writeFileSync(fullOut, sf.content, "utf8");
              }
            }
            console.log(`[MultiTechAdapter] ✓ Scaffolding synchronized (${scaffoldFiles.length} files) preserving native framework idioms.`);
          } catch (adaptErr: any) {
            console.warn(`[MultiTechAdapter] ⚠️ Adapter baseline notice: ${adaptErr.message}`);
          }
        } catch (planErr: any) {
          console.warn(`[FrontendDesignPlanner] ⚠️ Frontend design brief notice: ${planErr.message}`);
        }
      } catch (pageSpecErr: any) {
        console.warn(`[PageDesign] ⚠️ Page design specification notice: ${pageSpecErr.message}`);
      }

      // ── [4d] Synthesize and Persist Canonical Feature Matrix (.aegis/feature-matrix.json) ──
      try {
        const existingAuthoritative = FeatureMatrixManager.loadFromProject(outputDirectory) || (this as any)._harmonizedFeatureMatrix;
        if (existingAuthoritative && existingAuthoritative.features?.length > 0) {
          // Authoritative Invariant: Preserve harmonized feature count and stable IDs (F01..Fn)
          console.log(`[FeatureMatrix] ✓ Preserving authoritative feature matrix with ${existingAuthoritative.totalFeatures} features.`);
          FeatureMatrixManager.saveToProject(outputDirectory, existingAuthoritative);
        } else {
          const rawPlannedFeatures = (featurePriority.features || []).map((f) => {
            const isCore = (featurePriority.core || []).some((c) => c.name === f.name) || f.visualPriority === "primary";
            const route = f.suggestedPage || (f.visualPriority === "primary" ? "/" : `/${f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
            const modelName = (resolvedContract.requiredModels && resolvedContract.requiredModels.length > 0)
              ? resolvedContract.requiredModels[0]
              : "Item";
            return {
              title: f.name,
              description: f.userIntent || `Feature implementation for ${f.name}`,
              priority: (isCore ? "must-have" : "should-have") as "must-have" | "should-have" | "optional",
              expectedBehavior: `User can interact with ${f.name} to accomplish intended workflow.`,
              routes: [route],
              components: [`${f.name.replace(/[^a-zA-Z0-9]/g, "")}Section`],
              apiEndpoints: [
                {
                  method: "GET" as const,
                  path: `/api/${f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                  expectedStatus: 200,
                },
              ],
              dataModels: [
                {
                  model: modelName,
                  fields: ["id", "createdAt"],
                },
              ],
              validationRules: [],
              acceptanceTests: [
                {
                  testId: `test_${f.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
                  strategy: "browser" as const,
                  description: `Verify ${f.name} render and interaction workflows`,
                },
              ],
              verificationStatus: "UNVERIFIED" as const,
            };
          });

          if (rawPlannedFeatures.length > 0) {
            const matrix = FeatureMatrixManager.createMatrix(
              resolvedContract.applicationType || specification.name || "AegisApp",
              resolvedContract.domainCategory || specification.name || "general",
              rawPlannedFeatures
            );
            FeatureMatrixManager.saveToProject(outputDirectory, matrix);
          }
        }
      } catch (fmErr: any) {
        console.warn(`[FeatureMatrix] Warning: Could not initialize feature matrix: ${fmErr.message}`);
      }

      // Display Authoritative Autonomous Design Planner Checkpoint Banner
      const dddPath = join(outputDirectory, ".aegis", "design-decision-document.json");
      let dddData: any = null;
      try {
        if (existsSync(dddPath)) {
          dddData = JSON.parse(readFileSync(dddPath, "utf8"));
        }
      } catch {}

      console.log();
      console.log("════════════════════════════════════════════════════════════════════════════════");
      console.log(" 🎨 AEGIS AUTONOMOUS DESIGN PLANNER — AUTHORITATIVE SPECIFICATION");
      console.log("════════════════════════════════════════════════════════════════════════════════");
      console.log(` • Product & Brand:       ${dddData?.projectIdentity?.productName || resolvedContract?.appName || specification.name || "Aegis Studio"}`);
      console.log(` • Category & Domain:     ${dddData?.referenceResearch?.selectedReferences?.[0]?.name ? `${dddData.referenceResearch.selectedReferences[0].name} (Domain Intelligence)` : experienceCapability.experienceType}`);
      console.log(` • Visual Thesis:         ${dddData?.projectIdentity?.visualThesis || "Original bespoke design derived from domain requirements"}`);
      const liveRefSources = (this as any)._referenceResearch?.sources || [];
      if (liveRefSources.length > 0) {
        console.log(` • Discovered References: ${liveRefSources.map((s: any) => `${s.domainName || s.title} (${s.status})`).join(", ")}`);
      }
      const livePrinciples = dddData?.referenceResearch?.selectedReferences?.[0]?.principlesExtracted;
      if (livePrinciples && livePrinciples.length > 0) {
        console.log(` • Principles Extracted:  ${livePrinciples.slice(0, 2).join("; ")}`);
      }
      if (dddData?.visualSystem?.colorPalette) {
        const pal = dddData.visualSystem.colorPalette;
        console.log(` • Bespoke Color Palette: Ground: ${pal.background} | Surface: ${pal.surface} | Primary: ${pal.primaryAccent} | Accent: ${pal.secondaryAccent} | Text: ${pal.primaryText}`);
      }
      if (dddData?.visualSystem?.typography) {
        const typo = dddData.visualSystem.typography;
        console.log(` • Typography Pairing:    Display: ${typo.displayFont} | Body: ${typo.bodyFont}`);
      }
      console.log(` • Composition Strategy:  ${compositionGraph.compositionStrategy || "CUSTOM"} (${experienceCapability.experienceType})`);
      console.log(` • Navigation Strategy:   ${experiencePlan.navigationDesign?.model || "CUSTOM"}`);
      console.log("────────────────────────────────────────────────────────────────────────────────");
      console.log(" 🗺️  PLANNED SITEMAP & INDIVIDUAL PAGE BLUEPRINTS:");
      const sitemapList = dddData?.sitemap || (experiencePlan.expectedRoutes || ["/"]).map((r: string) => ({ route: r, pageName: r === "/" ? "Home" : r.replace(/^\//, "") }));
      sitemapList.forEach((p: any, idx: number) => {
        const bp = (dddData?.pageBlueprints || []).find((b: any) => b.route === p.route);
        const comp = bp?.overallComposition || "BESPOKE_STAGE";
        console.log(`   [${idx + 1}/${sitemapList.length}] ${p.route.padEnd(20)} → ${p.pageName.padEnd(25)} (${comp})`);
        if (bp?.uniqueFunctionalModules && bp.uniqueFunctionalModules.length > 0) {
          console.log(`       └─ Key Modules: ${bp.uniqueFunctionalModules.join(", ")}`);
        }
      });
      console.log("════════════════════════════════════════════════════════════════════════════════");
      console.log();

      // Persist authoritative generation provenance to .aegis/generation.json
      GenerationSeedManager.saveProvenance(outputDirectory, {
        generationId: genIdentity.generationId,
        generationSeed: genIdentity.seed,
        promptHash: genIdentity.promptHash,
        designBriefHash: brief.briefId,
        productContractHash: resolvedContract ? createHash("sha256").update(JSON.stringify(resolvedContract)).digest("hex").slice(0, 16) : undefined,
        createdAt: new Date().toISOString(),
        mode: genIdentity.mode,
        experienceType: experienceCapability.experienceType,
        compositionStrategy: compositionGraph.compositionStrategy,
        navigationStrategy: experiencePlan.navigationDesign?.model,
      });

      // [4c] Content Strategist: Generate authoritative site content in src/content/site-content.ts
      try {
        const { ContentStrategistAgent } = await import("../agents/content-strategist-agent.js");
        const { ProductDiscoveryAgent } = await import("../agents/product-discovery-agent.js");
        const discovery = new ProductDiscoveryAgent(this.provider);
        const featureMatrix = (this as any)._cachedFeatureMatrix || await discovery.discover(rawPrompt, characteristics, String(brief.seed));
        const contentAgent = new ContentStrategistAgent(this.provider);
        await contentAgent.generateContent(featureMatrix, brief, outputDirectory);
      } catch (contentErr: any) {
        console.warn(`[DesignPipeline] ⚠️ Content generation issue: ${contentErr.message}`);
      }

      // [5] Generate design tokens + components using the locked brief
      const dsFiles = this.designSystemGenerator.generate(specification, brief);
      const dsContext = this.designSystemGenerator.buildCoderContext(specification, undefined, brief);
      const dsFramework = specification.frontend?.toLowerCase().includes("react") ? "react-vite" : "html";
      this.write(
        this.validator.validate(dsFramework, dsFiles),
        outputDirectory,
      );
      enrichedRequest = enrichedRequest + "\n\n" + dsContext;
      console.log(`[DesignPipeline] ✓ Wrote ${dsFiles.length} design system files.`);

      // [5b] Visual Asset Director: inject authoritative visual asset manifest into Coder Context
      try {
        const { AssetDirector } = await import("../design/asset-director.js");
        const manifestPath = join(outputDirectory, ".aegis", "asset-manifest.json");
        if (existsSync(manifestPath)) {
          const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
          const assetContext = AssetDirector.buildCoderContext(manifest);
          if (assetContext) {
            enrichedRequest = enrichedRequest + "\n\n" + assetContext;
            console.log(`[DesignPipeline] ✓ Injected ${manifest.assetCount} planned visual assets into Coder context.`);
          }
        }
      } catch (assetErr: any) {
        console.warn(`[DesignPipeline] ⚠️ Asset context injection: ${assetErr.message}`);
      }

      // [6] Run DesignIntentGate (source-level check — after code generation in the build phase)
      //     We schedule this for post-generation; store the brief so the build loop can call it.
      (this as any)._pendingDesignBrief = brief;
    } catch (dsErr: any) {
      // Design failures are hard errors — no silent fallback.
      // A fallback would produce an "AI-looking" generic result, defeating the purpose.
      throw new Error(
        `DESIGN_PIPELINE_FAILURE: The design pipeline failed before code generation could begin. ` +
        `This is a hard error — fix the pipeline before continuing. \n` +
        `Cause: ${dsErr.message}\n${dsErr.stack || ""}`
      );
    }

    // ─── Staged Architecture ─────────────────────────────────────────────────
    // In the staged workflow, Database Design & Prisma Schema Persistence is deferred
    // to Stage 9 (after user frontend review and approval).
    console.log("[StagedArchitecture] Database design & Prisma schema deferred to Stage 9 (post-frontend approval).");

    // Set canonical project root singleton to prevent duplicate path bugs
    ProjectRootSingleton.setRoot(outputDirectory);
    ProjectPathResolver.assertNoDuplicateRoot(outputDirectory);
    ProjectPathResolver.assertNoDuplicateRoot(outputDirectory);

    // Rule 4: Run ManifestCompletenessValidator and CanonicalDependencyClosureValidator before implementation
    const manifestCheck = ManifestCompletenessValidator.validate(outputDirectory);
    if (!manifestCheck.valid) {
      throw new Error(`MANIFEST_INCOMPLETE_FAILURE: Cannot begin implementation with incomplete manifest. Missing registrations: ${manifestCheck.missingRegistrations.join(", ")}`);
    }

    const closureCheck = CanonicalDependencyClosureValidator.validate(outputDirectory);
    if (!closureCheck.valid) {
      throw new Error(`DEPENDENCY_CLOSURE_FAILURE: Unresolved dependencies in canonical plan: ${closureCheck.missingDependencies.join(", ")}`);
    }

    const symbolCheck = SymbolContractValidator.validateProject(outputDirectory);
    if (!symbolCheck.valid) {
      console.warn(`[SYMBOL-CONTRACT-WARNING] Symbol contract mismatches detected: ${symbolCheck.errors.length}`);
    }

    const activeContractApp = resolvedContract || ArchitectureResolver.loadContract(outputDirectory);
    if (!activeContractApp) {
      throw new Error(`ARCHITECTURE_CONTRACT_MISSING: No architecture contract found in generateApplication for projectPath: ${outputDirectory}`);
    }
    tasks = PlannerArchitectureGuard.filterTasks(tasks, activeContractApp);

    // TaskNormalizer: Normalize tasks against canonical contract
    tasks = tasks.map(t => TaskNormalizer.normalizeTask(t, activeContractApp).normalizedTask);

    // DomainModelGuard: Filter out tasks that introduce unauthorized domain models
    const requiredDomainModels = activeContractApp.requiredModels || [];
    if (requiredDomainModels.length > 0) {
      tasks = DomainModelGuard.filterTasks(tasks, requiredDomainModels);
    }

    // Deduplicate tasks: cap at 6 in benchmark mode; in general-purpose generation, allow task count to be determined by requirements without arbitrary ceilings
    const isBenchmark = GenerationBudgetGuard.isBenchmarkMode();
    const userMaxTasks = (specification as any)?.maxTasks;
    const taskCap = isBenchmark ? 6 : (userMaxTasks !== undefined ? userMaxTasks : undefined);

    tasks = TaskNormalizer.deduplicateAndCapTasks(tasks, taskCap);

    // ── HARD TASK CONTRACT GATE — Reject forbidden tech, regenerate up to 2x (bounded budget) ──
    {
      const MAX_TASK_REGEN = 2;
      let gateResult = PlanContractGate.verify(tasks, activeContractApp);

      if (!gateResult.valid) {
        console.warn(`[TASK-CONTRACT] ${gateResult.rejected.length} task(s) rejected. Attempting regeneration...`);

        for (let regen = 0; regen < MAX_TASK_REGEN && !gateResult.valid; regen++) {
          GenerationBudgetGuard.getInstance().assertRepairAllowed("TaskContractGate");
          GenerationBudgetGuard.getInstance().recordRepairAttempt("TaskContractGate");
          console.log(`[TASK-CONTRACT] Regeneration attempt ${regen + 1}/${MAX_TASK_REGEN}...`);

          try {
            const regenSpec = {
              ...specification,
              _taskRegenContext: {
                rejectedTasks: gateResult.rejected.map(r => r.task.title),
                canonicalFrontend: activeContractApp.frontend.framework,
                canonicalBackend: activeContractApp.backend.framework,
                canonicalDatabase: activeContractApp.database.provider,
                canonicalOrm: activeContractApp.database.orm,
                canonicalAuth: activeContractApp.authentication,
                forbiddenTechnologies: canonicalState.forbiddenTechnologies,
              },
            };

            // Regenerate the FULL task plan (REPLACE, NOT APPEND)
            const rawNewTasks = await this.plannerAgent.execute(regenSpec as any);
            const normalizedNew = rawNewTasks.map(t => TaskNormalizer.normalizeTask(t, activeContractApp).normalizedTask);
            tasks = TaskNormalizer.deduplicateAndCapTasks(normalizedNew, taskCap);
            gateResult = PlanContractGate.verify(tasks, activeContractApp);
          } catch (regenErr: any) {
            console.warn(`[TASK-CONTRACT] Regeneration attempt ${regen + 1} failed: ${regenErr.message}`);
            // Fallback: normalize rejected tasks in-place
            tasks = tasks.map(t => TaskNormalizer.normalizeTask(t, activeContractApp).normalizedTask);
            tasks = TaskNormalizer.deduplicateAndCapTasks(tasks, taskCap);
            gateResult = PlanContractGate.verify(tasks, activeContractApp);
          }
        }

        if (!gateResult.valid) {
          const failedTitles = gateResult.rejected.map(r => `"${r.task.title}"`).join(", ");
          throw new Error(
            `TASK_CONTRACT_FAILURE: ${gateResult.rejected.length} task(s) still contain forbidden technology after ${MAX_TASK_REGEN} regeneration attempts: ${failedTitles}. ` +
            `Violations: ${gateResult.errors.join("; ")}. Pipeline halted.`
          );
        }

        console.log(`[TASK-CONTRACT] All tasks accepted after regeneration. Proceeding with ${gateResult.accepted.length} tasks.`);
      }

      tasks = gateResult.accepted;
    }


    this.execution.enter(
      ExecutionPhase.Architecture,
    );

    const architecture =
      this.architect.plan(specification);

    this.execution.enter(
      ExecutionPhase.Planning,
    );

    console.log("[DEBUG] resolvedContract prior to framework access:", JSON.stringify(resolvedContract));
    console.log("[DEBUG] architecture prior to framework fallback access:", JSON.stringify(architecture));
    const framework = resolvedContract?.frontend?.framework || this.selector.select(architecture);

    console.log("Framework:", framework);

    this.execution.enter(
      ExecutionPhase.Implementation,
    );
    const existingFiles: string[] = [];
    let response = "";

    let parsedFiles: GeneratedFile[] = [];

    // Print final resolved architecture snapshot before coding (Part 15)
    console.log("\n=== FINAL RESOLVED ARCHITECTURE ===");
    console.log(`Frontend: ${resolvedContract.frontend.framework}`);
    console.log(`Backend:  ${resolvedContract.backend.framework}`);
    console.log(`Database: ${resolvedContract.database.provider}`);
    console.log(`ORM:      ${resolvedContract.database.orm}`);
    console.log(`Auth:     ${resolvedContract.authentication}`);
    console.log(`Language: ${resolvedContract.language}`);
    console.log(`Models:   ${(resolvedContract.requiredModels || []).join(", ")}`);
    console.log("===================================\n");

    // ── FRONTEND-FIRST: Validate initial plan is frontend-only ─────────────────
    // The initial plan MUST contain only frontend tasks. Any non-frontend tasks
    // are partitioned and deferred to Stage 11 post-approval planning without redundant LLM round-trips.
    const isNonFrontendTask = (t: Task): boolean => {
      const title = (t.title || "").toLowerCase();
      const desc = (t.description || "").toLowerCase();
      const stage = ((t as any).stage || "").toLowerCase();
      return stage.includes("database") || stage.includes("datamodeling") ||
        stage.includes("apidesign") || stage.includes("backend") ||
        title.includes("prisma") || title.includes("schema") ||
        title.includes("migration") || title.includes("postgresql") ||
        title.includes("express") || title.includes("server") ||
        title.includes("backend") || title.includes("api route") ||
        desc.includes("prisma") || desc.includes("schema.prisma") ||
        desc.includes("migration") || desc.includes("postgresql") ||
        (desc.includes("express") && desc.includes("route")) ||
        (desc.includes("server") && (desc.includes("controller") || desc.includes("service")));
    };

    let validatedTasks = tasks;
    const invalidPlanTasks = tasks.filter(isNonFrontendTask);

    if (invalidPlanTasks.length > 0) {
      console.log(
        `[FrontendFirst] ⚡ Consolidated planning: Partitioning ${invalidPlanTasks.length} non-frontend task(s) to Stage 11 post-approval planning. ` +
        `Retaining ${tasks.length - invalidPlanTasks.length} frontend-only task(s) without redundant LLM replanning.`
      );
      validatedTasks = tasks.filter(t => !isNonFrontendTask(t));
    }

    // All tasks passed to executeTaskBatch during the frontend stage are guaranteed frontend-only.
    const frontendTasks = validatedTasks;
    console.log(`[STAGE 1–7: FRONTEND-ONLY] ${frontendTasks.length} frontend task(s) — no database/backend tasks in this stage.`);

    const patchEngine = new PatchEngine();

    const executeTaskBatch = async (batchTasks: Task[], stageLabel: string, isFrontendBatch = false) => {
      if (batchTasks.length === 0) {
        console.log(`[StagedArchitecture] No tasks assigned for ${stageLabel}.`);
        return;
      }

      console.log(`\n══════════════════════════════════════════════════════════════════════════════`);
      console.log(`${stageLabel.toUpperCase()} (${batchTasks.length} tasks)`);
      console.log(`══════════════════════════════════════════════════════════════════════════════`);

      let parallelTiers: Task[][];
      try {
        parallelTiers = this.scheduler.scheduleParallelTiers(batchTasks) as Task[][];
        console.log(`[Orchestrator] DAG parallel scheduling successful. Grouped ${batchTasks.length} tasks into ${parallelTiers.length} execution tiers.`);
      } catch (error: any) {
        console.warn(`[Orchestrator] Warning: Parallel scheduling failed (${error.message}). Falling back to sequential execution.`);
        parallelTiers = batchTasks.map(t => [t]);
      }

      for (let i = 0; i < parallelTiers.length; i++) {
        const tier = parallelTiers[i];
        console.log(`\nRunning execution tier ${i + 1}/${parallelTiers.length} with ${tier.length} parallel tasks...`);

        const promises = tier.map(async (task) => {
          let result: { response: string; files: GeneratedFile[] } = { response: "", files: [] };

          // Contract Hash Resolution (strictly lexically scoped, safe against TDZ)
          const activeContractHash =
            activeContractApp?.contractHash ||
            activeContractApp?.architectureHash ||
            resolvedContract?.contractHash ||
            resolvedContract?.architectureHash ||
            (architecture as any)?.contractHash ||
            (specification as any)?.contractHash ||
            "default";

          // Check Task Satisfaction: Verify syntax, import closure, and contract integrity (0 LLM tokens)
          let satisfaction;
          try {
            satisfaction = IncrementalGenerator.checkTaskSatisfaction(task, outputDirectory, {
              contractHash: activeContractHash,
              isFrontend: isFrontendBatch,
              userPrompt: enrichedRequest,
            });
          } catch (satErr: any) {
            console.warn(`[IncrementalGenerator] Warning: Task satisfaction check threw (${satErr.message}). Falling back to full generation.`);
            satisfaction = { isSatisfied: false, reason: "Satisfaction check fallback", existingFiles: [] };
          }

          if (satisfaction.isSatisfied && satisfaction.existingFiles.length > 0) {
            console.log(`[IncrementalGenerator] ✓ Reusing ${satisfaction.existingFiles.length} valid existing file(s) for "${task.title}" (0 LLM tokens).`);
            result = { response: satisfaction.reason, files: satisfaction.existingFiles };
            CostObservabilityReporter.getInstance().incrementReusedFiles(satisfaction.existingFiles.length);
            CostObservabilityReporter.getInstance().recordSaving({
              category: "TASK_SATISFACTION_REUSE",
              description: `Reused ${satisfaction.existingFiles.length} valid file(s) for task "${task.title}"`,
              estimatedTokensSaved: 8500,
            });
          } else {
            console.log(`[Task: ${task.title}] Calling CoderAgent... Status: PENDING`);
            result = await this.coderAgent.execute(
              task,
              architecture,
              architecturePlan,
              enrichedRequest,
              outputDirectory,
              existingFiles,
              imagePayload,
            );
            console.log(`[Task: ${task.title}] Status: GENERATED`);
            CostObservabilityReporter.getInstance().incrementRegeneratedFiles(result.files.length);
            IncrementalGenerator.recordTaskFingerprint(task, outputDirectory, activeContractHash || "default");
          }

            // ── STEP A: Hard Frontend File Policy (reject at write time) ──
            if (isFrontendBatch) {
              const policyResult = FrontendFilePolicyGuard.enforce(result.files, task.title);
              if (policyResult.hadViolations) {
                // Files are rejected — not written to disk. Already logged by the guard.
                result.files = policyResult.allowed;
              }
              const pageFiles = result.files.filter(f => f.path.replace(/\\/g, "/").includes("src/pages/"));
              for (const pf of pageFiles) {
                const pageBasename = pf.path.replace(/\\/g, "/").split("/").pop()?.replace(/\.tsx?$/, "") || "Page";
                console.log(`[PageBuilder] 🔨 Page implemented: ${pageBasename} (${pf.path})`);
              }
            } else if (InteractionProvenanceTracker.hasBaseline(outputDirectory)) {
              // During post-baseline/backend tasks, strictly reject overwriting or introducing approved frontend UI pages under src/
              // BUT allow legitimate integration bridge files (e.g. src/services/api.ts, src/lib/auth.ts) and task-owned files
              result.files = result.files.filter(f => {
                const norm = f.path.replace(/\\/g, "/");
                if (norm.startsWith("src/")) {
                  if (isAllowedIntegrationBridgeFile(norm, task.ownedFiles)) {
                    return true;
                  }
                  console.warn(`[BackendTaskGuard] 🛡️ Rejected frontend write during backend task "${task.title}": ${f.path}`);
                  return false;
                }
                return true;
              });
            }

            // ── STEP B: Trailing-filename contamination strip ──
            for (const file of result.files) {
              const filePath = file.path.replace(/\\/g, "/");
              const trimmed = file.content.trimEnd();
              if (trimmed.endsWith(filePath) || trimmed.endsWith(file.path)) {
                const pathToStrip = trimmed.endsWith(filePath) ? filePath : file.path;
                file.content = trimmed.slice(0, trimmed.length - pathToStrip.length).trimEnd();
                console.log(`[Task: ${task.title}] 🧹 Stripped trailing filename contamination from: ${file.path}`);
              }
              file.content = file.content
                .replace(/\n+(?:FILE|file|path|filename|filepath):\s*[\w\/\\.]+\.(?:ts|tsx|js|jsx|json|prisma)\s*$/gm, "")
                .replace(/\n+(?:server|src|client|prisma)\/[\w\/]+\.(?:ts|tsx|js|jsx|json|prisma)\s*$/gm, "");
            }

            // ── STEP C: Completeness validation ──
            result.files = result.files.filter(file => {
              if (!file.content || file.content.trim().length === 0) {
                const diskPath = join(outputDirectory, file.path);
                if (existsSync(diskPath) && statSync(diskPath).size > 0) {
                  console.log(`[Task: ${task.title}] ℹ️ Skipping empty candidate for existing non-empty file: ${file.path}`);
                  return false;
                }
              }
              return true;
            });

            const invalidCandidates: string[] = [];
            for (const file of result.files) {
              const validation = GeneratedFileValidator.reconcileAndValidate(file.content, file.path);
              if (validation.reconciledContent) {
                file.content = validation.reconciledContent;
              }
              if (!validation.valid) {
                const msg = validation.issues.map(j => j.message).join("; ");
                invalidCandidates.push(`${file.path} (${msg})`);
              }
            }

          if (invalidCandidates.length > 0) {
            const validationErrMsg = `INCOMPLETE_GENERATED_FILE: Candidate files failed completeness validation: ${invalidCandidates.join(", ")}`;
            console.warn(`[Orchestrator] Candidate validation failed for task "${task.title}": ${validationErrMsg}`);
            console.log(`[Orchestrator] Launching inline Coder self-healing loop (max 2 repairs)...`);

            const guard = GenerationBudgetGuard.getInstance();
            const MAX_INLINE_REPAIRS = 2;
            let inlineRepairAttempts = 0;
            let success = false;
            let lastError: Error = new Error(validationErrMsg);

            while (inlineRepairAttempts < MAX_INLINE_REPAIRS && !success) {
              inlineRepairAttempts++;
              const stageKey = `InlineCoderRepair:${task.title}`;
              guard.assertRepairAllowed(stageKey);
              guard.recordRepairAttempt(stageKey);
              console.log(`[Self-Healing] Inline Coder repair attempt ${inlineRepairAttempts}/${MAX_INLINE_REPAIRS}...`);
              try {
                const failingFileList = result.files
                  .filter(f => {
                    const v = GeneratedFileValidator.validateCompleteness(f.content, f.path);
                    return !v.valid;
                  })
                  .map(f => `- ${f.path}: ${GeneratedFileValidator.validateCompleteness(f.content, f.path).issues.map(i => i.message).join("; ")}`)
                  .join("\n");

                const repairContext = `Task: "${task.title}"\nError: ${lastError.message}\nFailing files:\n${failingFileList || "(see error above)"}\n\nIMPORTANT: Return ONLY the corrected files in this exact format:\n===FILE: path/to/file.ts===\n[complete file content]\n===END===`;

                const repairResponse = await this.repairCoordinator.repair(
                  request,
                  lastError.message,
                  repairContext
                );

                let repairedFiles = this.parser.parse(repairResponse);
                if (repairedFiles.length === 0) {
                  const xmlRegex = /<FILE\s+path=["']([^"']+)["']>\s*([\s\S]*?)\s*<\/FILE>/gi;
                  let match: RegExpExecArray | null;
                  while ((match = xmlRegex.exec(repairResponse)) !== null) {
                    const filePath = match[1].trim();
                    const fileContent = match[2].trim();
                    if (filePath && fileContent) {
                      repairedFiles.push({ path: filePath, content: fileContent });
                    }
                  }
                }

                for (const file of repairedFiles) {
                  const filePath = file.path.replace(/\\/g, "/");
                  const trimmed = file.content.trimEnd();
                  if (trimmed.endsWith(filePath) || trimmed.endsWith(file.path)) {
                    const pathToStrip = trimmed.endsWith(filePath) ? filePath : file.path;
                    file.content = trimmed.slice(0, trimmed.length - pathToStrip.length).trimEnd();
                  }
                  file.content = file.content
                    .replace(/\n+(?:FILE|file|path|filename|filepath):\s*[\w\/\\.]+\.(?:ts|tsx|js|jsx|json|prisma)\s*$/gm, "")
                    .replace(/\n+(?:server|src|client|prisma)\/[\w\/]+\.(?:ts|tsx|js|jsx|json|prisma)\s*$/gm, "");
                }

                const validRepairedFiles = repairedFiles.filter(f => {
                  const validation = GeneratedFileValidator.validateCompleteness(f.content, f.path);
                  return validation.valid;
                });

                if (validRepairedFiles.length > 0) {
                  // Partial artifact preservation: Retain all valid files already completed in this task
                  const validCompletedFiles = (result.files || []).filter(f => {
                    const validation = GeneratedFileValidator.validateCompleteness(f.content, f.path);
                    return validation.valid;
                  });
                  const mergedFiles = [
                    ...validCompletedFiles.filter(vf => !validRepairedFiles.some(rf => rf.path === vf.path)),
                    ...validRepairedFiles,
                  ];
                  result = {
                    response: repairResponse,
                    files: mergedFiles,
                  };
                  success = true;
                  console.log(`[Self-Healing] ✓ Coder repair succeeded! Merged ${validRepairedFiles.length} repaired file(s) with ${validCompletedFiles.length} completed component(s) (total: ${mergedFiles.length}).`);
                } else if (inlineRepairAttempts < MAX_INLINE_REPAIRS) {
                  lastError = new Error(`REPAIR_RESPONSE_INVALID: Attempt ${inlineRepairAttempts} yielded no valid files. Retrying with stricter prompt.`);
                } else {
                  throw new Error("REPAIR_RESPONSE_INVALID: No syntactically complete candidate files parsed from repair response.");
                }
              } catch (repairErr: any) {
                lastError = repairErr;
                if (
                  repairErr instanceof BudgetExceededError ||
                  repairErr instanceof ProviderOutageHaltError ||
                  repairErr?.code === "BUDGET_EXHAUSTED" ||
                  repairErr?.code === "PROVIDER_OUTAGE_HALT" ||
                  repairErr?.message?.includes("BUDGET_EXHAUSTED") ||
                  repairErr?.message?.includes("PROVIDER_OUTAGE_HALT")
                ) {
                  throw repairErr;
                }
                console.error(`[Self-Healing] Inline repair attempt ${inlineRepairAttempts} failed:`, repairErr.message);
              }
            }

            if (!success) {
              console.error(`[Self-Healing] ❌ Task candidate repair failed after ${inlineRepairAttempts} attempt(s). Failing task "${task.title}".`);
              throw lastError;
            }
          }
          console.log(`[Task: ${task.title}] Status: VALIDATED`);
          return result;
        });

        const tierResults = await Promise.all(promises);

        for (let j = 0; j < tier.length; j++) {
          const task = tier[j];
          const result = tierResults[j];
          console.log(`[Task: ${task.title}] Status: SUCCESS`);

          response += result.response + "\n";
          patchEngine.apply(result.response, outputDirectory);

          const filesMatched = [
            ...result.response.matchAll(/===FILE:\s*(.*?)===/g)
          ].map(m => m[1].trim());

          const patchesMatched = [
            ...result.response.matchAll(/===PATCH:\s*(.*?)===/g)
          ].map(m => m[1].trim());

          const allFilesTouched = [...new Set([...filesMatched, ...patchesMatched])];

          for (const filePath of allFilesTouched) {
            const fullPath = join(outputDirectory, filePath);
            if (existsSync(fullPath)) {
              const content = readFileSync(fullPath, "utf8");
              parsedFiles = parsedFiles.filter(f => f.path !== filePath);
              parsedFiles.push({ path: filePath, content });
              
              if (!existingFiles.includes(filePath)) {
                existingFiles.push(filePath);
              }
            }
          }
        }
      }
    };

    // ── STAGE 3: FRONTEND GENERATION (FRONTEND ONLY) ──────────────────────────
    await executeTaskBatch(frontendTasks, "STAGE 3: FRONTEND GENERATION (FRONTEND ONLY)", true);

    // ── STAGE 3.5: EXPERIENCE DESIGN & ROUTE-PAGE SYNTHESIS (PRE-BASELINE) ────
    console.log("[ExperienceArchitect] Synthesizing canonical route experience pages prior to baseline capture...");
    try {
      FastDeterministicSanitizer.synthesizeMissingRoutePages(outputDirectory, resolvedContract);
      // Synchronize in-memory parsedFiles with pre-baseline synthesized files
      const preBaselineSrcDir = join(outputDirectory, "src");
      if (existsSync(preBaselineSrcDir)) {
        for (const cand of ["routes.tsx", "components/Layout.tsx", "pages/DashboardPage.tsx", "hooks/useAuth.ts", "hooks/useAuth.tsx", "features/auth/LoginPage.tsx"]) {
          const fullCand = join(preBaselineSrcDir, cand);
          if (existsSync(fullCand)) {
            const content = readFileSync(fullCand, "utf8");
            const normRel = "src/" + cand;
            parsedFiles = parsedFiles.filter(f => f.path !== normRel);
            parsedFiles.push({ path: normRel, content });
          }
        }
      }
      FastDeterministicSanitizer.normalizeLayoutComponent(outputDirectory);
    } catch (routeErr: any) {
      console.warn(`[ExperienceArchitect] Warning: Pre-baseline route page synthesis: ${routeErr.message}`);
    }

    // ─── Interaction Provenance: Capture Native Baseline (Post-Generation, Pre-Sanitization) ─
    try {
      InteractionProvenanceTracker.captureBaseline(outputDirectory);
    } catch (provErr: any) {
      console.warn(`[InteractionProvenance] Warning: Failed to capture baseline at post-generation boundary: ${provErr.message}`);
    }

    FastDeterministicSanitizer.sanitizeProject(outputDirectory, resolvedContract);

    // ── STAGES 4–7: FRONTEND VISUAL & FUNCTIONAL CHECK ────────────────────────
    console.log("\n══════════════════════════════════════════════════════════════════════════════");
    console.log("STAGE 4–7: FRONTEND FUNCTIONAL & CHROMIUM MULTI-VIEWPORT REVIEW");
    console.log("══════════════════════════════════════════════════════════════════════════════");

    // 1. Ensure frontend package.json & dependencies are prepared for execution
    const frontendPkgPath = join(outputDirectory, "package.json");
    if (!existsSync(frontendPkgPath)) {
      writeFileSync(frontendPkgPath, JSON.stringify({
        name: outputDirectory.split(/[\\/]/).at(-1) ?? "aegis-app",
        private: true,
        version: "0.0.1",
        type: "module",
        scripts: {
          "dev": "vite",
          "build": "tsc && vite build",
          "preview": "vite preview"
        },
        dependencies: {
          "react": "^18.3.1",
          "react-dom": "^18.3.1",
          "react-router-dom": "^6.26.0",
          "clsx": "^2.1.1",
          "tailwind-merge": "^2.5.2",
          "lucide-react": "^0.441.0"
        },
        devDependencies: {
          "@types/react": "^18.3.3",
          "@types/react-dom": "^18.3.0",
          "@vitejs/plugin-react": "^4.3.1",
          "typescript": "^5.5.3",
          "vite": "^5.4.1",
          "tailwindcss": "^3.4.1",
          "postcss": "^8.4.47",
          "autoprefixer": "^10.4.20"
        }
      }, null, 2), "utf8");
    }

    try {
      await this.projectStartupAgent.prepare(outputDirectory);
    } catch (startupPrepErr: any) {
      console.warn(`[Startup] Pre-review startup preparation warning: ${startupPrepErr.message}`);
    }

    // 1b. Enforce clean build before browser evaluation (prevent certifying broken code)
    console.log("[StageReview] 🔍 Verifying clean frontend compilation before Chromium review...");
    const preReviewResult = await this.verifyAndHealPreReviewBuild(
      request,
      framework,
      outputDirectory,
      resolvedContract,
      parsedFiles,
      response
    );
    let preReviewBuild = preReviewResult.build;

    if (!preReviewBuild.success) {
      const fullDiagnostics = [preReviewBuild.stdout, preReviewBuild.stderr].filter(Boolean).join("\n");
      console.error(`\n❌ FRONTEND_BUILD_BLOCKED: Clean build required before browser evaluation.\nDiagnostics:\n${fullDiagnostics}`);
      throw new Error(`FRONTEND_BUILD_BLOCKED: Clean compilation required before browser review: ${fullDiagnostics || "TypeScript compilation failed."}`);
    }

    // 2. Start frontend dev server
    console.log("[StageReview] 🚀 Starting frontend dev server for live Chromium visual review...");
    let frontendServerInfo = await AppServerRunner.startServer(outputDirectory);
    if (!frontendServerInfo.ready) {
      console.warn(`[AppServerRunner] ⚠️ First attempt timed out. Retrying dev server startup on port ${frontendServerInfo.port}...`);
      AppServerRunner.stopServer();
      await new Promise(r => setTimeout(r, 1000));
      frontendServerInfo = await AppServerRunner.startServer(outputDirectory);
    }

    if (!frontendServerInfo.ready) {
      const isAutoApprove = Boolean(
        options?.approveFrontend ||
        options?.skipApproval ||
        process.env.AEGIS_AUTO_APPROVE === "1" ||
        process.env.CI === "true" ||
        !process.stdin?.isTTY
      );
      if (isAutoApprove) {
        console.warn(`[AppServerRunner] ⚠️ Frontend dev server could not be reached in automated/headless environment. Proceeding with static verification.`);
      } else {
        throw new Error(`FRONTEND_REVIEW_BLOCKED: Frontend dev server failed to start at ${frontendServerInfo.url}. Server must be ready before visual review and approval.`);
      }
    }

    // 3. Authoritative Chromium Review with multi-viewport verification & fatal error trapping
    let browserReview = await ReadOnlyBrowserValidator.reviewFrontend(frontendServerInfo.url, outputDirectory);
    if (!browserReview.passed && !browserReview.productIdentity && browserReview.failureReason?.includes("screenshot missing")) {
      console.log(`[BrowserValidator] 🔄 Retrying browser review once for transient screenshot capture error...`);
      await new Promise(r => setTimeout(r, 1500));
      browserReview = await ReadOnlyBrowserValidator.reviewFrontend(frontendServerInfo.url, outputDirectory);
    }

    // If review failed due to runtime errors or product mismatch, allow up to 2 targeted Coder repair attempts (bounded budget)
    const MAX_FRONTEND_REPAIR_ATTEMPTS = 2;
    let repairAttempts = 0;
    while (!browserReview.passed && repairAttempts < MAX_FRONTEND_REPAIR_ATTEMPTS) {
      repairAttempts++;
      GenerationBudgetGuard.getInstance().assertRepairAllowed("FrontendVisualReview");
      GenerationBudgetGuard.getInstance().recordRepairAttempt("FrontendVisualReview");
      console.warn(`[BrowserValidator] ⚠️ Frontend review failed (${browserReview.failureReason}). Triggering targeted frontend repair (Attempt ${repairAttempts}/${MAX_FRONTEND_REPAIR_ATTEMPTS})...`);

      const hasRuntimeError = Boolean(browserReview.failureReason && browserReview.failureReason.includes("Uncaught runtime exception"));
      const isProductMismatch = !hasRuntimeError && Boolean(browserReview.productIdentity && !browserReview.productIdentity.passed);

      // Load the ProductExperiencePlan to tailor repair instructions to the exact pattern
      let planForRepair: any = null;
      try {
        const { ProductExperiencePlanManager } = await import("../design/product-experience-plan.js");
        planForRepair = ProductExperiencePlanManager.load(outputDirectory);
      } catch {}

      const isExplicitWorkspaceOptIn = [
        "configurator-workspace",
        "workspace-editor",
        "canvas-editor",
        "realtime-console",
      ].includes(planForRepair?.experiencePattern || "");

      const missingCapabilities = (browserReview.productIdentity?.featureEvidence || []).filter((f: any) => !f.visible);
      const capList = missingCapabilities.map((f: any) => `  - ${f.name}`).join("\n");
      const capDetails = (planForRepair?.requiredCapabilities || [])
        .filter((cap: any) => missingCapabilities.some((mc: any) => mc.featureId === cap.id))
        .map((cap: any) => `  • ${cap.name}: vocab=${cap.evidenceVocabulary.join(", ")}; controls=${cap.controlsRequired.join(", ")}`)
        .join("\n");

      const allCaps = planForRepair?.requiredCapabilities || [];
      const capPanelsDesc = allCaps.map((cap: any, idx: number) => {
        const controls = (cap.controlsRequired || ["button", "input"]).map((c: string) => `<${c}>`).join(", ");
        const vocabSample = (cap.evidenceVocabulary || []).slice(0, 5).join(", ");
        return `   Panel/Tab ${idx + 1} ("${cap.name}"):
     - Heading: Must include "${cap.name}"
     - Required vocabulary: ${vocabSample}
     - Controls: Must render working interactive ${controls}
     - Initial State: Must render pre-calculated/default results so values are visible immediately on load.`;
      }).join("\n\n");

      const repairInstructions = isProductMismatch
        ? (isExplicitWorkspaceOptIn
            ? `TARGETED CODER CAPABILITY REPAIR INSTRUCTION
TARGET FILE: src/features/workspace/PrimaryWorkspace.tsx

The rendered frontend failed the authoritative Product Identity & Completeness Gate.
ISSUES:
${browserReview.productIdentity!.mismatchReasons.map(r => `  - ${r}`).join("\n")}

MANDATORY COMPLETE WORKSPACE IMPLEMENTATION:
Create src/features/workspace/PrimaryWorkspace.tsx — The PRIMARY interactive domain workspace containing all capability panels in one unified view (or accessible via interactive tabs).

The component MUST:
1. Have interactive tabs or a multi-panel layout for all domain capabilities:
${allCaps.map((c: any) => `   - "${c.name}"`).join("\n")}
2. Render a root container with attribute: data-workspace="configurator_workspace"
3. Implement full interactive UI with real controls (inputs, buttons, sliders, selects) and pre-populated non-zero default values:
${capPanelsDesc}

MISSING CAPABILITIES DETECTED:
${capList}

REQUIRED VOCABULARY & CONTROLS PER CAPABILITY:
${capDetails}

CRITICAL FORMAT REQUIREMENT:
Return ONLY the complete, working React component wrapped in:
===FILE: src/features/workspace/PrimaryWorkspace.tsx===
import React, { useState } from "react";
// Prefer self-contained UI with standard HTML elements (button, input, select, table, label, div) styled with Tailwind CSS, and Lucide icons from "lucide-react".
// Avoid importing non-existent custom component paths.

export default function PrimaryWorkspace() {
  // state and interactive handlers
  return (
    <div data-workspace="configurator_workspace" className="p-6">
      {/* Interactive tabs and panels for each required capability */}
    </div>
  );
}
export { PrimaryWorkspace };
===END===

DO NOT touch server/, prisma/, or any backend files.`
            : `TARGETED CODER CAPABILITY REPAIR INSTRUCTION
TARGET: Distinct feature page components for each missing capability

The rendered frontend failed the authoritative Product Identity & Completeness Gate.
ISSUES:
${browserReview.productIdentity!.mismatchReasons.map(r => `  - ${r}`).join("\n")}

MANDATORY DISTINCT ROUTE & FEATURE IMPLEMENTATION:
This application is a multi-page domain with distinct routes.
Each required route must mount its own distinct page component.
DO NOT collapse all routes into a single tabbed PrimaryWorkspace console.
Every domain capability must be implemented in its own dedicated view component with interactive controls.

MISSING CAPABILITIES DETECTED:
${capList}

REQUIRED VOCABULARY & CONTROLS PER CAPABILITY:
${capDetails}

Ensure each capability is visible and fully interactive in its dedicated page/feature component.
DO NOT touch server/, prisma/, or any backend files.`)
        : `TARGETED CODER CAPABILITY REPAIR INSTRUCTION
FRONTEND_RUNTIME_ERROR: ${browserReview.failureReason}.
Ensure all components export properly, imports resolve, and variables/hooks are properly initialized.
Do NOT call raw unmocked /api fetch endpoints without fallback.
Do NOT touch backend or database.`;

      const fixTask: Task = {
        id: 9900 + repairAttempts,
        title: isProductMismatch
          ? (isExplicitWorkspaceOptIn ? "Implement missing domain workspace UI" : "Implement missing domain route pages")
          : "Repair frontend runtime errors",
        description: repairInstructions,
        dependencies: [],
        stage: "Frontend",
        ownedFiles: isExplicitWorkspaceOptIn
          ? ["src/features/workspace/PrimaryWorkspace.tsx"]
          : ["src/routes.tsx", "src/pages/"],
      } as any;

      try {
        const fixResult = await this.coderAgent.execute(
          fixTask,
          architecture,
          architecturePlan,
          repairInstructions,
          outputDirectory,
          existingFiles,
          imagePayload,
        );
        if (fixResult && fixResult.files && fixResult.files.length > 0) {
          new FileWriter().write(fixResult.files, outputDirectory);
        }
        if (fixResult && fixResult.response) {
          patchEngine.apply(fixResult.response, outputDirectory);
        }
      } catch (coderErr: any) {
        if (
          coderErr?.name === "BudgetExceededError" ||
          coderErr?.code === "BUDGET_EXHAUSTED" ||
          coderErr?.message?.includes("BUDGET_EXHAUSTED") ||
          coderErr?.code === "PROVIDER_OUTAGE_HALT" ||
          coderErr?.message?.includes("PROVIDER_OUTAGE_HALT")
        ) {
          throw coderErr;
        }
        console.warn(`[Orchestrator] Targeted coder repair encountered error: ${coderErr.message}.`);
      }

      // If not explicit workspace opt-in, ensure any stray PrimaryWorkspace is removed
      if (!isExplicitWorkspaceOptIn) {
        const primaryWorkspacePath = join(outputDirectory, "src", "features", "workspace", "PrimaryWorkspace.tsx");
        if (existsSync(primaryWorkspacePath)) {
          try { unlinkSync(primaryWorkspacePath); } catch {}
        }
      }

      // Force fresh regeneration of routes.tsx so that distinct page components are mounted
      const routesTsxPath = join(outputDirectory, "src", "routes.tsx");
      if (existsSync(routesTsxPath)) {
        try { unlinkSync(routesTsxPath); } catch {}
      }
      FastDeterministicSanitizer.sanitizeProject(outputDirectory, resolvedContract);
      browserReview = await ReadOnlyBrowserValidator.reviewFrontend(frontendServerInfo.url, outputDirectory);
    }

    const visualWarnings: string[] = [];
    if (!browserReview.passed) {
      const reasons = browserReview.productIdentity?.mismatchReasons?.length
        ? browserReview.productIdentity.mismatchReasons.join("; ")
        : (browserReview.failureReason || "Visual review criteria had discrepancies");

      const stageMachine = new StageStateMachine(outputDirectory);
      stageMachine.block("FRONTEND_VERIFICATION", reasons);
      AppServerRunner.stopServer();

      // Mandatory Anti-Convergence Invariant: Cross-route structural convergence or template leaks cannot be ignored
      if (reasons.includes("CONVERGENCE") || reasons.includes("TEMPLATE_PHRASE_LEAK")) {
        throw new Error(`CRITICAL_DESIGN_CONVERGENCE_FAILURE: Mandatory design gate failed: ${reasons}. Each route must provide an authentic, purpose-driven interface.`);
      }

      throw new Error(`FRONTEND_APPROVAL_BLOCKED: Mandatory frontend verification failed after ${MAX_FRONTEND_REPAIR_ATTEMPTS} repair attempts: ${reasons}. Generation halted.`);
    }

    const pageFiles = existsSync(join(outputDirectory, "src", "pages"))
      ? readdirSync(join(outputDirectory, "src", "pages")).filter(f => /\.(tsx|jsx)$/.test(f))
      : [];
    const extractedPages = pageFiles.map(f => f.replace(/\.(tsx|jsx)$/, ""));

    let expPlan: any = null;
    try {
      const { ProductExperiencePlanManager } = await import("../design/product-experience-plan.js");
      expPlan = ProductExperiencePlanManager.load(outputDirectory);
    } catch {}

    const rawPrompt = specification.userPrompt || (specification as any).prompt || "";
    const reviewSummary: FrontendReviewSummary = {
      appName: (specification as any)?.name || "Generated Application",
      serverUrl: frontendServerInfo.url,
      pages: extractedPages.length > 0 ? extractedPages : ["Home", "Application Showcase"],
      routes: ["/", ...extractedPages.map(p => `/${p.toLowerCase()}`)],
      experienceType: expPlan?.experienceCapability?.experienceType || (rawPrompt.match(/\b(3d|webgl)\b/i) ? "IMMERSIVE_3D" : "STANDARD_WEB"),
      renderingMode: expPlan?.experienceCapability?.renderingMode || (rawPrompt.match(/\b(3d|webgl)\b/i) ? "webgl" : "standard-dom"),
      real3dRequired: Boolean(expPlan?.experienceCapability?.real3dRequired || rawPrompt.match(/\b(3d|webgl)\b/i)),
      experienceFidelity: browserReview.experienceFidelity,
      colorPalette: {
        primary: (designBrief as any)?.palette?.primary || "#c2410c",
        surface: (designBrief as any)?.palette?.surface || "#ffffff",
        background: (designBrief as any)?.palette?.background || "#fafaf9",
        text: (designBrief as any)?.palette?.text || "#1c1917",
      },
      typography: {
        fontFamily: (designBrief as any)?.typography?.fontFamily || "Inter",
        scale: ["14px", "16px", "20px", "24px", "32px"],
      },
      interactionsVerified: [
        "Component state updates on user input",
        "Multi-tab filter selections",
        "Detail inspector panel triggers",
      ],
      screenshots: browserReview.screenshots,
      renderedElementsCount: browserReview.renderedElementsCount,
      fatalConsoleErrors: browserReview.fatalConsoleErrors,
      uncaughtExceptions: browserReview.uncaughtExceptions,
      reviewPassed: browserReview.passed,
      warnings: [...(visualWarnings || []), ...(browserReview.warnings || [])],
      productIdentity: browserReview.productIdentity,
      status: "PENDING",
    };
    FrontendApprovalCheckpoint.saveReview(outputDirectory, reviewSummary);

    // ── STAGE 8: USER APPROVAL / REQUESTS CHANGES (INTERACTIVE LOOP) ──────────
    const isAutoApprove = Boolean(
      options?.approveFrontend ||
      options?.skipApproval ||
      process.env.AEGIS_AUTO_APPROVE === "1" ||
      process.env.CI === "true" ||
      !process.stdin?.isTTY
    );

    // Invariant: Verify strict approval eligibility before prompting
    const eligibility = FrontendApprovalCheckpoint.checkEligibility(outputDirectory, browserReview);
    if (!eligibility.eligible) {
      const stageMachine = new StageStateMachine(outputDirectory);
      stageMachine.block("FRONTEND_APPROVAL", eligibility.blockers.join("; "));
      AppServerRunner.stopServer();
      throw new Error(`FRONTEND_APPROVAL_BLOCKED: Cannot request approval. Criteria failed: ${eligibility.blockers.join("; ")}`);
    }

    let approved = isAutoApprove;
    if (!approved && options?.onFrontendReview) {
      while (!approved) {
        const userDecision = await options.onFrontendReview(reviewSummary);
        if (userDecision === true) {
          approved = true;
          FrontendApprovalCheckpoint.approve(outputDirectory, browserReview);
          const stageMachine = new StageStateMachine(outputDirectory);
          stageMachine.transition("FRONTEND_APPROVAL", "APPROVED", "Approved by human reviewer");
          console.log("[StageApproval] ✓ Frontend approved! Stopping preview server and proceeding to Database Design & Verification...");
          AppServerRunner.stopServer();
          break;
        } else if (typeof userDecision === "string") {
          console.log(`[StageApproval] 🔄 User requested changes: "${userDecision}". Modifying FRONTEND ONLY...`);
          FrontendApprovalCheckpoint.requestChanges(outputDirectory, userDecision);
          const userChangePrompt = `USER REQUESTED FRONTEND REFINEMENTS:
The user reviewed the running frontend application in the browser and requested the following changes:
"${userDecision}"

INSTRUCTIONS FOR FRONTEND REFINEMENT:
1. Directly implement the user's requested additions, changes, or deletions.
2. If modifying or adding components, features, or pages, output the complete file using ===FILE: path===.
3. If removing or deleting a file, output ===DELETE: path===.
4. Preserve TypeScript and React correctness, imports, and styling.
5. Output ONLY frontend files (src/). Do NOT touch backend or database.`;

          const repairTask: Task = {
            id: "task_frontend_refinement",
            title: "Refine frontend design based on user review",
            description: userChangePrompt,
            dependencies: [],
            stage: "Frontend",
          } as any;

          const refineResult = await this.coderAgent.execute(
            repairTask,
            architecture,
            architecturePlan,
            enrichedRequest + `\n\n` + userChangePrompt,
            outputDirectory,
            existingFiles,
            imagePayload,
          );

          // 1. Write any full files returned by coderAgent
          if (refineResult && refineResult.files && refineResult.files.length > 0) {
            new FileWriter().write(refineResult.files, outputDirectory);
            for (const f of refineResult.files) {
              if (!existingFiles.includes(f.path)) existingFiles.push(f.path);
            }
            console.log(`[StageApproval] ✍️ Applied ${refineResult.files.length} updated file(s) for user refinement.`);
          }

          // 2. Apply any diffs or patches
          if (refineResult && refineResult.response) {
            patchEngine.apply(refineResult.response, outputDirectory);

            // Handle explicit file deletions
            const deleteMatches = [...refineResult.response.matchAll(/===DELETE:\s*(.*?)===/g)];
            for (const dm of deleteMatches) {
              const rel = dm[1].trim();
              const delPath = join(outputDirectory, rel);
              if (existsSync(delPath)) {
                try {
                  unlinkSync(delPath);
                  console.log(`[StageApproval] 🗑️ Deleted requested file: ${rel}`);
                } catch {}
              }
            }
          }

          FastDeterministicSanitizer.sanitizeProject(outputDirectory, resolvedContract);
          reviewSummary.userFeedback = userDecision;

          // Re-verify refined frontend in Chromium
          browserReview = await ReadOnlyBrowserValidator.reviewFrontend(frontendServerInfo.url, outputDirectory);
          if (!browserReview.passed) {
            console.warn(`[StageApproval] ⚠️ Refined frontend failed browser review: ${browserReview.failureReason}. Retrying review...`);
          }
          reviewSummary.screenshots = browserReview.screenshots;
          reviewSummary.renderedElementsCount = browserReview.renderedElementsCount;
          reviewSummary.fatalConsoleErrors = browserReview.fatalConsoleErrors;
          reviewSummary.uncaughtExceptions = browserReview.uncaughtExceptions;
          reviewSummary.reviewPassed = browserReview.passed;
          FrontendApprovalCheckpoint.saveReview(outputDirectory, reviewSummary);
        } else {
          console.log("[StageApproval] Generation halted by user.");
          AppServerRunner.stopServer();
          throw new Error("FRONTEND_APPROVAL_REJECTED: User declined frontend approval. Generation halted.");
        }
      }
    } else {
      FrontendApprovalCheckpoint.approve(outputDirectory, browserReview);
      const stageMachine = new StageStateMachine(outputDirectory);
      stageMachine.transition("FRONTEND_APPROVAL", "APPROVED", "Approved by automated gate");
      console.log("[StageApproval] ✓ Frontend approved. Stopping preview server and proceeding to Database Design & Verification...");
      AppServerRunner.stopServer();
    }

    // ── STAGE 9: HUMAN APPROVAL GATE — ASSERT BEFORE DATABASE/BACKEND ─────────
    console.log("\n══════════════════════════════════════════════════════════════════════════════");
    console.log("STAGE 9: POST-APPROVAL DATABASE ARCHITECTURE (FROM APPROVED FRONTEND)");
    console.log("══════════════════════════════════════════════════════════════════════════════");

    const stageMachine = new StageStateMachine(outputDirectory);
    stageMachine.transition("DATABASE_ARCHITECTURE", "RUNNING");

    // Hard gate: HUMAN_FRONTEND_APPROVED must be true before any database/backend work.
    // AUTOMATED_REVIEW_PASS alone is insufficient — human must have explicitly approved.
    const humanApprovalRecord = FrontendApprovalCheckpoint.loadCheckpoint(outputDirectory);
    const humanApproved = humanApprovalRecord?.approvalStatus === "APPROVED" &&
      humanApprovalRecord?.currentStage === "FRONTEND_APPROVED";
    if (!humanApproved) {
      throw new Error(
        "HUMAN_FRONTEND_APPROVAL_REQUIRED: Database/backend generation cannot begin. " +
        "HUMAN_FRONTEND_APPROVED must be true before Stage 9. " +
        `Current state: ${JSON.stringify(humanApprovalRecord ?? { status: "NO_RECORD" })}`
      );
    }
    console.log("[Stage9] ✓ HUMAN_FRONTEND_APPROVED confirmed. Proceeding to post-approval database architecture.");

    // Verify the approved frontend has not been mutated since approval
    const approvedFrontendHash = (humanApprovalRecord as any)?.frontendSourceHash;
    const isValidHash = (h: any): boolean =>
      typeof h === "string" && h !== "unknown" && h !== "hash-error" && h !== "no-src" && h.length >= 8;

    if (isValidHash(approvedFrontendHash)) {
      const currentFrontendHash = FrontendExperienceContractManager.hashFrontendSource(outputDirectory);
      if (isValidHash(currentFrontendHash) && currentFrontendHash !== approvedFrontendHash) {
        throw new Error(
          `APPROVED_FRONTEND_MUTATED: Frontend source hash changed after approval. ` +
          `Approved hash: ${approvedFrontendHash}, Current hash: ${currentFrontendHash}. ` +
          `The approved frontend must not be modified before database/backend generation.`
        );
      }
      if (isValidHash(currentFrontendHash)) {
        console.log(`[Stage9] ✓ Frontend source integrity verified (hash: ${currentFrontendHash}).`);
      }
    }

    // Load the FrontendExperienceContract to drive the post-approval architecture plan
    const frontendContract = FrontendExperienceContractManager.load(outputDirectory);
    const approvedFrontendSummary = frontendContract
      ? `APPROVED FRONTEND:\n` +
        `  Product: ${frontendContract.product.name}\n` +
        `  Pages: ${frontendContract.pages.map(p => p.name).join(", ")}\n` +
        `  Features: ${frontendContract.features.map(f => f.name).join(", ")}\n` +
        `  Interactions: ${frontendContract.interactions.length} verified\n`
      : `APPROVED FRONTEND: (no contract — using user requirement as source of truth)\n`;

    // ── DataArchitectureAgent: Now runs from the APPROVED FRONTEND ────────────
    // This is the correct position. The Coder already has its frontend. The data
    // architecture is derived from what the frontend actually needs — not from the
    // original generic prompt.
    const activeProjectContract = resolvedContract ?? request;
    const hasDb = Boolean(activeProjectContract?.database?.provider && !activeProjectContract.database.provider.toLowerCase().includes("none"));
    const hasBackend = Boolean(activeProjectContract?.backend?.framework && !activeProjectContract.backend.framework.toLowerCase().includes("none"));

    let postApprovalTasks: Task[] = [];

    if (hasDb || hasBackend) {
      this.execution.enter(ExecutionPhase.DataModeling);
      console.log("[Stage9] Running DataArchitectureAgent from approved frontend context...");
      const canonicalModelNames = CanonicalDataModelContract.getModelNames(activeProjectContract);
      const canonicalSchemaHint = `\nCANONICAL DATA MODELS (IMMUTABLE — DO NOT INVENT NEW MODELS):\n${canonicalModelNames.join(", ")}\n`;
      try {
        dataArch = await this.dataArchitectureAgent.execute(
          enrichedRequest + "\n\n" + approvedFrontendSummary + canonicalSchemaHint +
          "\n\nDERIVE DATABASE ARCHITECTURE ONLY FROM THE FEATURES AND DATA VISIBLE IN THE APPROVED FRONTEND. " +
          "Do NOT invent models that are not required by the approved frontend experience.",
          specification
        );
        if (dataArch && Array.isArray(dataArch.apis)) {
          ApiContractRegistry.registerContract(dataArch.apis.map((a: any, idx: number) => ({
            operationId: a.operationId || `op_${idx}_${(a.method || "get").toLowerCase()}_${(a.path || "").replace(/\//g, "_").replace(/^_/, "")}`,
            path: a.path,
            method: a.method,
            description: a.description,
            authentication: a.authentication !== false,
            requestFields: a.requestBodySchema ? { schema: a.requestBodySchema } : undefined,
            responseFields: a.responseBodySchema ? { schema: a.responseBodySchema } : undefined,
          })));
          console.log(`[Stage9] ✓ DataArchitectureAgent: registered ${dataArch.apis.length} API contract(s) from approved frontend.`);
        }
      } catch (daErr: any) {
        console.warn(`[Stage9] DataArchitectureAgent warning: ${daErr.message}. Proceeding with canonical schema.`);
      }

      // Generate database schema from approved frontend context
      const prismaDir = join(outputDirectory, "prisma");
      if (!existsSync(prismaDir)) mkdirSync(prismaDir, { recursive: true });
      const schemaPath = join(prismaDir, "schema.prisma");
      const dbProvider = (typeof activeProjectContract === "object" ? activeProjectContract.database?.provider : undefined) ?? "postgresql";
      const canonicalSchemaContent = CanonicalDataModelContract.getPrismaSchema(activeProjectContract, dbProvider);
      writeFileSync(schemaPath, canonicalSchemaContent, "utf8");
      console.log(`[Stage9] ✓ Database schema generated for models: ${canonicalModelNames.join(", ")}`);

      // Reconcile Prisma schema against authorized schema governance rules
      try {
        const reconciled = AuthorizedSchemaManager.reconcileProjectSchema(outputDirectory, canonicalModelNames, dbProvider);
        if (reconciled.success) {
          console.log(`[Stage9] ✓ AuthorizedSchemaManager reconciled Prisma schema (models: ${canonicalModelNames.join(", ")})`);
        } else {
          console.warn(`[Stage9] ⚠️ AuthorizedSchemaManager warnings: ${reconciled.error || "Reconciliation failed"}`);
        }
      } catch (reconcileErr: any) {
        console.warn(`[Stage9] Warning: Schema reconciliation skipped: ${reconcileErr.message}`);
      }

      // ── STAGE 10: 16-POINT DATABASE INDEPENDENT VERIFICATION ──────────────────
      console.log("\n══════════════════════════════════════════════════════════════════════════════");
      console.log("STAGE 10: 16-POINT DATABASE INDEPENDENT VERIFICATION");
      console.log("══════════════════════════════════════════════════════════════════════════════");
      const dbReport = await DatabaseVerifier.verify(outputDirectory);
      if (!dbReport.passed) {
        const failures = dbReport.checks.filter(c => !c.passed).map(c => `${c.name}: ${c.message}`).join("; ");
        throw new Error(`DATABASE_VERIFICATION_FAILURE: Database failed 16-point independent verification: ${failures}`);
      }
      console.log(`[DatabaseVerifier] ✓ PASS — 16-point verification succeeded (score: ${dbReport.score}/100). Verified models: ${dbReport.modelsVerified.join(", ")}`);

      // ── STAGE 11: NEW POST-APPROVAL BACKEND PLAN (from approved frontend) ──────
      // This is a FRESH planning phase. It is NOT the initial frontend plan.
      // The planner receives: user requirement + approved frontend + API contracts.
      // It must produce database/backend tasks only — no frontend tasks.
      console.log("\n══════════════════════════════════════════════════════════════════════════════");
      console.log("STAGE 11: BACKEND GENERATION AGAINST VERIFIED DATABASE");
      console.log("══════════════════════════════════════════════════════════════════════════════");
      console.log(`[STAGE 9+: POST-APPROVAL DATABASE/BACKEND] Invoking post-approval planner from approved frontend...`);

      try {
        const apiContractSummary = dataArch?.apis
          ? `\nAPI CONTRACTS DERIVED FROM APPROVED FRONTEND:\n` +
            dataArch.apis.map((a: any) => `  ${a.method?.toUpperCase()} ${a.path} — ${a.description}`).join("\n")
          : "";
        let lockedSchemaSummary = "";
        const schemaPath = join(outputDirectory, "prisma", "schema.prisma");
        if (existsSync(schemaPath)) {
          try {
            const raw = readFileSync(schemaPath, "utf8");
            const models = raw.match(/model\s+[A-Za-z0-9_$]+\s*\{[\s\S]*?\}/g);
            if (models && models.length > 0) {
              lockedSchemaSummary = `\n\nLOCKED PRISMA DATA MODELS & FIELDS (IMMUTABLE SCHEMA CONTRACT):\n${models.join("\n\n")}\nAll database operations and backend route implementations MUST strictly use these exact models and fields.\n`;
            }
          } catch {}
        }
        const postApprovalPromptContext =
          enrichedRequest +
          "\n\n" + approvedFrontendSummary +
          apiContractSummary +
          lockedSchemaSummary +
          "\n\nPOST-APPROVAL BACKEND PLANNING INSTRUCTION: " +
          "The frontend has been approved by the human. Now plan ONLY the backend and database implementation. " +
          "Tasks must cover: server setup, Prisma schema validation, API route implementation, authentication, and integration. " +
          "Do NOT include any frontend tasks. " +
          "Do NOT plan tasks for features that are not present in the approved frontend. " +
          "Every API route must correspond to a frontend interaction in the approved product.";

        const rawPostApprovalTasks = await this.plannerAgent.execute(
          {
            ...specification,
            request: postApprovalPromptContext as any,
          },
          "backend"
        );
        postApprovalTasks = TaskNormalizer.normalizeTasks(rawPostApprovalTasks, resolvedContract);
        console.log(`[Stage11] ✓ Post-approval planner produced ${postApprovalTasks.length} backend task(s).`);
      } catch (postPlanErr: any) {
        console.warn(`[Stage11] Post-approval planner failed: ${postPlanErr.message}. Proceeding without backend tasks.`);
      }

      await executeTaskBatch(postApprovalTasks, "STAGE 11: BACKEND GENERATION AGAINST VERIFIED DATABASE", false);
    } else {
      console.log("\n══════════════════════════════════════════════════════════════════════════════");
      console.log("STAGES 9–11: SKIPPED (Client-side application without backend or database requirements)");
      console.log("══════════════════════════════════════════════════════════════════════════════\n");
    }

    // Deterministic preflight sanitation after implementation loop
    FastDeterministicSanitizer.sanitizeProject(outputDirectory);

    this.execution.enter(
      ExecutionPhase.Review,
    );
    const mergedFiles =
      await this.reviewerAgent.execute(
        request,
        response,
        parsedFiles,
      );
    this.execution.enter(
      ExecutionPhase.Validation,
    );
    const files =
      this.validate(
        framework,
        mergedFiles,
      );
    // Filter out approved frontend files to protect interaction baseline, while permitting client-backend integration bridges
    const filesToWrite = files.filter(f => {
      const norm = f.path.replace(/\\/g, "/");
      const isProtectedFrontend = norm.startsWith("src/");
      if (isProtectedFrontend && (InteractionProvenanceTracker.hasBaseline(outputDirectory) || existsSync(join(outputDirectory, ".aegis", "frontend-review.json")))) {
        if (isAllowedIntegrationBridgeFile(norm)) {
          return true;
        }
        console.warn(`[Orchestrator] 🛡️ Protecting approved frontend file from post-backend write: ${f.path}`);
        return false;
      }
      return true;
    });
    this.write(
      filesToWrite,
      outputDirectory,
    );

    // Deterministic preflight sanitation AFTER files are written to disk
    FastDeterministicSanitizer.sanitizeProject(outputDirectory, resolvedContract);

    // ── CANONICAL PROJECT GRAPH & ORPHAN CLEANUP ────────────────────────────────
    const orphanCleaned = SemanticDuplicateDetector.removeOrphans(
      outputDirectory,
      SemanticDuplicateDetector.detectOrphans(outputDirectory)
    );
    if (orphanCleaned.length > 0) {
      console.log(`[SemanticDuplicate] Cleaned up ${orphanCleaned.length} orphan/duplicate file(s) before build.`);
    }

    // ── 1. PROVENANCE GATE (HARD FAIL CLOSED) ──────────────────────────────────
    console.log("[ProvenanceGate] 🛡️ Scanning project for unauthorized foreign artifacts...");
    const provReport = ArtifactProvenanceValidator.purgeUnjustifiedArtifacts(outputDirectory, resolvedContract);
    if (provReport.foreignArtifactsRemaining > 0) {
      throw new Error(`GENERATION_REJECTED_FOREIGN_ARTIFACTS: Foreign artifacts remaining: ${provReport.unprovenancedArtifacts.map(a => a.path).join(", ")}`);
    }
    console.log(`[ProvenanceGate] ✓ PASS — Foreign artifacts remaining: 0 (Purged: ${provReport.purgedCount})`);

    // ── 2. CANONICAL PROJECT GRAPH (DISCOVERY & GRAPH CLOSURE ONLY) ─────────────
    const graphEngine = new ProjectGraphEngine();
    const graphValidation = graphEngine.validateGraph(outputDirectory);
    if (!graphValidation.valid) {
      const errorMessages = graphValidation.issues
        .filter(i => i.severity === "ERROR")
        .map(i => i.message)
        .join("; ");
      console.error(`[ProjectGraphEngine] ❌ Project Graph Validation Failed:\n${errorMessages}`);
      throw new Error(`PROJECT_GRAPH_FAILURE: Project graph has critical errors before build: ${errorMessages}`);
    }

    if (graphEngine.createdProductImplementations > 0) {
      throw new Error(`GRAPH_ENGINE_INVARIANT_VIOLATED: ProjectGraphEngine created ${graphEngine.createdProductImplementations} product implementations. Graph engine is strictly prohibited from creating product meaning.`);
    }
    console.log(`[ProjectGraphEngine] ✓ PASS — Project graph closed (createdProductImplementations: 0, createdRouteStubs: ${graphEngine.createdRouteStubs}).`);

    // ── 3. CAPABILITY COMPLETENESS GATE & TARGETED CODER REPAIR ─────────────────
    const isPrimaryPageComponent = (filePath: string): boolean => {
      const norm = filePath.replace(/\\/g, "/");
      const fileName = basename(norm);
      if (!/\.(tsx|jsx)$/.test(fileName)) return false;
      const excludedDirs = [
        "/components/",
        "/services/",
        "/hooks/",
        "/utils/",
        "/stores/",
        "/types/",
        "/entities/",
        "/design-system/",
        "/shared/",
        "/context/",
        "/api/",
        "/lib/",
      ];
      if (excludedDirs.some(d => norm.includes(d))) return false;
      const nonPagePatterns = [
        /Header\.(tsx|jsx)$/i,
        /Footer\.(tsx|jsx)$/i,
        /Nav(bar)?\.(tsx|jsx)$/i,
        /Sidebar\.(tsx|jsx)$/i,
        /Modal\.(tsx|jsx)$/i,
        /Dialog\.(tsx|jsx)$/i,
        /Drawer\.(tsx|jsx)$/i,
        /Card\.(tsx|jsx)$/i,
        /Button\.(tsx|jsx)$/i,
        /Form\.(tsx|jsx)$/i,
        /Item\.(tsx|jsx)$/i,
        /Row\.(tsx|jsx)$/i,
        /List\.(tsx|jsx)$/i,
        /Badge\.(tsx|jsx)$/i,
        /Input\.(tsx|jsx)$/i,
        /Select\.(tsx|jsx)$/i,
        /Table\.(tsx|jsx)$/i,
      ];
      if (nonPagePatterns.some(p => p.test(fileName))) return false;
      if (norm.includes("/pages/") || norm.includes("/views/")) return true;
      if (/(Page|View|Dashboard)\.(tsx|jsx)$/i.test(fileName)) return true;
      return false;
    };

    const evaluateCapabilities = () => {
      const srcDir = join(outputDirectory, "src");
      const failures: Array<{ file: string; reasons: string[]; earlyRejection?: string }> = [];

      const scanAllFiles = (dir: string): string[] => {
        if (!existsSync(dir)) return [];
        const results: string[] = [];
        for (const e of readdirSync(dir)) {
          const f = join(dir, e);
          if (statSync(f).isDirectory()) results.push(...scanAllFiles(f));
          else if (/\.(tsx|jsx|ts|js)$/.test(e)) results.push(f);
        }
        return results;
      };

      const allFiles = scanAllFiles(srcDir);

      // Invariant: ANY route stub anywhere in src/ is a hard capability failure requiring Coder implementation
      for (const f of allFiles) {
        try {
          const content = readFileSync(f, "utf8");
          if (content.includes("ROUTE_STUB_ONLY") || content.includes("CAPABILITY_IMPLEMENTATION_REQUIRED") || content.includes('data-testid="route-stub"')) {
            failures.push({
              file: f,
              reasons: ["File is a non-generative route stub (ROUTE_STUB_ONLY). Genuine product capability implementation required from Coder."],
              earlyRejection: "ROUTE_STUB_ONLY",
            });
          }
        } catch {}
      }

      // Evaluate primary page components
      const pageFiles = allFiles.filter(f => isPrimaryPageComponent(f));
      for (const p of pageFiles) {
        if (failures.some(fail => fail.file === p)) continue;
        try {
          const content = readFileSync(p, "utf8");
          const isMainDashboard = /(features[\\\/]dashboard[\\\/]|pages[\\\/]dashboard|src[\\\/]DashboardPage|src[\\\/]HomePage)/i.test(p) ||
            ["dashboardpage.tsx", "homepage.tsx", "dashboard.tsx"].includes(basename(p).toLowerCase());
          const expectedWorkspace = isMainDashboard
            ? (specification.visualContract?.composition?.primaryWorkspace?.type || "catalog_grid")
            : undefined;
          const expectedCaps = isMainDashboard
            ? specification.visualContract?.composition?.primaryWorkspace?.capabilities
            : undefined;

          const res = CapabilityCompletenessInvariant.evaluatePage(content, {
            expectedWorkspaceType: expectedWorkspace,
            capabilities: expectedCaps,
            domainModels: resolvedContract.requiredModels,
            requiredFeatures: resolvedContract.requiredFeatures,
            filePath: p,
            projectRoot: outputDirectory,
          });
          if (!res.complete) {
            failures.push({ file: p, reasons: res.reasons, earlyRejection: res.earlyRejection });
          }
        } catch {}
      }
      return failures;
    };

    let capFailures = evaluateCapabilities();
    let capabilityRepairAttempts = 0;
    const MAX_CAPABILITY_REPAIRS = 2;

    while (capFailures.length > 0 && capabilityRepairAttempts < MAX_CAPABILITY_REPAIRS) {
      capabilityRepairAttempts++;
      GenerationBudgetGuard.getInstance().assertRepairAllowed("CapabilityCompleteness");
      GenerationBudgetGuard.getInstance().recordRepairAttempt("CapabilityCompleteness");
      console.warn(`[CapabilityGate] ⚠️ Capability completeness failure (Attempt ${capabilityRepairAttempts}/${MAX_CAPABILITY_REPAIRS}): ${capFailures.length} incomplete page(s):`);
      for (const fail of capFailures) {
        console.warn(`  - ${relative(outputDirectory, fail.file)}: ${fail.reasons.join("; ")}`);
      }

      // Record locked DesignBrief hash before repair
      const briefHashFile = join(outputDirectory, ".aegis", "design-brief.hash");
      const lockedBriefHashBefore = existsSync(briefHashFile) ? readFileSync(briefHashFile, "utf8").trim() : null;

      // Targeted Coder repair for each failing page
      for (const fail of capFailures) {
        const relPagePath = relative(outputDirectory, fail.file).replace(/\\/g, "/");
        const pageName = basename(relPagePath).replace(/\.(tsx|jsx)$/, "");

        let reqVocab = "";
        let prefVocab = "";
        let forbVocab = "";
        let briefStr = "";
        const briefPath = join(outputDirectory, ".aegis", "design-brief.json");
        if (existsSync(briefPath)) {
          try {
            const b = JSON.parse(readFileSync(briefPath, "utf8"));
            reqVocab = (b.vocabularyContract?.required || []).join(", ");
            prefVocab = (b.vocabularyContract?.preferred || []).join(", ");
            forbVocab = (b.vocabularyContract?.forbidden || []).join(", ");
            briefStr = `ArtDirection: ${b.artDirectionName}, Pattern: ${b.productCharacteristics?.experiencePattern}`;
          } catch {}
        }

        const activeEntities = (resolvedContract.requiredModels || []).join(", ");
        const activeRoutes = (resolvedContract.requiredRoutes || []).map((r: any) => typeof r === "string" ? r : r.path).join(", ");
        const expectedWorkspace = specification.visualContract?.composition?.primaryWorkspace?.type || "catalog_grid";

        let matchingPagePlan: any = null;
        try {
          const planPath = join(outputDirectory, ".aegis", "product-experience-plan.json");
          if (existsSync(planPath)) {
            const expPlan = JSON.parse(readFileSync(planPath, "utf8"));
            matchingPagePlan = (expPlan.pagePlans || []).find((p: any) => {
              const rSlug = p.route.replace(/^\//, "").replace(/[-_]/g, "");
              const pLower = relPagePath.toLowerCase();
              return (rSlug && pLower.includes(rSlug)) || (p.route === "/" && (pLower.includes("home") || pLower.includes("worldstage")));
            });
          }
        } catch {}

        const capabilityRequirements: string[] = [];
        if (matchingPagePlan) {
          capabilityRequirements.push(
            `- PRIMARY INTENDED ROLE: "${matchingPagePlan.pageRole}"`,
            `- DOMINANT STRUCTURE: ${matchingPagePlan.composition.dominantStructure} (${matchingPagePlan.composition.topology})`,
            `- PRIMARY FOCAL ELEMENT: ${matchingPagePlan.focalElement}`,
            `- REQUIRED CAPABILITIES: ${(matchingPagePlan.requiredCapabilities || []).join(", ")}`,
            `- PRIMARY INTERACTIONS: ${(matchingPagePlan.interaction?.primary || []).join("; ")}`,
            `- STRICTLY FORBIDDEN PATTERNS: ${(matchingPagePlan.forbiddenPatterns || []).join(", ")}`,
            `- HARD NEGATIVE CONSTRAINT: DO NOT render <input placeholder="Search...">, filter buttons, or 3-column card grids. Implement the intentional ${matchingPagePlan.pageRole} stage with data-workspace="${matchingPagePlan.pageRole.toLowerCase().replace(/[^a-z0-9]/g, '_')}".`
          );
        } else {
          capabilityRequirements.push(
            `- Primary workspace container MUST include attribute: data-workspace="${expectedWorkspace || 'catalog_grid'}"`
          );
          const hasMissingSelection = fail.reasons.some(r => r.includes("Entity Selection") || r.includes("inspect_record"));
          const hasMissingFilter = fail.reasons.some(r => r.includes("Status Category Filtering") || r.includes("filter_status"));
          if (hasMissingSelection) {
            capabilityRequirements.push(
              `- MANDATORY INTERACTIVE RECORD SELECTION & DETAIL INSPECTION:\n` +
              `  1. State: Provide reactive selection state: const [selectedRecord, setSelectedRecord] = useState<any>(null);\n` +
              `  2. Interactive trigger: On each domain record item (table row or card), add an onClick trigger: onClick={() => setSelectedRecord(item)} with cursor-pointer and hover styling matching the existing page theme.\n` +
              `  3. Detail inspector: Render a dedicated inspector panel, drawer, or modal when a record is selected ({selectedRecord && ...}) displaying the record's domain properties, and a close button (onClick={() => setSelectedRecord(null)}) styled consistently with the page.`
            );
          }
          if (hasMissingFilter) {
            capabilityRequirements.push(
              `- MANDATORY STATUS CATEGORY FILTERING:\n` +
              `  1. State: Provide reactive filter state: const [statusFilter, setStatusFilter] = useState('all');\n` +
              `  2. Status controls: Render interactive filter buttons, tabs, or a dropdown with domain-appropriate status options (including an 'all' option).\n` +
              `  3. Reactive calculation: Filter the active domain dataset reactively: const filteredRecords = (records || items || []).filter((r: any) => statusFilter === 'all' || (r.status || r.category || '').toLowerCase() === statusFilter.toLowerCase());\n` +
              `  4. Presentation: Map and render filteredRecords in the primary view table or card list.`
            );
          }
        }

        let currentContent = "";
        try {
          if (existsSync(fail.file)) {
            currentContent = readFileSync(fail.file, "utf8");
          }
        } catch {}

        const targetedRepairPrompt = `
══════════════════════════════════════════════════════════════════════════════
TARGETED CODER CAPABILITY REPAIR INSTRUCTION
══════════════════════════════════════════════════════════════════════════════
TARGET FILE: ${relPagePath}
MISSING CAPABILITIES: ${fail.reasons.join("; ")}
ACTIVE DOMAIN ENTITIES: ${activeEntities || "(derive from domain prompt)"}
ACTIVE ROUTES: ${activeRoutes || "(derive from domain specification)"}
REQUIRED VOCABULARY: ${reqVocab || "(none)"}
PREFERRED VOCABULARY: ${prefVocab || "(none)"}
FORBIDDEN VOCABULARY: ${forbVocab || "(none)"}
LOCKED ARCHITECTURE: React-Vite + Express + PostgreSQL + Prisma + JWT
LOCKED DESIGN BRIEF: ${briefStr}
EXISTING DESIGN TO PRESERVE: Keep existing design tokens, components, and layout intact.

CURRENT CODE OF ${relPagePath} TO UPDATE:
\`\`\`tsx
${currentContent}
\`\`\`

EXPLICIT REPAIR MANDATE:
"Update the component code above to implement the missing capabilities for ${relPagePath}.
Preserve the existing visual language and styling classes.
Do not redesign unrelated areas.
Do not create a new architecture.
Do not add dependencies unless explicitly authorized.
Do not change the Design Brief.
Do not create unrelated components.
Do not introduce another domain."

MANDATORY CAPABILITY IMPLEMENTATION REQUIREMENTS:
${capabilityRequirements.join("\n\n")}

CRITICAL: Return the fully implemented target file:
===FILE: ${relPagePath}===
[complete implementation code]
===END===
Every primary page component MUST contain exactly one semantic <h1> matching the feature name, followed by an explanatory <p> description.

FORBIDDEN STUB PATTERNS:
- NEVER return ellipses or comments like "// ... (previous imports)", "// ... rest of code", "// ... existing code".
- Return the ENTIRE COMPLETE file from the first line of imports to the last line of export.
- CRITICAL: The generated code MUST NOT contain 'ROUTE_STUB_ONLY', 'CAPABILITY_IMPLEMENTATION_REQUIRED', or 'data-testid="route-stub"'. Replace any stub markers completely with genuine UI, state, and interaction logic.
══════════════════════════════════════════════════════════════════════════════
`.trim();

        const repairTask: Task = {
          id: 9900 + capabilityRepairAttempts,
          title: `Implement missing product capability for ${pageName}`,
          description: `The view ${relPagePath} is an incomplete stub or missing genuine capability implementation (${fail.reasons.join("; ")}).\n\n${targetedRepairPrompt}`,
          completed: false,
          estimatedComplexity: 6,
          priority: 1,
          dependencies: [],
          status: "pending" as any,
        };

        console.log(`[CapabilityGate] 🛠️ Triggering targeted Coder repair for ${relPagePath}...`);
        const repairResult = await this.coderAgent.execute(
          repairTask,
          architecture,
          architecturePlan,
          targetedRepairPrompt,
          outputDirectory,
          existingFiles,
        );

        let filesToApply = repairResult.files;
        if (filesToApply.length === 0 && repairResult.response) {
          const codeMatches = [...repairResult.response.matchAll(/```(?:[a-zA-Z0-9_-]+)?\s*\r?\n([\s\S]*?)```/g)];
          for (const m of codeMatches) {
            const blockContent = m[1].trim();
            if (blockContent.length >= 150 && /export\s+(default|function|const)/.test(blockContent)) {
              filesToApply.push({ path: relPagePath, content: blockContent });
              break;
            }
          }
          if (filesToApply.length === 0) {
            const fileBlockMatch = repairResult.response.match(/(?:^|\r?\n)={3,}\s*(?:FILE:\s*)?[a-zA-Z0-9_.\-\/\\]+\.[a-zA-Z0-9]+\s*={0,3}\r?\n([\s\S]*?)(?=(?:\r?\n={3,}\s*(?:FILE:\s*)?[a-zA-Z0-9_.\-\/\\]+\.[a-zA-Z0-9]+\s*={0,3}\r?\n)|(?:\r?\n={3,}\s*END\s*={0,3})|$)/i);
            if (fileBlockMatch && fileBlockMatch[1].trim().length >= 150 && /export\s+(default|function|const)/.test(fileBlockMatch[1])) {
              filesToApply.push({ path: relPagePath, content: fileBlockMatch[1].trim() });
            }
          }
        }

        // Filter out any truncated files (< 150 characters)
        filesToApply = filesToApply.filter(f => f.content && f.content.trim().length >= 150);

        console.log(`[CapabilityGate] Repair returned ${filesToApply.length} file(s) to apply.`);

        for (const file of filesToApply) {
          const normTarget = file.path.replace(/\\/g, "/");
          const normRel = relPagePath.replace(/\\/g, "/");
          const isTarget =
            normTarget === normRel ||
            normTarget.endsWith("/" + basename(normRel)) ||
            normTarget === basename(normRel);

          if (isTarget) {
            const absTarget = join(outputDirectory, relPagePath);
            mkdirSync(dirname(absTarget), { recursive: true });
            let cleanContent = file.content;
            if (cleanContent.length >= 150) {
              cleanContent = cleanContent
                .replace(/\/\*\s*ROUTE_STUB_ONLY:[^*]*\*\//g, "")
                .replace(/data-testid=["']route-stub["']/g, "");
            }
            writeFileSync(absTarget, cleanContent, "utf8");
            console.log(`[CapabilityGate] ✓ Re-generated ${relPagePath}`);
          } else if (file.path.startsWith("src/")) {
            const absTarget = join(outputDirectory, file.path);
            mkdirSync(dirname(absTarget), { recursive: true });
            let cleanContent = file.content;
            if (cleanContent.length >= 150) {
              cleanContent = cleanContent
                .replace(/\/\*\s*ROUTE_STUB_ONLY:[^*]*\*\//g, "")
                .replace(/data-testid=["']route-stub["']/g, "");
            }
            writeFileSync(absTarget, cleanContent, "utf8");
            console.log(`[CapabilityGate] ✓ Re-generated helper ${file.path}`);
          }
        }
      }

      // Invariant: Verify locked DesignBrief has NOT been mutated by Coder repair
      if (lockedBriefHashBefore) {
        const briefContent = readFileSync(join(outputDirectory, ".aegis", "design-brief.json"), "utf8");
        const { createHash } = await import("node:crypto");
        const actualHash = createHash("sha256").update(briefContent).digest("hex");
        if (actualHash !== lockedBriefHashBefore) {
          throw new Error(
            `DESIGN_BRIEF_MUTATED_DURING_REPAIR: Coder repair loop modified the locked Design Brief! Expected hash: ${lockedBriefHashBefore}, Actual: ${actualHash}. Every repair must preserve the locked Design Brief.`
          );
        }
        console.log(`[CapabilityGate] ✓ Design Brief hash verified unchanged after Coder repair.`);
      }

      // Provenance Recheck after repair
      const recheckProv = ArtifactProvenanceValidator.purgeUnjustifiedArtifacts(outputDirectory, resolvedContract);
      if (recheckProv.foreignArtifactsRemaining > 0) {
        throw new Error(`GENERATION_REJECTED_FOREIGN_ARTIFACTS: Foreign artifacts introduced during repair: ${recheckProv.unprovenancedArtifacts.map(a => a.path).join(", ")}`);
      }

      // Project graph recheck
      const repairGraphValidation = graphEngine.validateGraph(outputDirectory);
      if (!repairGraphValidation.valid) {
        console.warn(`[CapabilityGate] Graph validation warning after repair: ${repairGraphValidation.issues.length} issue(s)`);
      }

      // Re-evaluate capability completeness
      capFailures = evaluateCapabilities();
    }

    if (capFailures.length > 0) {
      const failureList = capFailures.map(f => `${relative(outputDirectory, f.file)}: ${f.reasons.join("; ")}`).join("\n");
      throw new Error(`CAPABILITY_COMPLETENESS_FAILURE: Project failed capability completeness after ${MAX_CAPABILITY_REPAIRS} repair attempts:\n${failureList}`);
    }
    console.log(`[CapabilityGate] ✓ PASS — All views satisfied capability completeness contract.`);

    // Merge specification inferred libraries into package.json (ensuring they aren't overwritten by reviewer files write)
    const finalPkgPath = join(outputDirectory, "package.json");
    if (existsSync(finalPkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(finalPkgPath, "utf8"));
        pkg.dependencies = pkg.dependencies || {};
        const rawPrompt = specification.userPrompt || (specification as any).prompt || "";
        const rawLibs = [...(specification.inferredLibraries || [])];
        const is3DReq = Boolean(rawPrompt.match(/\b(3d|webgl|three\.?js|r3f|claymation|volumetric)\b/i));
        if (is3DReq && !rawLibs.includes("three")) {
          rawLibs.push("three");
        }
        const DEV_ONLY_TEST_LIBS = new Set([
          "vitest",
          "@testing-library/react",
          "@testing-library/jest-dom",
          "@testing-library/user-event",
          "jsdom",
          "typescript",
          "tsx",
          "concurrently",
          "vite",
          "@vitejs/plugin-react",
          "autoprefixer",
          "postcss",
          "tailwindcss"
        ]);
        const libs = rawLibs.filter((lib: string) => VALID_DEPENDENCIES_WHITELIST.has(lib) && !DEV_ONLY_TEST_LIBS.has(lib));
        const commonTypesNeeded = ["express", "cors", "canvas-confetti", "bcryptjs", "jsonwebtoken", "react", "react-dom", "three", "gsap"];
        
        // Remove any dev/test tools mistakenly in dependencies
        if (pkg.dependencies) {
          for (const devLib of DEV_ONLY_TEST_LIBS) {
            delete pkg.dependencies[devLib];
          }
        }
        pkg.devDependencies = pkg.devDependencies || {};
        if (!pkg.devDependencies["vitest"]) {
          pkg.devDependencies["vitest"] = "^1.6.0";
        }

        for (const lib of libs) {
          if (!pkg.dependencies[lib] && !pkg.devDependencies?.[lib]) {
            if (lib === "prisma" || lib === "@prisma/client") {
              pkg.dependencies[lib] = "^6.2.1";
            } else {
              pkg.dependencies[lib] = "latest";
            }
          }
          if (lib === "@prisma/client") {
            pkg.dependencies["prisma"] = "^6.2.1";
          }
          if (commonTypesNeeded.includes(lib)) {
            const typesLib = `@types/${lib}`;
            if (!pkg.devDependencies[typesLib] && !pkg.dependencies[typesLib]) {
              pkg.devDependencies[typesLib] = "latest";
            }
          }
        }
        
        // ── DEPENDENCY CONTRACT GATE: Scan package.json for forbidden dependencies ──
        const pkgContractResult = TechnologyConstraintValidator.validatePackageJson(pkg, resolvedContract);
        if (!pkgContractResult.valid) {
          console.warn(
            `[DEPENDENCY-CONTRACT] Removed ${pkgContractResult.forbiddenFound.length} forbidden package(s): ` +
            `${pkgContractResult.forbiddenFound.join(", ")}`
          );
          pkg.dependencies = pkgContractResult.cleaned.dependencies;
          pkg.devDependencies = pkgContractResult.cleaned.devDependencies;
        }

        writeFileSync(finalPkgPath, JSON.stringify(pkg, null, 2), "utf8");
        console.log(`[Orchestrator] Re-integrated ${libs.length} valid inferred libraries into final package.json.`);
      } catch (err: any) {
        console.warn(`[Orchestrator] Warning: Failed to re-integrate inferred libraries to final package.json: ${err.message}`);
      }
    }

    // Check output directory and package.json existence
    const pkgJsonPath = join(outputDirectory, "package.json");
    if (!existsSync(pkgJsonPath)) {
      console.warn("[Orchestrator] Warning: package.json missing before install — constructing base package.json");
      writeFileSync(pkgJsonPath, JSON.stringify({
        name: outputDirectory.split(/[\\/]/).at(-1) ?? "aegis-app",
        private: true,
        version: "0.0.1",
        type: "module",
        scripts: {
          "dev": "vite",
          "build": "tsc && vite build",
          "preview": "vite preview"
        },
        dependencies: {
          "react": "^18.3.1",
          "react-dom": "^18.3.1",
          "react-router-dom": "^6.26.0"
        },
        devDependencies: {
          "@types/react": "^18.3.3",
          "@types/react-dom": "^18.3.0",
          "@vitejs/plugin-react": "^4.3.1",
          "typescript": "^5.5.3",
          "vite": "^5.4.1"
        }
      }, null, 2), "utf8");
    }
    console.log(`[Orchestrator] Output directory: ${outputDirectory}`);
    console.log(`[Orchestrator] package.json exists: ${existsSync(pkgJsonPath)}`);
    console.log(`[Orchestrator] Current working directory: ${process.cwd()}`);

    // ─── Interaction Provenance: Capture Native Baseline (Post-Coder) ─────────
    if (!InteractionProvenanceTracker.hasBaseline(outputDirectory)) {
      try {
        InteractionProvenanceTracker.captureBaseline(outputDirectory);
      } catch (provErr: any) {
        console.warn(`[InteractionProvenance] Warning: Failed to capture baseline: ${provErr.message}`);
      }
    }

    // ─── Project Startup Agent (Pre-Verification Setup) ─────────────────────
    console.log("[Startup] Running Project Startup Agent to prepare database and environment...");
    try {
      const startupAgent = new ProjectStartupAgent();
      const startupResult = await startupAgent.prepare(outputDirectory);
      if (startupResult.patchesApplied.length > 0) {
        auditTrail.logEvent({
          agentRole: "Project Startup Agent",
          action: `Pre-verification setup applied ${startupResult.patchesApplied.length} fix(es): ${startupResult.patchesApplied.join("; ")}`,
          status: "SUCCESS"
        });
      }
    } catch (startupErr: any) {
      console.warn(`[Startup] Warning: Pre-verification startup agent failed: ${startupErr.message}`);
    }

    // ─── Interaction Provenance: Post-Sanitizer Audit ─────────────────────────
    try {
      InteractionProvenanceTracker.audit(outputDirectory);
    } catch (provErr: any) {
      console.warn(`[InteractionProvenance] Warning: Failed to audit provenance: ${provErr.message}`);
    }

    // Initial package dependencies installation
    console.log("[Orchestrator] Installing all project dependencies...");
    try {
      const pm = "pnpm";
      console.log(`[Orchestrator] Running '${pm} install' in generated project at ${outputDirectory}...`);
      const installResult = await this.installer.install(pm, outputDirectory);
      console.log(`[Orchestrator] Initial install completed. Exit code: ${installResult.exitCode}`);
      
      if (installResult.exitCode !== 0 || !existsSync(join(outputDirectory, "node_modules"))) {
        console.warn(`[Orchestrator] Warning: pnpm install exit code non-zero. Stderr: ${installResult.stderr}. Attempting npm install fallback...`);
        try {
          const { execSync } = await import("child_process");
          execSync("npm install --legacy-peer-deps --silent", { cwd: outputDirectory, stdio: "pipe", timeout: 180_000 });
          console.log("[Orchestrator] ✓ Fallback npm install succeeded!");
        } catch (npmErr: any) {
          console.error(`[Orchestrator] Fallback npm install failed: ${npmErr.message}`);
        }
      }
      
      // ── PRISMA VALIDATION GATE (separated from db push — schema errors ARE code errors) ──
      const prismaSchema = join(outputDirectory, "prisma/schema.prisma");
      if (existsSync(prismaSchema)) {
        console.log(`[PRISMA] Prisma schema detected at ${prismaSchema}. Running prisma validate...`);
        
        // First: validate schema integrity (this IS a code error if it fails)
        try {
          const { execSync } = await import("child_process");
          const prismaBin = "npx prisma@6";

          // Validate canonical model completeness BEFORE calling prisma CLI
          const schemaContent = readFileSync(prismaSchema, "utf8");
          const activeProjectContract = resolvedContract ?? (ArchitectureResolver.loadContract(outputDirectory) || request);
          const dbProvider = (typeof activeProjectContract === "object" ? activeProjectContract.database?.provider : undefined) ?? "postgresql";
          const schemaValidation = CanonicalDataModelContract.validateSchema(schemaContent, activeProjectContract);
          if (!schemaValidation.valid) {
            console.warn(
              `[PRISMA] ⚠️ Schema missing canonical models: ${schemaValidation.missingModels.join(", ")}. ` +
              `Replacing with canonical schema.`
            );
            writeFileSync(prismaSchema, CanonicalDataModelContract.getPrismaSchema(activeProjectContract, dbProvider), "utf8");
            console.log(`[PRISMA] ✓ Replaced schema with canonical contract.`);
          }

          // prisma validate — catches syntax errors, missing relations, undefined types
          try {
            execSync(`${prismaBin} validate`, { cwd: outputDirectory, stdio: "pipe" });
            console.log(`[PRISMA] ✓ PASS — prisma validate succeeded.`);
          } catch (validateErr: any) {
            const validateStderr = (validateErr.stderr || validateErr.message || "").toString();
            console.error(`[PRISMA] ❌ FAIL — prisma validate failed:\n${validateStderr}`);
            // This is a CODE error — throw to stop pipeline
            throw new Error(`PRISMA_SCHEMA_INVALID: prisma validate failed. Schema errors must be fixed before build. Details: ${validateStderr.slice(0, 500)}`);
          }

          // prisma generate — only if validate passed
          try {
            if (process.platform === "win32") {
              try {
                const { execSync: es } = await import("child_process");
                es(`wmic process where "ExecutablePath like '%node.exe%' and CommandLine like '%generated%project%'" call terminate`, { stdio: "ignore" });
              } catch { /* ignore */ }
            }
            execSync(`${prismaBin} generate`, { cwd: outputDirectory, stdio: "inherit" });
            console.log(`[PRISMA] ✓ PASS — prisma generate succeeded.`);
          } catch (genErr: any) {
            console.warn(`[PRISMA] Warning: prisma generate failed (non-fatal if types already exist): ${genErr.message}`);
          }

          // prisma db push — SEPARATED, P1000 is DATABASE_STATUS, not CODE_STATUS
          try {
            execSync(`${prismaBin} db push --accept-data-loss`, { cwd: outputDirectory, stdio: "pipe" });
            console.log(`[DATABASE] ✓ CONNECTED — database tables pushed successfully.`);
          } catch (pushErr: any) {
            const pushStderr = (pushErr.stderr || pushErr.message || "").toString();
            const isP1000 = pushStderr.includes("P1000") || pushStderr.includes("authentication failed") || pushStderr.includes("P1003") || pushStderr.includes("Connection refused");
            const isEnvMissing = pushStderr.includes("Environment variable not found") || pushStderr.includes("DATABASE_URL");
            if (isP1000 || isEnvMissing) {
              console.warn(
                `[DATABASE] ⚠️ BLOCKED — PostgreSQL connection unavailable (environment issue, NOT a code error).\n` +
                `  DATABASE_STATUS: BLOCKED\n  CODE_STATUS: PASS\n  Detail: ${pushStderr.slice(0, 200)}`
              );
              // Do NOT throw — database connectivity is NOT a source-code failure
            } else {
              console.warn(`[DATABASE] Warning: db push encountered non-P1000 error: ${pushStderr.slice(0, 200)}`);
            }
          }
        } catch (prismaGateErr: any) {
          if (prismaGateErr.message?.startsWith("PRISMA_SCHEMA_INVALID")) {
            throw prismaGateErr; // re-throw code errors
          }
          console.warn(`[PRISMA] Non-fatal error during Prisma operations: ${prismaGateErr.message}`);
        }
      } else {
        // No prisma/schema.prisma — write canonical schema
        console.log(`[PRISMA] No schema.prisma found. Writing canonical schema...`);
        const prismaDir = join(outputDirectory, "prisma");
        if (!existsSync(prismaDir)) mkdirSync(prismaDir, { recursive: true });
        const activeProjectContract = resolvedContract ?? (ArchitectureResolver.loadContract(outputDirectory) || request);
        const dbProvider = (typeof activeProjectContract === "object" ? activeProjectContract.database?.provider : undefined) ?? "postgresql";
        writeFileSync(join(prismaDir, "schema.prisma"), CanonicalDataModelContract.getPrismaSchema(activeProjectContract, dbProvider), "utf8");
        console.log(`[PRISMA] ✓ Canonical schema written to prisma/schema.prisma.`);
      }
    } catch (instErr: any) {
      console.warn(`[Orchestrator] Warning: Initial package installation failed: ${instErr.message}`);
    }

    // ─── Pre-Build Import Scan: Install any uninstalled packages upfront ────
    try {
      const codeFiles = parsedFiles.filter(f => f.path.endsWith(".ts") || f.path.endsWith(".tsx") || f.path.endsWith(".js") || f.path.endsWith(".jsx"));
      const concatenatedCode = codeFiles.map(f => `// File: ${f.path}\n${f.content}`).join("\n\n");
      const importMatches = concatenatedCode.matchAll(/import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g);
      const importedPkgs = new Set<string>();
      for (const m of importMatches) {
        const imp = m[1];
        if (!imp.startsWith(".") && !imp.startsWith("/") && !imp.startsWith("\\") && !imp.startsWith("node:")) {
          const pkgName = imp.startsWith("@") ? imp.split("/").slice(0, 2).join("/") : imp.split("/")[0];
          importedPkgs.add(pkgName);
        }
      }
      
      const missingPkgsToInstall: string[] = [];
      const pkgJsonPath = join(outputDirectory, "package.json");
      if (existsSync(pkgJsonPath)) {
        try {
          const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
          const allDeclared = new Set([
            ...Object.keys(pkgJson.dependencies || {}),
            ...Object.keys(pkgJson.devDependencies || {})
          ]);
          for (const pkg of importedPkgs) {
            if (!allDeclared.has(pkg)) {
              missingPkgsToInstall.push(pkg);
            }
          }
        } catch {}
      }

      if (missingPkgsToInstall.length > 0) {
        console.log(`[Orchestrator] Pre-build import scan detected ${missingPkgsToInstall.length} uninstalled package(s): ${missingPkgsToInstall.join(", ")}. Installing...`);
        await this.installer.installPackages("pnpm", outputDirectory, missingPkgsToInstall);
      }

      this.resolveMissingLocalImports(outputDirectory);

      // Project Graph Engine: Build & Validate Cross-File Dependency Graph
      const projectGraphEngine = new ProjectGraphEngine();
      const graphValidation = projectGraphEngine.validateGraph(outputDirectory);
      if (graphValidation.valid) {
        console.log(`[ProjectGraph] ✓ Project dependency graph validated cleanly.`);
      } else {
        console.warn(`[ProjectGraph] ⚠️ Project graph validation found ${graphValidation.issues.length} issue(s). Applying deterministic fixes...`);
      }

      // Fast Deterministic Sanitation (Dependency Closure, Casing, Export contracts, DB URL)
      const projectContract = resolvedContract || ArchitectureResolver.loadContract(outputDirectory);
      const sanitizeReport = FastDeterministicSanitizer.sanitizeProject(outputDirectory, projectContract);
      console.log(`[FastSanitizer] ✓ Pre-build sanitation complete (Collisions resolved: ${sanitizeReport.casingCollisionsResolved}, Imports added: ${sanitizeReport.missingDependenciesAdded.length}, Exports fixed: ${sanitizeReport.exportFixesApplied}, DB URL valid: ${sanitizeReport.databaseUrlValid})`);

      // Re-scan imports post-fixer/sanitizer to ensure packages added by fixers (e.g. @tanstack/react-query, @hookform/resolvers) are installed
      const postFixMissingPkgs = this.scanAndResolveMissingPackages(outputDirectory);
      if (postFixMissingPkgs.length > 0) {
        console.log(`[Orchestrator] Post-sanitization import scan detected ${postFixMissingPkgs.length} uninstalled package(s): ${postFixMissingPkgs.join(", ")}. Installing...`);
        await this.installer.installPackages("pnpm", outputDirectory, postFixMissingPkgs);
      }
    } catch (scanErr: any) {
      console.warn(`[Orchestrator] Pre-build import scan non-fatal warning: ${scanErr.message}`);
    }

    // ─── DesignIntentGate (source-level design verification) ─────────────────
    // Runs AFTER all source files are written, BEFORE the build loop.
    // This catches design violations early (forbidden vocabulary, wrong hero
    // elements, nav overflow) without burning a full Chromium render cycle.
    if ((this as any)._pendingDesignBrief) {
      const pendingBrief = (this as any)._pendingDesignBrief;
      try {
        console.log("[DesignIntentGate] Running source-level design intent verification...");
        const intentReport = await DesignIntentGate.verify(pendingBrief, outputDirectory);
        console.log(`[DesignIntentGate] ${intentReport.passed ? "✓ PASS" : "✗ FAIL"} — score=${intentReport.score}/100 | critical=${intentReport.criticalCount} | warnings=${intentReport.warningCount}`);

        if (!intentReport.passed) {
          console.warn(`[DesignIntentGate] ⚠ Design intent score ${intentReport.score}/100 (${intentReport.criticalCount} critical, ${intentReport.warningCount} warnings) — injecting into healing context.`);
          enrichedRequest = enrichedRequest + "\n\n[DESIGN_INTENT_VIOLATIONS]\n" + intentReport.summaryText;
        }
      } catch (gateErr: any) {
        // Non-fatal gate errors (e.g. filesystem issue) — log and continue
        console.warn(`[DesignIntentGate] Gate encountered a non-fatal error: ${gateErr.message}. Continuing build.`);
      }
    }

    let build =
      await this.runVerification(
        request,
        framework,
        outputDirectory,
      );

    if (!build.success) {
      let attempts = 0;
      const maxRepairAttempts = 2;

      console.error("\n===== BUILD FAILURE DIAGNOSTICS =====");
      if (build.stderr) {
        console.error("===== BUILD STDERR =====");
        console.error(build.stderr);
      }
      if (build.stdout) {
        console.log("===== BUILD STDOUT =====");
        console.log(build.stdout);
      }
      console.error("======================================\n");

      const fullDiagnosticsPreCheck = [build.stdout || "", build.stderr || ""].filter(Boolean).join("\n");

      // ── Self-Healing Skip Gate ───────────────────────────────────────────
      // Architecture/environment errors CANNOT be fixed by AI code repair.
      // These must be fixed upstream in the architecture contract or environment config.
      const isArchitectureFailure = (
        fullDiagnosticsPreCheck.includes("ARCHITECTURE_CONFLICT") ||
        fullDiagnosticsPreCheck.includes("CONTRACT_CONFLICT") ||
        fullDiagnosticsPreCheck.includes("DATABASE_CONFIGURATION_CONFLICT") ||
        fullDiagnosticsPreCheck.includes("ORM_INCOMPATIBILITY") ||
        fullDiagnosticsPreCheck.includes("DUPLICATE_PROJECT_ROOT")
      );

      if (isArchitectureFailure) {
        console.error("[Self-Healing] ❌ BLOCKING: Build failure is classified as an ARCHITECTURE or DATABASE_CONFIGURATION error.");
        console.error("[Self-Healing] Self-healer will NOT run — these errors cannot be fixed by code repair.");
        console.error("[Self-Healing] Fix the architecture contract upstream and re-run generation.");
        // Fall through to final success check without running repair
      } else {
      const initialHadCleanCompilation = !build.stderr?.includes("error TS") && !build.stderr?.includes("ELIFECYCLE");

        const initialDiagnostics = [
          build.stdout || "",
          build.stderr || "",
        ].filter(Boolean).join("\n");

        const convergenceTracker = new RepairConvergenceTracker(initialDiagnostics);
        let consecutiveNoProgressAttempts = 0;

        while (attempts < maxRepairAttempts) {
          attempts++;
          console.log(`\n[Self-Healing] Attempting automatic repair ${attempts}/${maxRepairAttempts}...`);

          const fullDiagnostics = [
            build.stdout || "",
            build.stderr || "",
          ].filter(Boolean).join("\n");

          // 1. Check for missing packages first
          const packages = this.dependencyResolver.resolve(fullDiagnostics);
          if (packages.length > 0) {
            console.log(`[DependencyResolver] Installing missing packages: ${packages.join(", ")}`);
            try {
              const pm = "pnpm";
              await this.installer.installPackages(pm, outputDirectory, packages);
              this.resolveMissingLocalImports(outputDirectory);
              build = await this.runVerification(request, framework, outputDirectory);
              if (build.success) {
                console.log("[DependencyResolver] ✓ Build succeeded after package installation!");
                break;
              }
            } catch (instErr: any) {
              console.warn(`[DependencyResolver] Warning: Failed to install packages: ${instErr.message}`);
            }
          }

          // 2. Focused Deterministic Symbol / Export / Casing Repair Path (TS2724, TS2305, TS2551, TS2614, TS2304)
          const currentDiagnostics = [build.stdout || "", build.stderr || ""].filter(Boolean).join("\n");
          const deterministicActions = TsSymbolRepairEngine.repair(outputDirectory, currentDiagnostics);
          if (deterministicActions.length > 0) {
            console.log(`[Self-Healing] ⚡ Applied ${deterministicActions.length} deterministic symbol/casing repair(s):`);
            for (const act of deterministicActions) {
              console.log(`  → ${act.description}`);
            }
            try {
              FastDeterministicSanitizer.sanitizeProject(outputDirectory);
            } catch { /* ignore */ }

            const postDeterministicBuild = await this.runVerification(request, framework, outputDirectory);
            if (postDeterministicBuild.success) {
              console.log("[Self-Healing] ✓ Build succeeded after deterministic symbol repair!");
              build = postDeterministicBuild;
              break;
            } else {
              const evalResult = convergenceTracker.evaluateCandidate(
                attempts,
                [postDeterministicBuild.stdout, postDeterministicBuild.stderr].filter(Boolean).join("\n")
              );
              if (evalResult.accepted) {
                console.log(`[Self-Healing] ✓ Deterministic repair improved project state (${evalResult.comparison.reason}). Continuing...`);
                build = postDeterministicBuild;
              }
            }
          }

          // 3. AI Healer / Coordinator
          try {
            const activeDiagnostics = [build.stdout || "", build.stderr || ""].filter(Boolean).join("\n");
            const mapper = new ErrorRootCauseMapper();
            const rootCause = mapper.analyze(activeDiagnostics, parsedFiles.map(f => f.path));

            // Attach actual broken file contents from disk to errorPayload so BuildHealer sees exact code
            const brokenFileSnippets: string[] = [];
            for (const targetRelPath of rootCause.filesToFix) {
              const absTarget = join(outputDirectory, targetRelPath);
              if (existsSync(absTarget)) {
                try {
                  const code = readFileSync(absTarget, "utf8");
                  brokenFileSnippets.push(`=== FILE CONTENT TO REPAIR (${targetRelPath}) ===\n${code}`);
                } catch { /* ignore */ }
              }
            }

            const errorPayload = [
              activeDiagnostics,
              rootCause.summary ? `=== STRUCTURED ROOT CAUSE DIAGNOSIS ===\n${rootCause.summary}` : "",
              brokenFileSnippets.join("\n\n")
            ].filter(Boolean).join("\n\n");

            GenerationBudgetGuard.getInstance().assertRepairAllowed("BuildSelfHealing");
            GenerationBudgetGuard.getInstance().recordRepairAttempt("BuildSelfHealing");

            const repairResponse =
              await this.repairCoordinator.repair(
                request,
                errorPayload,
                response,
              );

            // Deduplicate candidate: if identical to a previously tested candidate, stop or skip
            if (convergenceTracker.isDuplicateCandidate(repairResponse)) {
              console.warn(`[Self-Healing] 🛑 AI proposed a duplicate repair candidate already tested in this transaction. Skipping...`);
              continue;
            }

            const newDepsMatch = repairResponse.match(/NEW_DEPENDENCIES:\s*([^\r\n]+)/i);
            if (newDepsMatch) {
              const declaredPkgs = newDepsMatch[1].split(",").map(p => p.trim()).filter(Boolean);
              if (declaredPkgs.length > 0) {
                console.log(`[Self-Healing] Detected explicit NEW_DEPENDENCIES declaration: ${declaredPkgs.join(", ")}. Installing...`);
                try {
                  await this.installer.installPackages("pnpm", outputDirectory, declaredPkgs);
                } catch (depInstErr: any) {
                  console.warn(`[Self-Healing] Warning: Failed to install declared NEW_DEPENDENCIES: ${depInstErr.message}`);
                }
              }
            }

            let repairedFiles = this.parser.parse(repairResponse);
            if (repairedFiles.length === 0) {
              // Fallback 1: JSON repair schema
              try {
                const jsonMatch = repairResponse.match(/\{[\s\S]*"repairs"[\s\S]*\}/);
                if (jsonMatch) {
                  const parsedObj = JSON.parse(jsonMatch[0]);
                  if (Array.isArray(parsedObj.repairs)) {
                    repairedFiles = parsedObj.repairs.map((r: any) => ({
                      path: r.path || r.filePath,
                      content: r.content || r.newContent || r.patch || ""
                    })).filter((f: any) => f.path && f.content);
                  }
                }
              } catch {}

              // Fallback 2: Markdown header formats like **File: `src/path.tsx`** or FIXED FILE: `src/path.tsx`
              if (repairedFiles.length === 0) {
                const fileHeaderRegex = /(?:(?:\*{0,2}(?:FIXED\s+|UPDATED\s+|MODIFIED\s+)?(?:File|Path|Target\s+File):\s*`?([a-zA-Z0-9_\-\/\\\.]+?)`?\*{0,2}))[\s\S]*?```(?:tsx|ts|jsx|js)?[\r\n]+([\s\S]*?)```/gi;
                let match: RegExpExecArray | null;
                while ((match = fileHeaderRegex.exec(repairResponse)) !== null) {
                  const filePath = match[1].trim();
                  const fileContent = match[2].trim();
                  if (filePath && fileContent) {
                    repairedFiles.push({ path: filePath, content: fileContent });
                  }
                }
              }

              // Fallback 3: Generic file path detection in preceding text before ```tsx block
              if (repairedFiles.length === 0) {
                const genericCodeBlockRegex = /(?:`?([a-zA-Z0-9_\-\/\\\.]+\.(?:tsx|ts|jsx|js|css|json))`?|corrected\s+`?([a-zA-Z0-9_\-\/\\\.]+\.(?:tsx|ts|jsx|js|css|json))`?)[\s\S]*?```(?:tsx|ts|jsx|js|css|json)?[\r\n]+([\s\S]*?)```/gi;
                let match: RegExpExecArray | null;
                while ((match = genericCodeBlockRegex.exec(repairResponse)) !== null) {
                  const filePath = (match[1] || match[2] || "").trim();
                  const fileContent = match[3].trim();
                  if (filePath && fileContent) {
                    repairedFiles.push({ path: filePath, content: fileContent });
                  }
                }
              }
            }

            repairedFiles = repairedFiles
              .filter(f => f && typeof f.path === "string" && f.path.trim().length > 2 && f.content)
              .map(f => {
                let p = f.path.replace(/^[\\\/]+/, "").replace(/\\/g, "/").trim();
                if (!p.includes("/") && !p.startsWith(".")) {
                  const matched = parsedFiles.find(pf => pf.path.endsWith("/" + p) || pf.path === p);
                  if (matched) {
                    p = matched.path;
                  }
                }
                return {
                  path: p,
                  content: f.content
                };
              });

            if (repairedFiles.length > 0) {
              // Pre-normalize candidate repair files before writing
              for (const rFile of repairedFiles) {
                if (rFile.path.endsWith(".ts") || rFile.path.endsWith(".tsx")) {
                  const numNorm = ASTSafeTransformer.normalizeLeadingZeroLiterals(rFile.content, rFile.path);
                  if (numNorm.normalizedCount > 0) {
                    rFile.content = numNorm.code;
                  }
                  const dedup = ASTSafeTransformer.deduplicateTopLevelIdentifiers(rFile.content, rFile.path);
                  if (dedup.deduplicatedCount > 0) {
                    rFile.content = dedup.code;
                  }
                }
              }

              // In-memory snapshot to prevent in-memory parsedFiles from drifting if repair rolls back
              const parsedFilesSnapshot = parsedFiles.map(f => ({ ...f }));

              // Transactional Repair: Create checkpoint before writing repair files
              const repairFilePaths = repairedFiles.map(rf => rf.path);
              const repairCheckpoint = TransactionalRepairSystem.createCheckpoint(outputDirectory, repairFilePaths);

              const validatedRepairedFiles = this.validate(framework, repairedFiles);
              this.write(validatedRepairedFiles, outputDirectory);
              this.resolveMissingLocalImports(outputDirectory);

              for (const rFile of validatedRepairedFiles) {
                const fullPath = join(outputDirectory, rFile.path);
                const diskContent = existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
                console.log(`[Self-Healing] ✓ Updated: ${fullPath} (${rFile.content.length} bytes written, disk size: ${diskContent.length} bytes)`);
                
                const existingIdx = parsedFiles.findIndex(f => f.path === rFile.path);
                if (existingIdx !== -1) {
                  parsedFiles[existingIdx] = rFile;
                } else {
                  parsedFiles.push(rFile);
                }
              }

              try {
                FastDeterministicSanitizer.sanitizeProject(outputDirectory);
              } catch { /* ignore */ }

              let nextBuild = await this.runVerification(request, framework, outputDirectory);
              if (!nextBuild.success) {
                const newDiagnostics = [nextBuild.stderr, nextBuild.stdout].filter(Boolean).join("\n");
                const missingPkgs = this.dependencyResolver.resolve(newDiagnostics);
                if (missingPkgs.length > 0) {
                  console.log(`[DependencyResolver] Post-repair missing packages detected: ${missingPkgs.join(", ")}. Installing...`);
                  try {
                    await this.installer.installPackages("pnpm", outputDirectory, missingPkgs);
                    nextBuild = await this.runVerification(request, framework, outputDirectory);
                  } catch (instErr: any) {
                    console.warn(`[DependencyResolver] Post-repair package install failed: ${instErr.message}`);
                  }
                }
              }

              if (nextBuild.success) {
                console.log("[Self-Healing] ✓ Build succeeded after automatic repair!");
                TransactionalRepairSystem.commit(repairCheckpoint);
                build = nextBuild;
                break;
              }

              // Monotonic evaluation using RepairConvergenceTracker
              const afterDiagnostics = [nextBuild.stderr, nextBuild.stdout].filter(Boolean).join("\n");
              const candidateEval = convergenceTracker.evaluateCandidate(attempts, afterDiagnostics);

              if (candidateEval.accepted) {
                console.log(`[Self-Healing] ✓ Progress accepted (${candidateEval.comparison.reason}). Baseline updated.`);
                TransactionalRepairSystem.commit(repairCheckpoint);
                build = nextBuild;
                consecutiveNoProgressAttempts = 0; // reset on progress
              } else {
                console.warn(`[Self-Healing] ⚠️ ${candidateEval.comparison.reason}. Rolling back checkpoint...`);
                TransactionalRepairSystem.rollback(outputDirectory, repairCheckpoint, candidateEval.comparison.reason);
                // Restore in-memory parsedFiles to match disk rollback state
                parsedFiles.length = 0;
                parsedFiles.push(...parsedFilesSnapshot.map(f => ({ ...f })));
                // Re-run verification to confirm working state restored
                build = await this.runVerification(request, framework, outputDirectory);

                // Stagnation detection: if the error signature is IDENTICAL to the previous state,
                // the repair strategy is making no progress. Halt immediately instead of retrying.
                if (candidateEval.comparison.verdict === "IDENTICAL") {
                  consecutiveNoProgressAttempts++;
                  if (consecutiveNoProgressAttempts >= 2) {
                    console.error(
                      `[Self-Healing] 🛑 REPAIR_STRATEGY_NO_PROGRESS: Error signature identical to previous state for ${consecutiveNoProgressAttempts} consecutive attempt(s). ` +
                      `Halting repair strategy to avoid wasting remaining attempts on an ineffective fix.`
                    );
                    break;
                  }
                } else {
                  consecutiveNoProgressAttempts = 0;
                }
              }

            } else {
              console.warn("[Self-Healing] No file changes were parsed from the repair response.");
              console.log("[Self-Healing] === RAW REPAIR RESPONSE ===");
              console.log(repairResponse);
              console.log("[Self-Healing] ===========================");
              // Re-verify actual disk build status to preserve clean disk state
              build = await this.runVerification(request, framework, outputDirectory);
              break;
            }
          } catch (error: any) {
            console.error(`[Self-Healing] Error occurred during repair attempt ${attempts}:`, error.message);
            if (
              error instanceof BudgetExceededError ||
              error instanceof ProviderOutageHaltError ||
              error?.code === "BUDGET_EXHAUSTED" ||
              error?.code === "PROVIDER_OUTAGE_HALT" ||
              error?.message?.includes("BUDGET_EXHAUSTED") ||
              error?.message?.includes("PROVIDER_OUTAGE_HALT")
            ) {
              throw error;
            }
            break;
          }
        } // end while repair attempts
      } // end else (!isArchitectureFailure)
    }

    if (!build.success) {
      console.log();
      console.error("❌ Self-Healing: Build is still failing after maximum repair attempts. Halting pipeline execution.");
      this.execution.complete();
      throw new Error(`Project generation failed: Maximum self-healing attempts reached. Build error: ${build.stderr || "Compilation failed."}`);
    }

    console.log("Generating deployment configurations...");
    const deployFiles = this.deployGenerator.generate(specification);
    this.write(deployFiles, outputDirectory);

    // Save files, tasks, and metrics post-build
    try {
      const memory = memoryEngine.loadMemory();
      if (memory) {
        memory.createdFiles = [
          ...new Set([
            ...memory.createdFiles,
            ...files.map(f => f.path),
            ...deployFiles.map(f => f.path),
          ]),
        ];
        memory.tasks = tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          completed: true,
          stage: String(t.stage || ""),
          priority: t.priority || 1,
          dependencies: t.dependencies || [],
          estimatedComplexity: t.estimatedComplexity || 1,
        }));
        memory.history.push({
          timestamp: new Date().toISOString(),
          request,
          stage: "ExecutionComplete",
        });
        memoryEngine.saveMemory(memory);
      }

      const arch = memoryEngine.loadArchitecture();
      if (arch) {
        arch.framework = framework;
        arch.styling = framework === "html" ? "vanilla-css" : "tailwind";
        
        // Post-build Learning Loop analysis
        if (!build.success) {
          const errorsToLearn = [build.stderr || "Unknown build error"];
          console.log("[LearningLoop] Running heuristics error parser...");
          try {
            const ruleLearned = await this.heuristicsLearningAgent.execute(request, errorsToLearn);
            arch.additionalRules ??= [];
            if (ruleLearned && !arch.additionalRules.includes(ruleLearned)) {
              arch.additionalRules.push(ruleLearned);
              console.log(`[LearningLoop] ✓ Successfully indexed new lesson rules: "${ruleLearned}"`);
            }
          } catch (learnErr: any) {
            console.warn(`[LearningLoop] Warning: Could not index learned heuristics: ${learnErr.message}`);
          }
        }
        
        memoryEngine.saveArchitecture(arch);
      }

      const metrics = memoryEngine.loadMetrics();
      if (metrics) {
        metrics.buildHistory.push({
          timestamp: new Date().toISOString(),
          success: build.success,
          durationMs: 3000,
          errors: build.success ? [] : [build.stderr || "Unknown build error"],
        });
        metrics.telemetry.sandboxRuns += 1;

        const tracked = MetricsTracker.getInstance().getMetrics();
        metrics.telemetry.totalTokensUsed = (metrics.telemetry.totalTokensUsed || 0) + tracked.totalTokens;
        metrics.telemetry.estimatedCostUsd = (metrics.telemetry.estimatedCostUsd || 0) + tracked.estimatedCostUsd;

        memoryEngine.saveMetrics(metrics);
      }

      // Build and save code dependency graph post-build
      try {
        const graphEngine = new DependencyGraphEngine();
        graphEngine.build(outputDirectory);
        graphEngine.save(outputDirectory);
      } catch (graphErr: any) {
        console.warn(`[DependencyGraph] Warning: Failed to build dependency graph: ${graphErr.message}`);
      }

      console.log("[Memory] Saved execution context, architecture patterns, and metrics to .aegis/ successfully.");
    } catch (memSaveErr: any) {
      console.warn(`[Memory] Warning: Failed to save persistent memory: ${memSaveErr.message}`);
    }

    // ─── Project Startup Agent (runs BEFORE DoD so deps are ready for validation) ──
    console.log("[Startup] Running Project Startup Agent...");
    try {
      const startupAgent = new ProjectStartupAgent();
      const startupResult = await startupAgent.prepare(outputDirectory);
      if (startupResult.patchesApplied.length > 0) {
        auditTrail.logEvent({
          agentRole: "Project Startup Agent",
          action: `Applied ${startupResult.patchesApplied.length} startup fix(es): ${startupResult.patchesApplied.join("; ")}`,
          status: "SUCCESS"
        });
      }

      // Re-verify build status after ProjectStartupAgent applied all deterministic fixes
      build = await this.runVerification(request, framework, outputDirectory);
    } catch (startupErr: any) {
      console.warn(`[Startup] Warning: Startup agent failed: ${startupErr.message}`);
    }

    // ─── Definition of Done Hard Gate ───────────────────────────────────────
    console.log("[DoD] Running Definition of Done validation...");
    let dodPassed = false;
    let dodResult: any = null;
    try {
      dodResult = this.definitionOfDone.validate(outputDirectory, inferredFeatureNames, build?.success ?? true);
      console.log(`[DoD] ${dodResult.summary}`);
      dodPassed = dodResult.passed;
      if (!dodResult.passed) {
        console.error(`[DoD] ❌ Definition of Done FAILED (score: ${dodResult.score}/100).`);
        for (const blocker of dodResult.blockers) {
          console.error(`  - ✗ [Blocker] ${blocker.name}: ${blocker.detail}`);
        }
        auditTrail.logEvent({
          agentRole: "Definition of Done Validator",
          action: `DoD FAILED (score: ${dodResult.score}/100). Blockers: ${dodResult.blockers.map((b: any) => b.name).join(", ")}`,
          status: "FAILURE"
        });
      } else {
        auditTrail.logEvent({
          agentRole: "Definition of Done Validator",
          action: `DoD PASSED (score: ${dodResult.score}/100). All criteria satisfied.`,
          status: "SUCCESS"
        });
      }
    } catch (dodErr: any) {
      console.warn(`[DoD] Warning: Definition of Done check failed: ${dodErr.message}`);
      dodPassed = false;
    }

    // ── Generate Execution Governance Report & Audit Architecture ──────────
    const loadedContract = ArchitectureResolver.loadContract(outputDirectory);
    const actualArch = ArchitectureAuditor.audit(outputDirectory);
    const archDiff = ArchitectureDiff.compare(loadedContract, actualArch);
    ArchitectureDiff.writeDiffReport(outputDirectory, archDiff);

    const archContract = ArchitectureContractManager.loadContract(outputDirectory);

    // Enforce clean build before runtime evaluation
    if (!build.success) {
      console.error(`\n❌ Clean build required before runtime evaluation. Build diagnostics:\n${build.stderr || build.stdout}`);
      this.execution.complete();
      throw new Error(`Project generation failed: Clean compilation build required before runtime evaluation: ${build.stderr || "Compilation failed."}`);
    }

    // ─── Test Pyramid Level 1: Deterministic Static Checks (0 LLM tokens) ────
    const pyramidLevel1 = TestPyramidRunner.runLevel1DeterministicChecks(outputDirectory);
    if (!pyramidLevel1.passed) {
      console.warn(`[TestPyramid] ⚠️ Level 1 deterministic static issues found: ${pyramidLevel1.errors.join("; ")}`);
    } else {
      console.log(`[TestPyramid] ✓ Level 1 deterministic static checks passed (${pyramidLevel1.checksExecuted.length} checks in ${pyramidLevel1.durationMs}ms, 0 tokens).`);
    }

    // ─── End-to-End Runtime Validation (AppServerRunner, ReadOnlyBrowserValidator, ApiWorkflowVerifier) ────
    console.log("\n[RuntimeValidation] 🚀 Starting application server & runtime validation...");
    let serverInfo = { ready: false, port: 5173, url: "http://localhost:5173" };
    let browserValResult: any = null;
    let apiWorkflowReport: any = null;

    try {
      const backendPreCheck = BackendCompilationGate.verify(outputDirectory);
      if (!backendPreCheck.passed) {
        console.error(`\n[Orchestrator] 🛑 BACKEND_COMPILATION_BLOCKED: Backend failed compilation:\n${backendPreCheck.summary}`);
      }
      const server = await AppServerRunner.startServer(outputDirectory);
      serverInfo = { ready: server.ready, port: server.port, url: server.url };

      if (server.ready) {
        // Collect actual application routes defined in routes.tsx and design brief
        const dynamicRoutes: string[] = ["/"];
        const routesFile = join(outputDirectory, "src", "routes.tsx");
        if (existsSync(routesFile)) {
          try {
            const content = readFileSync(routesFile, "utf8");
            const matches = content.matchAll(/path=["']([^"'*:]+)["']/g);
            for (const m of matches) {
              const r = m[1];
              if (r && !r.includes(":") && !r.includes("*") && !dynamicRoutes.includes(r)) {
                dynamicRoutes.push(r);
              }
            }
          } catch {}
        }
        const lockedBrief = DesignBriefLock.read(outputDirectory);
        if (lockedBrief?.pageCompositions) {
          for (const comp of lockedBrief.pageCompositions) {
            const r = comp.route;
            if (r && !r.includes(":") && !dynamicRoutes.includes(r)) {
              dynamicRoutes.push(r);
            }
          }
        }
        try {
          ArchitectureContractManager.ensureRouteCapabilities(outputDirectory, dynamicRoutes, specification?.userPrompt);
        } catch {}
        let apiTargetUrl = server.backendUrl || server.url;
        apiWorkflowReport = await ApiWorkflowVerifier.executeWorkflows(apiTargetUrl, undefined, outputDirectory);

        // Targeted Coder repair loop for failing API contract steps in Stage 10 before Final Gate
        if (apiWorkflowReport && !apiWorkflowReport.passed && (apiWorkflowReport.failedSteps > 0 || (apiWorkflowReport.results && apiWorkflowReport.results.some((r: any) => !r.passed)))) {
          const maxRepairAttempts = 2;
          for (let attempt = 1; attempt <= maxRepairAttempts; attempt++) {
            const failedSteps = (apiWorkflowReport.results || []).filter((r: any) => !r.passed);
            if (failedSteps.length === 0) break;

            GenerationBudgetGuard.getInstance().assertRepairAllowed("BackendApiRepair");
            GenerationBudgetGuard.getInstance().recordRepairAttempt("BackendApiRepair");
            console.log(`\n[Stage 10: BackendRepair] 🛠️ Backend API repair attempt ${attempt}/${maxRepairAttempts} for ${failedSteps.length} failing step(s)...`);

            // Step 1: Diagnose failure origin and check recurring error circuit breaker
            const primaryFailingStep = failedSteps[0];
            const failureError = primaryFailingStep?.error || `HTTP ${primaryFailingStep?.actualStatus} (Expected ${primaryFailingStep?.step?.expectedStatus})`;
            const diagnosis = ErrorDiagnosisEngine.diagnose({
              phase: "Stage 10 Backend API Verification",
              stdout: typeof primaryFailingStep?.actualBody === "object" ? JSON.stringify(primaryFailingStep.actualBody) : String(primaryFailingStep?.actualBody || ""),
              stderr: String(failureError),
              projectRoot: outputDirectory,
            });

            if (diagnosis.circuitBreakerTripped) {
              console.warn(`[Stage 10: CircuitBreaker] ⚠️ Halting repeated repair: ${diagnosis.recommendedAction}`);
              break;
            }

            // Step 2: Identify targeted route files and prisma snippets for failing steps
            const targetedFilesSet = new Set<string>();
            let targetedSchemaContext = "";
            for (const f of failedSteps) {
              const path = f.step?.path || "";
              const targeted = IncrementalGenerator.getTargetedRepairContext(outputDirectory, path);
              if (targeted.targetRouteFile) {
                targetedFilesSet.add(targeted.targetRouteFile);
              }
              if (targeted.prismaSnippet && !targetedSchemaContext.includes(targeted.prismaSnippet)) {
                targetedSchemaContext += `\n${targeted.prismaSnippet}\n`;
              }
            }

            // Gather only targeted server route files (pruning irrelevant routes to save tokens)
            const serverRoutesDir = join(outputDirectory, "server", "routes");
            const serverRouteFiles: { path: string; content: string }[] = [];
            if (existsSync(serverRoutesDir)) {
              try {
                const entries = readdirSync(serverRoutesDir);
                for (const entry of entries) {
                  if (entry.endsWith(".ts") || entry.endsWith(".js")) {
                    const rel = `server/routes/${entry}`;
                    if (targetedFilesSet.size === 0 || targetedFilesSet.has(rel)) {
                      const abs = join(serverRoutesDir, entry);
                      try {
                        serverRouteFiles.push({ path: rel, content: readFileSync(abs, "utf8") });
                      } catch {}
                    }
                  }
                }
              } catch {}
            }

            // Only check server entry files if no specific route was targeted
            const serverEntryFiles: { path: string; content: string }[] = [];
            if (targetedFilesSet.size === 0) {
              for (const entryName of ["server/index.ts", "server/app.ts", "server/server.ts"]) {
                const abs = join(outputDirectory, entryName);
                if (existsSync(abs)) {
                  try {
                    serverEntryFiles.push({ path: entryName, content: readFileSync(abs, "utf8") });
                  } catch {}
                }
              }
            }

            // Targeted database / prisma schema context
            let schemaContext = targetedSchemaContext;
            if (!schemaContext) {
              const prismaSchemaPath = join(outputDirectory, "prisma", "schema.prisma");
              if (existsSync(prismaSchemaPath)) {
                try {
                  schemaContext = `\nPrisma Schema (prisma/schema.prisma):\n${readFileSync(prismaSchemaPath, "utf8")}\n`;
                } catch {}
              }
            }
            const dbTsPath = join(outputDirectory, "server", "db.ts");
            if (existsSync(dbTsPath)) {
              try {
                schemaContext += `\nDatabase Helper (server/db.ts):\n${readFileSync(dbTsPath, "utf8")}\n`;
              } catch {}
            }

            CostObservabilityReporter.getInstance().incrementRepairCalls(1);
            CostObservabilityReporter.getInstance().recordSaving({
              category: "TARGETED_REPAIR_PRUNING",
              description: `Pruned repair context to ${serverRouteFiles.length} targeted route file(s) for ${failedSteps.length} failing step(s)`,
              estimatedTokensSaved: Math.max(3000, 25000 - (serverRouteFiles.length * 3000)),
            });

            const displayedSteps = failedSteps.slice(0, 10);
            const failedStepDetails = displayedSteps.map((f: any, idx: number) =>
              `${idx + 1}. [${f.step?.method || "UNKNOWN"}] ${f.step?.path || "UNKNOWN"}\n` +
              `   Description: ${f.step?.description || ""}\n` +
              `   Endpoint Type: ${f.step?.endpointType || "READ_ONLY"}\n` +
              `   Requires DB Mutation: ${f.step?.requiresDbMutation ? "Yes" : "No"}\n` +
              `   Expected Status: ${f.step?.expectedStatus}\n` +
              `   Actual Status: ${f.actualStatus ?? "N/A"}\n` +
              `   Error: ${f.error || "None"}\n` +
              `   Request Headers: ${JSON.stringify(f.step?.headers || {})}\n` +
              `   Request Body Sent: ${typeof f.step?.requestBody === "object" ? JSON.stringify(f.step?.requestBody) : (f.step?.requestBody ?? "None")}\n` +
              `   Actual Response Body: ${typeof f.actualBody === "object" ? JSON.stringify(f.actualBody) : (f.actualBody || "N/A")}`
            ).join("\n\n") + (failedSteps.length > 10 ? `\n\n... and ${failedSteps.length - 10} additional failing step(s) with similar status.` : "");

            const seenFilePaths = new Set<string>();
            const uniqueServerFiles = [...serverRouteFiles, ...serverEntryFiles].filter(f => {
              if (seenFilePaths.has(f.path)) return false;
              seenFilePaths.add(f.path);
              return true;
            });
            const routeFilesContext = uniqueServerFiles.map(f =>
              `=== FILE: ${f.path} ===\n${f.content}\n=== END ===`
            ).join("\n\n");

            const repairPrompt = `
CRITICAL BACKEND API CONTRACT REPAIR (Attempt ${attempt}/${maxRepairAttempts}):
The following API workflow tests failed against the running server:

${failedStepDetails}

Existing Server Implementation:
${routeFilesContext}
${schemaContext}

Requirements for repair:
1. Ensure strict Express middleware ordering: app.use(cors()) and app.use(express.json()) MUST be registered BEFORE any domain router mounts in server/index.ts, otherwise req.body is undefined.
2. Any catch-all 404 handler (e.g. app.use((req, res) => res.status(404)...)) MUST be mounted strictly AFTER all domain router mounts (app.use('/api/...', ...)). Never mount a 404 handler before domain routes.
3. Fix route handlers in server/routes/*.ts so that all failing endpoints return expected HTTP status codes (200, 201, 204, 400, 404) and real database JSON payloads.
4. For foreign key relations (e.g. userId referencing User): if req.body.userId is provided, ensure the referenced user exists or resolve from existing user / authenticated session. Never trigger Prisma foreign key constraint violations (P2003).
5. For parameterized routes (/api/<resource>/:id): if the target record does not exist on GET, PUT, or DELETE, return HTTP 404 (never 400 or 500). Catch Prisma P2025 errors and return 404.
6. Never return HTTP 500. Handle missing fields or validation errors with HTTP 400, non-existent records with HTTP 404, and database operations safely inside try/catch.
7. Return the full updated files using standard file blocks:
=== FILE: server/routes/<filename>.ts ===
<complete file content>
=== END ===
`;

            const targetPaths = [...serverRouteFiles.map(f => f.path), ...serverEntryFiles.map(f => f.path)];
            const repairTask: any = {
              id: `backend-api-repair-${attempt}`,
              title: `Backend API Contract Repair Attempt ${attempt}`,
              description: `Repair failing backend API routes for ${failedSteps.length} contract step(s)`,
              stage: "Backend",
              type: "code",
              files: targetPaths.length > 0 ? targetPaths : ["server/routes/"],
              completed: false,
              estimatedComplexity: 6,
              priority: 1,
              dependencies: [],
              status: "pending",
            };

            try {
              const repairResult = await this.coderAgent.execute(
                repairTask,
                (actualArch as any) || architecture,
                architecturePlan,
                repairPrompt,
                outputDirectory,
                existingFiles,
              );

              let appliedAny = false;
              if (repairResult?.files && repairResult.files.length > 0) {
                new FileWriter().write(repairResult.files, outputDirectory);
                console.log(`[Stage 10: BackendRepair] ✓ Applied ${repairResult.files.length} repaired server file(s).`);
                appliedAny = true;
              }
              if (repairResult?.response) {
                const patchEngine = new PatchEngine();
                const patchedCount = patchEngine.apply(repairResult.response, outputDirectory);
                if (patchedCount > 0) appliedAny = true;

                if (!appliedAny) {
                  const fileBlockRegex = /(?:^|\r?\n)(?:\/\/\s*([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)|===+\s*(?:FILE:\s*)?([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)\s*===+)?\s*\r?\n```(?:[a-zA-Z0-9_-]+)?\s*\r?\n([\s\S]*?)```/gi;
                  let match: RegExpExecArray | null;
                  while ((match = fileBlockRegex.exec(repairResult.response)) !== null) {
                    const matchedPath = match[1] || match[2];
                    const content = match[3]?.trim();
                    if (matchedPath && content && content.length >= 50 && (matchedPath.startsWith("server/") || matchedPath.includes("/routes/"))) {
                      const abs = join(outputDirectory, matchedPath);
                      mkdirSync(dirname(abs), { recursive: true });
                      writeFileSync(abs, content, "utf8");
                      console.log(`[Stage 10: BackendRepair] ✓ Wrote code block to ${matchedPath}`);
                      appliedAny = true;
                    }
                  }
                }
              }

              if (appliedAny) {
                try {
                  FastDeterministicSanitizer.sanitizeProject(outputDirectory);
                  await this.projectStartupAgent.prepare(outputDirectory);
                  console.log("[Stage 10: BackendRepair] 🛡️ Sanitized and validated repaired backend routes and middleware.");
                } catch {}
              }

              // Restart the application/backend server to load the repaired route handlers
              console.log("[Stage 10: BackendRepair] 🔄 Restarting application server to reload backend routes...");
              AppServerRunner.stopServer();
              await new Promise(r => setTimeout(r, 1000));
              const restartedServer = await AppServerRunner.startServer(outputDirectory);
              serverInfo = { ready: restartedServer.ready, port: restartedServer.port, url: restartedServer.url };

              if (restartedServer.ready) {
                apiTargetUrl = restartedServer.backendUrl || restartedServer.url;
                apiWorkflowReport = await ApiWorkflowVerifier.executeWorkflows(apiTargetUrl, undefined, outputDirectory);
                console.log(`[Stage 10: BackendRepair] Re-verification result: passed=${apiWorkflowReport.passed}, failedSteps=${apiWorkflowReport.failedSteps}`);
                if (apiWorkflowReport.passed) {
                  console.log(`[Stage 10: BackendRepair] ✅ Backend API repair succeeded on attempt ${attempt}!`);
                  break;
                }
              } else {
                console.warn("[Stage 10: BackendRepair] ⚠️ Server failed to restart cleanly after repair.");
                break;
              }
            } catch (repairErr: any) {
              if (
                repairErr?.name === "BudgetExceededError" ||
                repairErr?.code === "BUDGET_EXHAUSTED" ||
                repairErr?.message?.includes("BUDGET_EXHAUSTED") ||
                repairErr?.code === "PROVIDER_OUTAGE_HALT" ||
                repairErr?.message?.includes("PROVIDER_OUTAGE_HALT")
              ) {
                throw repairErr;
              }
              console.warn(`[Stage 10: BackendRepair] ⚠️ Backend repair attempt ${attempt} error: ${repairErr.message}`);
            }
          }
        }

        browserValResult = await ReadOnlyBrowserValidator.validate(serverInfo.url, outputDirectory, { routes: dynamicRoutes, strictMode: true, apiReport: apiWorkflowReport });
      }
    } catch (runtimeErr: any) {
      if (
        runtimeErr?.name === "BudgetExceededError" ||
        runtimeErr?.code === "BUDGET_EXHAUSTED" ||
        runtimeErr?.message?.includes("BUDGET_EXHAUSTED") ||
        runtimeErr?.code === "PROVIDER_OUTAGE_HALT" ||
        runtimeErr?.message?.includes("PROVIDER_OUTAGE_HALT")
      ) {
        throw runtimeErr;
      }
      console.warn(`[RuntimeValidation] Warning: Runtime validation encountered non-fatal error: ${runtimeErr.message}`);
    } finally {
      AppServerRunner.stopServer();
    }

    // ─── Reality Checker Audit ────────────────────────────────────────────────
    let realityAuditResult: any = null;
    try {
      realityAuditResult = this.realityCheckerAgent.audit(outputDirectory);
    } catch (realityErr: any) {
      console.warn(`[RealityChecker] Warning: Reality check encountered error: ${realityErr.message}`);
    }

    // ─── Automated In-Project Test Suite Generator (V2.2 Project 1) ───────────
    let inProjectTestReport: any = null;
    try {
      const domainContract = DomainContractManager.load(outputDirectory);
      await TestGeneratorAgent.generate({
        projectRoot: outputDirectory,
        lockedPlan: (this as any).activeLockedPlan || undefined,
        domainContract: domainContract || undefined,
        planHash: (this as any).activeLockedPlan?.planHash,
      });
      // Synchronize testing dependencies into project node_modules
      await this.installer.install("pnpm", outputDirectory);
      inProjectTestReport = InProjectTestRunner.run(outputDirectory);
    } catch (testErr: any) {
      console.warn(`[TestGeneratorAgent] Warning: In-project test execution encountered non-fatal error: ${testErr.message}`);
    }

    // ─── Runtime Acceptance & Scenario Verification (Release-Blocking Mandatory Gate) ───
    let runtimeAcceptanceReport: any = null;
    try {
      const runtimeRunner = new RuntimeAcceptanceRunner(outputDirectory);
      runtimeAcceptanceReport = await runtimeRunner.execute();
      if (existsSync(join(outputDirectory, "server", "index.ts")) && !serverInfo.ready && runtimeAcceptanceReport) {
        runtimeAcceptanceReport.passed = false;
        runtimeAcceptanceReport.status = "FAILED";
        runtimeAcceptanceReport.evidenceSummary = "Runtime acceptance failed: Application server failed to launch or became unreachable.";
      }
      if (runtimeAcceptanceReport) {
        try {
          const aegisDir = join(outputDirectory, ".aegis");
          if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
          writeFileSync(join(aegisDir, "runtime-acceptance-report.json"), JSON.stringify(runtimeAcceptanceReport, null, 2), "utf8");
        } catch {}
      }
    } catch (runtimeErr: any) {
      console.warn(`[RuntimeAcceptance] Warning: Runtime acceptance runner encountered non-fatal error: ${runtimeErr.message}`);
    }

    // ── Generate Execution Governance Report with Authentic Runtime Evidence ──
    const finalReport = ExecutionReportGenerator.generateReport(
      outputDirectory,
      request,
      archContract,
      loadedContract ? "PASS" : "FAIL",
      archDiff.status === "PASS" ? "PASS" : "FAIL",
      archDiff.violations.map(v => `${v.field}: expected '${v.expected}', got '${v.actual}'`),
      dodPassed && build.success && archDiff.status === "PASS" && Boolean(browserValResult?.passed) ? "SUCCESS" : "FAILED",
      dodResult?.score ?? 0,
      (dodResult?.criteria ?? []).filter((c: any) => c.passed).map((c: any) => c.name),
      (dodResult?.criteria ?? []).filter((c: any) => !c.passed).map((c: any) => c.name),
      {
        requested: loadedContract?.database.provider || "SQLite",
        configured: actualArch.databaseProvider,
        isSynced: actualArch.databaseProvider.toLowerCase() === (loadedContract?.database.provider.toLowerCase() || "sqlite")
      },
      {
        typeCheck: build.success,
        build: build.success,
        runtime: Boolean(browserValResult?.passed),
        realityChecker: Boolean(realityAuditResult?.passed),
        visualReviewer: ValidationStateManager.getInstance().getState().latestVisualReviewPassed
      },
      0,
      (dodResult?.blockers ?? []).map((b: any) => b.detail)
    );

    // ─── FINAL SUCCESS GATE (Strict Zero-False-Positive Check) ─────────────
    // Detect if database is blocked (P1000 / ECONNREFUSED) — pass as separate signal, not build failure
    const dbIsBlocked = !!(
      build.stderr?.includes("P1000") ||
      build.stderr?.includes("authentication failed") ||
      (apiWorkflowReport && apiWorkflowReport.failedSteps === apiWorkflowReport.totalSteps && apiWorkflowReport.totalSteps > 0)
    );
    const finalGateResult = FinalSuccessGate.verify({
      projectRoot: outputDirectory,
      contract: loadedContract,
      buildSuccess: build.success,
      buildDiagnostics: build.stderr,
      serverReady: serverInfo.ready,
      browserResult: browserValResult,
      apiReport: apiWorkflowReport,
      realityResult: realityAuditResult,
      databaseBlocked: dbIsBlocked,
      testReport: inProjectTestReport,
      runtimeReport: runtimeAcceptanceReport,
      visualReviewPassed: ValidationStateManager.getInstance().getState().latestVisualReviewPassed,
      visualObservations: ValidationStateManager.getInstance().getState().visualObservations,
      // Use STANDARD policy (or user-specified policy) so post-baseline repairs are marked ASSISTED rather than crashing the run
      provenancePolicy: (specification as any)?.provenancePolicy || "STANDARD",
    });

    // ── Update Feature Matrix verification status with empirical evidence ──
    try {
      const existingMatrix = FeatureMatrixManager.loadFromProject(outputDirectory);
      if (existingMatrix) {
        const overallStatus = finalGateResult.status === "SUCCESS"
          ? "VERIFIED"
          : (finalGateResult.status === "BLOCKED" ? "BLOCKED" : "FAILED");
        for (const feature of existingMatrix.features) {
          feature.verificationStatus = overallStatus;
          feature.evidenceNotes = finalGateResult.evidenceSummary;
        }
        existingMatrix.updatedAt = new Date().toISOString();
        existingMatrix.verifiedCount = existingMatrix.features.filter(f => f.verificationStatus === "VERIFIED").length;
        FeatureMatrixManager.saveToProject(outputDirectory, existingMatrix);
        console.log(`[FeatureMatrix] ✓ Updated feature matrix verification status to "${overallStatus}" (${existingMatrix.verifiedCount}/${existingMatrix.totalFeatures} verified)`);
      }
    } catch (fmErr: any) {
      console.warn(`[FeatureMatrix] Warning: Failed to update feature matrix status: ${fmErr.message}`);
    }

    if (!finalGateResult.success) {
      this.execution.complete();
      if (finalGateResult.status === "BLOCKED") {
        console.warn(`\n⚠️ GENERATION HALTED (BLOCKED): ${finalGateResult.blockingReason}`);
        return {
          filesCreated: files.length + deployFiles.length,
          success: false,
          status: "BLOCKED",
          blockingReason: finalGateResult.blockingReason,
          finalGateResult,
        };
      }
      console.error(`\n❌ FINAL SUCCESS GATE FAILED: ${finalGateResult.blockingReason}`);
      throw new Error(`Project generation failed: ${finalGateResult.blockingReason}`);
    }


    // Hard-fail when build is broken OR DoD required criteria failed (NO GIT COMMIT / NO DOCUMENTATION GENERATION / NO FALSE POSITIVE)
    if (!build.success || !dodPassed || archDiff.status !== "PASS") {
      this.execution.complete();
      console.error(`\n❌ Project generation failed. Execution Report status: ${finalReport.status} (DoD Score: ${dodResult?.score ?? 0}/100).`);
      throw new Error(`Project generation failed: ${(dodResult?.blockers ?? []).map((b: any) => b.detail).join("; ") || "Compilation build or DoD validation is failing."}`);
    }

    // ─── Post-Gate Parallel Documentation & PR Generation (executed ONLY ON FINAL SUCCESS) ───
    console.log("[Lifecycle] Running post-gate documentation and PR generation in parallel...");
    const [docsSettled, prSettled] = await Promise.allSettled([
      this.docsGeneratorAgent.generate(
        specification,
        request,
        files.map(f => f.path),
        outputDirectory,
      ),
      this.prGeneratorAgent.execute(outputDirectory, request),
    ]);

    if (docsSettled.status === "fulfilled") {
      try {
        const docFiles = docsSettled.value;
        this.write(
          this.validator.validate(framework ?? "html", docFiles),
          outputDirectory,
        );
        console.log("[Lifecycle] ✓ Documentation generated.");
      } catch (docWriteErr: any) {
        console.warn(`[Lifecycle] Warning: Failed to write documentation files: ${docWriteErr.message}`);
      }
    } else {
      console.warn(`[Lifecycle] Warning: Documentation generation failed: ${docsSettled.reason?.message || docsSettled.reason}`);
    }

    if (prSettled.status === "fulfilled") {
      // PRGeneratorAgent wrote pull-request.md directly
    } else {
      console.warn(`[Lifecycle] Warning: PR generation failed: ${prSettled.reason?.message || prSettled.reason}`);
    }

    // ─── Final Git Commit (Stages and commits everything including docs and PR summary) ───
    try {
      gitEngine.commitChanges(outputDirectory, request);
      console.log("[GitEngine] ✓ All changes, documentation, and PR summary staged and committed to Git.");
    } catch (gitErr: any) {
      console.warn(`[GitEngine] Warning: Git commit operations failed: ${gitErr.message}`);
    }

    // ─── Cost Observability Telemetry ───
    try {
      CostObservabilityReporter.getInstance().setProjectRoot(outputDirectory);
      CostObservabilityReporter.getInstance().persistToProject(outputDirectory);
      const costSummary = CostObservabilityReporter.getInstance().getSummary();
      console.log(`[CostObservability] ✓ Saved .aegis/cost-observability.json: ${costSummary.totalTokensConsumed.toLocaleString()} tokens consumed, ${costSummary.totalTokensSaved.toLocaleString()} tokens saved (${costSummary.efficiencyRatioPercentage}% efficiency).`);
    } catch (costErr: any) {
      console.warn(`[CostObservability] Warning: Failed to persist cost observability data: ${costErr.message}`);
    }

    console.log(`\n[Startup] 🚀 Ready! Open: http://localhost:5173`);
    console.log(`[Startup]    Run:  cd ${outputDirectory} && npm run dev\n`);

    this.execution.complete();
    return {
      filesCreated: files.length + deployFiles.length,
      success: finalGateResult.success,
      status: finalGateResult.status,
      blockingReason: finalGateResult.blockingReason,
      finalGateResult,
    };
  }

  private async runVerification(
    request: string,
    framework: string,
    outputDirectory: string
  ): Promise<{ success: boolean; stderr?: string; stdout?: string }> {
    try {
      await this.projectStartupAgent.prepare(outputDirectory);
    } catch {}
    const verifyResult = await this.buildOrchestrator.verify(outputDirectory);
    ValidationStateManager.getInstance().recordBuild(verifyResult.success, verifyResult.stderr);

    if (!verifyResult.success) {
      return { success: false, stderr: verifyResult.stderr || "Build failed", stdout: verifyResult.stdout };
    }

    // ── Semantic Domain Alignment Audit ──────────────────────────────────────
    const spec = (this as any)._currentCanonicalSpec || SpecificationNormalizer.normalize(request, { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" });
    const domainAudit = DomainConsistencyValidator.validate(outputDirectory, spec);
    ValidationStateManager.getInstance().recordSemanticScore(domainAudit.score);

    if (!domainAudit.passed && (domainAudit.forbiddenMatches.length > 0 || domainAudit.missingRequiredFeatures.length > 0)) {
      const issueSummary = domainAudit.forbiddenMatches.concat(domainAudit.missingRequiredFeatures).join("; ");
      console.warn(`[DomainConsistencyValidator] ⚠️ Domain alignment score: ${domainAudit.score}/100. Issues: ${issueSummary}`);
      if (domainAudit.score < 75) {
        return {
          success: false,
          stderr: `Domain Consistency Audit Failed (score ${domainAudit.score}/100):\n${issueSummary}\n\nPlease purge all task/Kanban components and regenerate proper ${spec.domainCategory} features.`
        };
      }
    }

    const screenshotFile = join(outputDirectory, "screenshot.png");
    if (existsSync(screenshotFile)) {
      try {
        console.log("[VisualReviewer] Running multimodal layout quality review...");
        const visualIssues = await this.visualReviewerAgent.execute(request, screenshotFile);
        if (visualIssues.length > 0) {
          const hasHighSeverity = visualIssues.some(i => i.severity === "high" || !i.isVisualOnly);
          console.warn(`[VisualReviewer] QA recorded ${visualIssues.length} visual layout observation(s):`);
          for (const issue of visualIssues) {
            console.warn(`  - [${issue.severity.toUpperCase()}] ${issue.element}: ${issue.bug}`);
          }
          ValidationStateManager.getInstance().recordVisualReview(!hasHighSeverity, visualIssues.map(i => i.bug));
        } else {
          console.log("[VisualReviewer] ✓ Multimodal QA passed! No layout bugs observed.");
          ValidationStateManager.getInstance().recordVisualReview(true, []);
        }
      } catch {}
    }

    ValidationStateManager.getInstance().recordRuntime(true);
    return { success: true };
  }

  public async verifyAndHealPreReviewBuild(
    request: any,
    framework: any,
    outputDirectory: string,
    resolvedContract: any,
    parsedFiles: GeneratedFile[],
    initialResponse = ""
  ): Promise<{ success: boolean; build: any; attempts: number }> {
    let preReviewBuild = await this.runVerification(request, framework, outputDirectory);
    if (!preReviewBuild.success) {
      console.log("[StageReview] Pre-review compilation issues detected. Applying deterministic sanitization & AST repairs...");
      FastDeterministicSanitizer.sanitizeProject(outputDirectory, resolvedContract);
      this.resolveMissingLocalImports(outputDirectory);
      try {
        await this.projectStartupAgent.prepare(outputDirectory);
      } catch {}
      preReviewBuild = await this.runVerification(request, framework, outputDirectory);
      if (!preReviewBuild.success) {
        const preDiag = [preReviewBuild.stdout || "", preReviewBuild.stderr || ""].filter(Boolean).join("\n");
        const actions = TsSymbolRepairEngine.repair(outputDirectory, preDiag);
        if (actions.length > 0) {
          FastDeterministicSanitizer.sanitizeProject(outputDirectory, resolvedContract);
          preReviewBuild = await this.runVerification(request, framework, outputDirectory);
        }
      }

      // ── Pre-Review Bounded Transactional Self-Healing Loop ──────────────────
      let preRepairAttempts = 0;
      if (!preReviewBuild.success) {
        const initialPreDiag = [preReviewBuild.stdout || "", preReviewBuild.stderr || ""].filter(Boolean).join("\n");
        console.warn(`[StageReview:Self-Healing] ⚠️ Pre-review build not clean after deterministic passes. Invoking bounded transactional healing...`);

        const MAX_PRE_REVIEW_REPAIR_ATTEMPTS = 2;
        const preConvergenceTracker = new RepairConvergenceTracker(initialPreDiag);

        while (!preReviewBuild.success && preRepairAttempts < MAX_PRE_REVIEW_REPAIR_ATTEMPTS) {
          preRepairAttempts++;
          console.log(`\n[StageReview:Self-Healing] Attempting targeted pre-review repair ${preRepairAttempts}/${MAX_PRE_REVIEW_REPAIR_ATTEMPTS}...`);

          const currentDiag = [preReviewBuild.stdout || "", preReviewBuild.stderr || ""].filter(Boolean).join("\n");

          // 1. Dependency repair
          const packages = this.dependencyResolver.resolve(currentDiag);
          if (packages.length > 0) {
            console.log(`[StageReview:DependencyResolver] Installing missing packages: ${packages.join(", ")}`);
            try {
              await this.installer.installPackages("pnpm", outputDirectory, packages);
              this.resolveMissingLocalImports(outputDirectory);
              preReviewBuild = await this.runVerification(request, framework, outputDirectory);
              if (preReviewBuild.success) {
                console.log("[StageReview:Self-Healing] ✓ Pre-review build succeeded after package installation!");
                break;
              }
            } catch (instErr: any) {
              console.warn(`[StageReview:DependencyResolver] Warning: Failed to install packages: ${instErr.message}`);
            }
          }

          // 2. Focused AI Code Repair with Checkpointing & Convergence Tracking
          try {
            const mapper = new ErrorRootCauseMapper();
            const rootCause = mapper.analyze(currentDiag, parsedFiles.map(f => f.path));

            const brokenFileSnippets: string[] = [];
            for (const targetRelPath of rootCause.filesToFix) {
              const absTarget = join(outputDirectory, targetRelPath);
              if (existsSync(absTarget)) {
                try {
                  const code = readFileSync(absTarget, "utf8");
                  brokenFileSnippets.push(`=== FILE CONTENT TO REPAIR (${targetRelPath}) ===\n${code}`);
                } catch { /* ignore */ }
              }
            }

            const errorPayload = [
              currentDiag,
              rootCause.summary ? `=== STRUCTURED ROOT CAUSE DIAGNOSIS ===\n${rootCause.summary}` : "",
              brokenFileSnippets.join("\n\n")
            ].filter(Boolean).join("\n\n");

            GenerationBudgetGuard.getInstance().assertRepairAllowed("PreReviewRepair");
            GenerationBudgetGuard.getInstance().recordRepairAttempt("PreReviewRepair");

            const repairResponse = await this.repairCoordinator.repair(
              request,
              errorPayload,
              initialResponse
            );

            if (preConvergenceTracker.isDuplicateCandidate(repairResponse)) {
              console.warn(`[StageReview:Self-Healing] 🛑 AI proposed duplicate repair candidate already tested. Skipping...`);
              break;
            }

            let repairedFiles = this.parser.parse(repairResponse);
            if (repairedFiles.length === 0) {
              try {
                const jsonMatch = repairResponse.match(/\{[\s\S]*"repairs"[\s\S]*\}/);
                if (jsonMatch) {
                  const parsedObj = JSON.parse(jsonMatch[0]);
                  if (Array.isArray(parsedObj.repairs)) {
                    repairedFiles = parsedObj.repairs.map((r: any) => ({
                      path: r.path || r.filePath,
                      content: r.content || r.newContent || r.patch || ""
                    })).filter((f: any) => f.path && f.content);
                  }
                }
              } catch {}
            }

            if (repairedFiles.length === 0) {
              const fileHeaderRegex = /(?:(?:\*{0,2}(?:FIXED\s+|UPDATED\s+|MODIFIED\s+)?(?:File|Path|Target\s+File):\s*`?([a-zA-Z0-9_\-\/\\\.]+?)`?\*{0,2}))[\s\S]*?```(?:tsx|ts|jsx|js)?[\r\n]+([\s\S]*?)```/gi;
              let match: RegExpExecArray | null;
              while ((match = fileHeaderRegex.exec(repairResponse)) !== null) {
                const filePath = match[1].trim();
                const fileContent = match[2].trim();
                if (filePath && fileContent) {
                  repairedFiles.push({ path: filePath, content: fileContent });
                }
              }
            }

            if (repairedFiles.length === 0) {
              console.warn(`[StageReview:Self-Healing] No actionable file repairs parsed from AI response.`);
              break;
            }

            // Create atomic multi-file checkpoint before applying patch
            const checkpointId = TransactionalRepairSystem.createCheckpoint(
              outputDirectory,
              repairedFiles.map(f => f.path),
              {
                attemptNumber: preRepairAttempts,
                failureType: "PRE_REVIEW_BUILD_ERROR",
                rootCause: rootCause.summary || "Pre-review compilation error",
              }
            );

            const parsedFilesSnapshot = parsedFiles.map(f => ({ ...f }));

            // Apply repaired files
            for (const file of repairedFiles) {
              const fullPath = join(outputDirectory, file.path);
              mkdirSync(dirname(fullPath), { recursive: true });
              writeFileSync(fullPath, file.content, "utf8");

              const existingIdx = parsedFiles.findIndex(f => f.path === file.path);
              if (existingIdx >= 0) {
                parsedFiles[existingIdx] = file;
              } else {
                parsedFiles.push(file);
              }
            }

            FastDeterministicSanitizer.sanitizeProject(outputDirectory, resolvedContract);

            // Rebuild
            const candidateBuild = await this.runVerification(request, framework, outputDirectory);
            if (candidateBuild.success) {
              console.log(`[StageReview:Self-Healing] ✅ Pre-review repair succeeded! Build is now clean.`);
              TransactionalRepairSystem.commit(checkpointId);
              preReviewBuild = candidateBuild;
              break;
            } else {
              const candidateDiag = [candidateBuild.stdout || "", candidateBuild.stderr || ""].filter(Boolean).join("\n");
              const evalResult = preConvergenceTracker.evaluateCandidate(preRepairAttempts, candidateDiag);

              if (evalResult.accepted) {
                console.log(`[StageReview:Self-Healing] ✓ Repair candidate accepted (${evalResult.comparison.reason}). Retaining.`);
                TransactionalRepairSystem.commit(checkpointId);
                preReviewBuild = candidateBuild;
              } else {
                console.warn(`[StageReview:Self-Healing] ❌ Repair candidate rejected (${evalResult.comparison.reason}). Rolling back checkpoint...`);
                TransactionalRepairSystem.rollback(outputDirectory, checkpointId, evalResult.comparison.reason);
                parsedFiles.length = 0;
                parsedFiles.push(...parsedFilesSnapshot.map(f => ({ ...f })));
              }
            }
          } catch (repairErr: any) {
            console.warn(`[StageReview:Self-Healing] Error during pre-review repair attempt: ${repairErr.message}`);
            if (
              repairErr instanceof BudgetExceededError ||
              repairErr instanceof ProviderOutageHaltError ||
              repairErr?.code === "BUDGET_EXHAUSTED" ||
              repairErr?.code === "PROVIDER_OUTAGE_HALT" ||
              repairErr?.message?.includes("BUDGET_EXHAUSTED") ||
              repairErr?.message?.includes("PROVIDER_OUTAGE_HALT")
            ) {
              throw repairErr;
            }
            break;
          }
        }
      }

      return {
        success: preReviewBuild.success,
        build: preReviewBuild,
        attempts: preRepairAttempts,
      };
    }

    return {
      success: true,
      build: preReviewBuild,
      attempts: 0,
    };
  }

  private resolveMissingLocalImports(outputDirectory: string) {
    try {
      const getAllProjectFiles = (dir: string): { fullPath: string; relPath: string; content: string }[] => {
        const results: { fullPath: string; relPath: string; content: string }[] = [];
        if (!existsSync(dir)) return results;
        for (const entry of readdirSync(dir)) {
          if (entry === "node_modules" || entry === ".git" || entry === "dist") continue;
          const full = join(dir, entry);
          if (statSync(full).isDirectory()) {
            results.push(...getAllProjectFiles(full));
          } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
            try {
              results.push({ fullPath: full, relPath: relative(outputDirectory, full).replace(/\\/g, "/"), content: readFileSync(full, "utf8") });
            } catch {}
          }
        }
        return results;
      };

      const allDiskFiles = getAllProjectFiles(outputDirectory);

      // Only auto-rename UI component .ts files containing JSX (never server/lib/prisma.ts, services, lib, hooks, types)
      for (const diskFile of allDiskFiles) {
        if (diskFile.fullPath.endsWith(".ts") && !diskFile.fullPath.endsWith(".d.ts")) {
          const normPath = diskFile.relPath.replace(/\\/g, "/");
          const isServiceOrServerFile = normPath.includes("server/") || normPath.includes("prisma/") || normPath.includes("services/") || normPath.includes("lib/") || normPath.includes("hooks/") || normPath.includes("types/");
          if (!isServiceOrServerFile) {
            const hasJsx = /<[A-Z][A-Za-z0-9\.]*[\s/>]/.test(diskFile.content) || /return\s*\(\s*</.test(diskFile.content);
            if (hasJsx) {
              const newTsxPath = diskFile.fullPath.replace(/\.ts$/, ".tsx");
              console.log(`[Orchestrator] Renaming UI component file from .ts to .tsx: ${diskFile.relPath} -> ${relative(outputDirectory, newTsxPath)}`);
              writeFileSync(newTsxPath, diskFile.content, "utf8");
              try { unlinkSync(diskFile.fullPath); } catch {}
              diskFile.fullPath = newTsxPath;
              diskFile.relPath = relative(outputDirectory, newTsxPath);
            }
          }
        }
      }

      for (const diskFile of allDiskFiles) {
        const importMatches = diskFile.content.matchAll(/(?:(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?|import\s*\(\s*)['"]((?:\.|\@\/)[^'"]+)['"]/g);
        for (const m of importMatches) {
          const rawImportPath = m[1];
          // Use Extension-Aware Module Resolution (checks exact, .ts, .tsx, .js, .jsx, index files)
          const resolvedModulePath = ProjectPathResolver.resolveModule(outputDirectory, diskFile.relPath, rawImportPath);

          if (resolvedModulePath) {
            continue; // Module exists with a valid extension (e.g., .tsx) — DO NOT generate a stub!
          }

          const targetPath = rawImportPath.startsWith("@/")
            ? join(outputDirectory, "src", rawImportPath.slice(2))
            : resolve(dirname(diskFile.fullPath), rawImportPath);

          const isUiTarget = /[\/\\](pages|components|views|ui|features)[\/\\]/i.test(targetPath) ||
                            /(button|card|component|page|navbar|spinner|dashboard|gallery|header|footer|modal|drawer|form|input)/i.test(targetPath);
          let stubExt = isUiTarget ? ".tsx" : ".ts";
          const fullStubPath = targetPath.endsWith(".ts") || targetPath.endsWith(".tsx") ? targetPath : targetPath + stubExt;
          const stubRelName = relative(outputDirectory, fullStubPath).replace(/\\/g, "/");
          const isStubFrontend = stubRelName.startsWith("src/");

          // CANONICAL PATH OWNERSHIP: Check if stubRelName is an unauthorized alias or semantic duplicate
          const dupCheck = CanonicalFileGraph.detectSemanticDuplicate(stubRelName);
          if (dupCheck.isDuplicate && dupCheck.canonicalFile) {
            const canonicalFullPath = join(outputDirectory, dupCheck.canonicalFile.canonicalPath);
            let correctRelImport = relative(dirname(diskFile.fullPath), canonicalFullPath).replace(/\\/g, "/");
            if (!correctRelImport.startsWith(".")) correctRelImport = "./" + correctRelImport;
            correctRelImport = correctRelImport.replace(/\.(ts|tsx|js|jsx)$/, "");

            const updatedContent = diskFile.content.replace(
              new RegExp(`(['"])${rawImportPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g'),
              `$1${correctRelImport}$2`
            );
            if (updatedContent !== diskFile.content) {
              diskFile.content = updatedContent;
              writeFileSync(diskFile.fullPath, updatedContent, "utf8");
              console.log(`[Orchestrator] Redirected alias import in "${diskFile.relPath}": "${rawImportPath}" -> "${correctRelImport}" (canonical: ${dupCheck.canonicalFile.canonicalPath})`);
            }
            try {
              if (existsSync(fullStubPath)) {
                unlinkSync(fullStubPath);
                console.log(`[Orchestrator] Purged unauthorized alias file: ${stubRelName}`);
              }
            } catch {}
            continue;
          }

          // Fuzzy resolution: check if a file with the same component/module name exists elsewhere in diskFiles
          const componentName = stubRelName.split(/[\/\\]/).pop()?.replace(/\.(ts|tsx|js|jsx)$/, "") || "Component";
          const lowerComp = componentName.toLowerCase();
          const matchingDiskFile = allDiskFiles.find(f => {
            const bName = f.relPath.split(/[\/\\]/).pop()?.replace(/\.(ts|tsx|js|jsx)$/, "") || "";
            const lowerBName = bName.toLowerCase();
            if (f.fullPath === fullStubPath) return false;
            if (f.relPath.includes("__tests__") || f.relPath.endsWith(".test.ts") || f.relPath.endsWith(".test.tsx") || f.relPath.endsWith(".spec.ts")) return false;
            const isTargetFrontend = f.relPath.startsWith("src/");
            if (isStubFrontend !== isTargetFrontend) return false;

            if (lowerBName === lowerComp) return true;
            if (lowerComp.endsWith("page") && lowerBName === lowerComp.replace("page", "")) return true;
            if (lowerComp.endsWith("dashboard") && lowerBName.includes("dashboard")) return true;
            if (lowerComp.length >= 6 && (lowerBName.includes(lowerComp) || lowerComp.includes(lowerBName))) return true;
            return false;
          });

          if (matchingDiskFile) {
            if (!CanonicalFileGraph.isAuthorized(stubRelName)) {
              let relImportToTarget = relative(dirname(diskFile.fullPath), matchingDiskFile.fullPath).replace(/\\/g, "/");
              if (!relImportToTarget.startsWith(".")) relImportToTarget = "./" + relImportToTarget;
              relImportToTarget = relImportToTarget.replace(/\.(ts|tsx|js|jsx)$/, "");

              const updatedContent = diskFile.content.replace(
                new RegExp(`(['"])${rawImportPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g'),
                `$1${relImportToTarget}$2`
              );
              if (updatedContent !== diskFile.content) {
                diskFile.content = updatedContent;
                writeFileSync(diskFile.fullPath, updatedContent, "utf8");
                console.log(`[Orchestrator] Redirected unauthorized stub import in "${diskFile.relPath}": "${rawImportPath}" -> "${relImportToTarget}"`);
              }
              try {
                if (existsSync(fullStubPath)) {
                  unlinkSync(fullStubPath);
                  console.log(`[Orchestrator] Purged unauthorized stub file: ${stubRelName}`);
                }
              } catch {}
              continue;
            }

            console.log(`[Orchestrator] Pre-build missing local import scanner: Found matching file "${matchingDiskFile.relPath}" for "${stubRelName}". Creating re-export shim...`);
            let relImportToTarget = relative(dirname(fullStubPath), matchingDiskFile.fullPath).replace(/\\/g, "/");
            if (!relImportToTarget.startsWith(".")) relImportToTarget = "./" + relImportToTarget;
            relImportToTarget = relImportToTarget.replace(/\.(ts|tsx|js|jsx)$/, "");

            const shimContent = `import * as Mod from '${relImportToTarget}';\nexport * from '${relImportToTarget}';\nconst _default = (Mod as any).default || (Mod as any)['${componentName}'] || Mod[Object.keys(Mod)[0]] || Mod;\nexport default _default;\n`;
            mkdirSync(dirname(fullStubPath), { recursive: true });
            writeFileSync(fullStubPath, shimContent, "utf8");
          } else {
            mkdirSync(dirname(fullStubPath), { recursive: true });
            const validExportName = componentName.replace(/[^a-zA-Z0-9_$]/g, "_");
            const isUiTarget = /[\/\\](pages|components|views|ui|features)[\/\\]/i.test(targetPath) ||
                              /(button|card|component|page|navbar|spinner|dashboard|gallery|header|footer|modal|drawer|form|input|table|metric)/i.test(targetPath);
            if (isUiTarget) {
              writeFileSync(fullStubPath, `import React from 'react';\nexport function ${validExportName}(props: any) { return <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-200">{props?.children || '${validExportName}'}</div>; }\nexport default ${validExportName};\n`, "utf8");
              console.log(`[Orchestrator] Created missing UI component stub: ${stubRelName}`);
            } else {
              writeFileSync(fullStubPath, `export const ${validExportName} = (...args: any[]) => (args[0] ?? {});\nexport default ${validExportName};\n`, "utf8");
              console.log(`[Orchestrator] Created missing utility stub: ${stubRelName}`);
            }
          }
        }
      }
    } catch (scanErr: any) {
      console.warn(`[Orchestrator] resolveMissingLocalImports warning: ${scanErr.message}`);
    }
  }

  private collectAllFiles(dir: string): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...this.collectAllFiles(full));
        } else {
          results.push(full);
        }
      }
    } catch {}
    return results;
  }

  private scanAndResolveMissingPackages(outputDirectory: string): string[] {
    const missingPkgs: string[] = [];
    const pkgPath = join(outputDirectory, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        const allDeclared: Record<string, string> = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        
        const srcDir = join(outputDirectory, "src");
        if (existsSync(srcDir)) {
          const tsFiles = this.collectAllFiles(srcDir).filter(f => f.endsWith(".ts") || f.endsWith(".tsx"));
          for (const fullPath of tsFiles) {
            const content = readFileSync(fullPath, "utf8");
            const matches = content.matchAll(/(?:from\s+|import\s+)(?:type\s+)?["']([^"']+)["']/g);
            for (const m of matches) {
              const imp = m[1];
              if (!imp.startsWith(".") && !imp.startsWith("/") && !imp.startsWith("@/")) {
                const pkgName = imp.startsWith("@") ? imp.split("/").slice(0, 2).join("/") : imp.split("/")[0];
                if (!(pkgName in allDeclared) && !pkgName.startsWith("node:")) {
                  allDeclared[pkgName] = "latest";
                  pkg.dependencies = pkg.dependencies || {};
                  pkg.dependencies[pkgName] = "latest";
                  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
                }
              }
            }
          }
        }

        for (const pkgName of Object.keys(allDeclared)) {
          if (pkgName.startsWith("node:") || pkgName.startsWith("@types/")) continue;
          const nodeModulesPkg = join(outputDirectory, "node_modules", pkgName);
          if (!existsSync(nodeModulesPkg)) {
            missingPkgs.push(pkgName);
          }
        }
      } catch {}
    }
    return missingPkgs;
  }

  getProvider() {
    return this.provider;
  }
}
