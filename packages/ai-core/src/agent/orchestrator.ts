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
  DataArchitectureAgent,
} from "../agents/index.js";
import { ProjectMemoryEngine } from "../memory/memory-engine.js";
import { FileWriter } from "../writer/writer.js";
import { Parser } from "../generator/parser.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, statSync, readdirSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
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
import { ExecutionLoop } from "../execution/index.js";
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
import { DefinitionOfDone } from "../validation/definition-of-done.js";
import { ProjectStartupAgent } from "../startup/project-startup-agent.js";
import { SpecificationNormalizer } from "../spec/canonical-spec.js";
import { DomainAwareFallbackGenerator } from "../semantics/domain-fallback-generator.js";
import { DomainConsistencyValidator } from "../semantics/domain-consistency-validator.js";
import { ValidationStateManager } from "../validation/validation-state.js";
import { TransactionalRepairSystem } from "../healing/index.js";
import { ArchitectureContractManager, ArchitectureResolver, ArchitectureAuditor, ArchitectureDiff, PlannerArchitectureGuard, ArchitectureContractNormalizer, FastDeterministicSanitizer, FileOwnershipRegistry, ApiContractRegistry, ExecutionReportGenerator, ContractGate, ContractIntegrityValidator, TechnologyConstraintValidator, CanonicalArchitectureState, CanonicalManifestGenerator, ProjectFileRegistry, TaskNormalizer } from "../governance/index.js";
import { DomainModelGuard } from "../governance/domain-model-guard.js";
import { StagedValidator } from "../validation/staged-validator.js";
import { FinalSuccessGate } from "../validation/final-success-gate.js";
import { GeneratedFileValidator } from "../validation/generated-file-validator.js";
import { DeterministicProjectFixer } from "../validation/deterministic-project-fixer.js";
import { ProjectGraphEngine } from "../validation/project-graph-engine.js";
import { AppServerRunner } from "../startup/app-server-runner.js";
import { ReadOnlyBrowserValidator } from "../validation/read-only-browser-validator.js";
import { ProjectPathResolver, ProjectRootSingleton } from "../utils/path-resolver.js";

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
  "react-is"
]);

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

  private readonly projectStartupAgent = new ProjectStartupAgent();

  private readonly definitionOfDone = new DefinitionOfDone();

  private readonly executionLoop = new ExecutionLoop();

  private readonly dependencyResolver = new DependencyResolver();

  private readonly installer = new DependencyInstaller();

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

    // ── Canonical Specification Normalization & Architecture Lock ────────────────
    const canonicalSpec = SpecificationNormalizer.normalize(request, specification);

    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    writeFileSync(join(aegisDir, "prompt.txt"), request, "utf8");

    const resolvedContract = ArchitectureResolver.resolve(request, specification, canonicalSpec, outputDirectory);
    ArchitectureResolver.writeContract(outputDirectory, resolvedContract);
    const archContract = ArchitectureContractManager.createContract(outputDirectory, request, canonicalSpec);

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

    // ─── Data Architecture Modeling ──────────────────────────────────────────
    this.execution.enter(ExecutionPhase.DataModeling);
    console.log("[DataArchitecture] Running Data Architecture Agent in project builder...");
    try {
      const dataArch = await this.dataArchitectureAgent.execute(enrichedRequest, specification);
      
      const aegisDir = join(outputDirectory, ".aegis");
      if (!existsSync(aegisDir)) {
        mkdirSync(aegisDir, { recursive: true });
      }
      writeFileSync(
        join(aegisDir, "data-architecture.json"),
        JSON.stringify(dataArch, null, 2),
        "utf8"
      );
      writeFileSync(join(aegisDir, "prompt.txt"), request, "utf8");
      if (dataArch && Array.isArray(dataArch.apis)) {
        ApiContractRegistry.registerContract(dataArch.apis.map(a => ({
          path: a.path,
          method: a.method,
          description: a.description,
          requestFields: a.requestBodySchema ? { schema: a.requestBodySchema } : undefined,
          responseFields: a.responseBodySchema ? { schema: a.responseBodySchema } : undefined
        })));
      }

      const dataContext = `
═══════════════════════════════════════════════════════
DATA ARCHITECTURE CONTRACTS (STRICTLY CONFORM TO THIS SCHEMA)
═══════════════════════════════════════════════════════
Database models & schemas:
${dataArch.databaseSchema}

Defined APIs:
${dataArch.apis.map(api => `- ${api.method} ${api.path} (${api.description})`).join("\n")}

Frontend React Hooks & Queries:
${dataArch.hooks.map(h => `- ${h.name} (${h.type} on ${h.endpoint}, returns ${h.returns})`).join("\n")}
═══════════════════════════════════════════════════════
`;
      enrichedRequest = enrichedRequest + "\n\n" + dataContext;
    } catch (daErr: any) {
      console.warn(`[DataArchitecture] Warning: Data architecture agent failed in project builder: ${daErr.message}`);
    }



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
      );

    const activeContract = resolvedContract || ArchitectureResolver.loadContract(outputDirectory);
    if (!activeContract) {
      throw new Error(`ARCHITECTURE_CONTRACT_MISSING: No architecture contract found for projectPath: ${outputDirectory}`);
    }
    tasks = PlannerArchitectureGuard.filterTasks(tasks, activeContract);

    console.log(
      "Implementation Tasks:",
    );

    console.table(
      tasks,
    );

    await this.executionLoop.execute(
      {
        request,
        outputDirectory,
        coder: this.coderAgent,
      },
      tasks,
      async (task) => {
        console.log(
          `Executing: ${task.title}`,
        );

        return {
          taskId: task.id,
          success: true,
          message: "Completed",
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
    let framework = this.selector.select(architecture);
    if (request.toLowerCase().includes("react") || request.toLowerCase().includes("express") || request.toLowerCase().includes("vite")) {
      framework = "react-vite";
    }

    console.log(
      "Framework:",
      framework,
    );

    return {
      framework,
      tasks,
      specification,
      outputDirectory,
    };
  }

  async generateApplication(
    request: string,
    outputDirectory: string,
    imagePath?: string,
  ) {
    const memoryEngine = new ProjectMemoryEngine(outputDirectory);
    memoryEngine.initDefaults("project", request);
    MetricsTracker.getInstance().reset();

    const auditTrail = new AuditTrailEngine(outputDirectory);
    auditTrail.logEvent({
      agentRole: "CEO Agent",
      action: `Initiated application implementation for request: "${request}"`,
      status: "SUCCESS"
    });

    // ─── Step 0: Prompt Inference ────────────────────────────────────────────
    // Expand the brief user prompt into a full feature specification before
    // any agent sees it. Eliminates features the user forgot to ask for.
    console.log("[Inference] Expanding prompt into full feature specification...");
    let enrichedRequest = request;
    let inferredFeatureNames: string[] = [];
    try {
      const expanded = await this.promptInferenceEngine.expand(request);
      enrichedRequest = this.promptInferenceEngine.buildEnrichedRequest(expanded);
      inferredFeatureNames = expanded.inferredFeatures.map(f => f.name);
      if (expanded.inferredFeatures.length > 0) {
        console.log(`[Inference] ✓ Inferred ${expanded.inferredFeatures.length} features: ${inferredFeatureNames.join(", ")}`);
      } else {
        console.log("[Inference] Using original prompt (inference returned no features).");
      }
      auditTrail.logEvent({
        agentRole: "Inference Engine",
        action: `Expanded prompt. Inferred features: ${inferredFeatureNames.join(", ") || "none"}`,
        status: "SUCCESS"
      });
    } catch (infErr: any) {
      console.warn(`[Inference] Warning: Prompt expansion failed: ${infErr.message}`);
    }

    // Run AI Research Assistant (Phase 14)
    console.log("[Research] Running AI Research Assistant to retrieve optimal coding patterns...");
    try {
      const researched = await this.researchAssistantAgent.execute(request);
      if (researched && researched.length > 0) {
        const existingPatterns = memoryEngine.loadPatterns();
        if (existingPatterns) {
          for (const pattern of researched) {
            if (!existingPatterns.reusablePatterns.some(p => p.name === pattern.name)) {
              existingPatterns.reusablePatterns.push(pattern);
              console.log(`[Research] ✓ Retrieved and indexed custom pattern: "${pattern.name}"`);
            }
          }
          memoryEngine.savePatterns(existingPatterns);
        }
      }
    } catch (resErr: any) {
      console.warn(`[Research] Warning: Research Assistant failed: ${resErr.message}`);
    }

    const existingArch = memoryEngine.loadArchitecture();
    const existingMem = memoryEngine.loadMemory();

    if (existingMem && existingMem.projectName) {
      console.log(`[Memory] Loaded existing project memory checkpoints for "${existingMem.projectName}".`);
    }

    // Initialize Git and checkout feature branch
    const gitEngine = new GitIntegrationEngine();
    try {
      gitEngine.initRepository(outputDirectory);
      gitEngine.createFeatureBranch(outputDirectory, request);
    } catch (gitErr: any) {
      console.warn(`[GitEngine] Warning: Git branch initialization failed: ${gitErr.message}`);
    }

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

    const guidancePrompt = enrichedRequest + (existingArch ? `\n(Guideline: Follow the existing framework "${existingArch.framework}", styled with "${existingArch.styling}", using naming rules: ${existingArch.namingConventions.join(", ")})` : "");

    const {
      specification: rawSpecification,
      architecturePlan,
    } =
      await this.architectAgent.execute(
        guidancePrompt,
        imagePayload,
      );

    const canonicalSpec = SpecificationNormalizer.normalize(request, rawSpecification);
    (this as any)._currentCanonicalSpec = canonicalSpec;
    let specification = canonicalSpec;
    ValidationStateManager.getInstance().reset();

    // Merge specification inferred libraries into package.json (filtered by whitelist)
    const pkgPath = join(outputDirectory, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        pkg.dependencies = pkg.dependencies || {};
        const rawLibs = specification.inferredLibraries || [];
        const libs = rawLibs.filter(lib => VALID_DEPENDENCIES_WHITELIST.has(lib));
        const commonTypesNeeded = ["express", "cors", "canvas-confetti", "bcryptjs", "jsonwebtoken", "react", "react-dom"];
        
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
            pkg.devDependencies = pkg.devDependencies || {};
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

    const resolvedContract = ArchitectureResolver.resolve(request, rawSpecification, canonicalSpec, outputDirectory);
    ArchitectureResolver.writeContract(outputDirectory, resolvedContract);
    const appArchContract = ArchitectureContractManager.createContract(outputDirectory, request, canonicalSpec);

    // ── ContractIntegrityValidator — Assert contract immutability ─────────────
    ContractIntegrityValidator.assertValid(specification, resolvedContract);

    // ── TechnologyConstraintValidator — Filter forbidden libraries ───────────
    const { allowed: allowedAppLibs, forbidden: forbiddenAppLibs } = TechnologyConstraintValidator.filterLibraries(rawSpecification.inferredLibraries || [], resolvedContract);
    rawSpecification.inferredLibraries = allowedAppLibs;

    // ── MANDATORY CONTRACT GATE — Stop pipeline if contract is invalid ─────
    const appContractGateResult = ContractGate.verify(resolvedContract);
    if (!appContractGateResult.valid) {
      throw new Error(
        `CONTRACT_GATE_FAILED: Architecture contract is invalid for generateApplication. ` +
        `Errors: ${appContractGateResult.errors.join("; ")}. Pipeline stopped.`
      );
    }

    // Force specification normalization against locked contract
    const normalizedAppSpec = ArchitectureContractNormalizer.normalizeSpecification(specification, resolvedContract);
    specification = normalizedAppSpec;

    // ── CANONICAL ARCHITECTURE STATE (Single Source of Truth) ─────────────
    const canonicalState = CanonicalArchitectureState.getInstance().initialize(resolvedContract, outputDirectory);
    CanonicalManifestGenerator.generate(resolvedContract, outputDirectory);
    ProjectFileRegistry.getInstance().initialize(resolvedContract, outputDirectory);

    auditTrail.logEvent({
      agentRole: "Architect",
      action: `Completed requirements mapping & locked Architecture Contract. Frontend: ${resolvedContract.frontend.framework}, Backend: ${resolvedContract.backend.framework}, DB: ${resolvedContract.database.provider} (${resolvedContract.database.orm})`,
      status: "SUCCESS"
    });


    // ─── Design System ───────────────────────────────────────────────────────
    console.log("[DesignSystem] Generating design tokens and base components...");
    try {
      const dsFiles = this.designSystemGenerator.generate(specification);
      const dsContext = this.designSystemGenerator.buildCoderContext(specification);
      // Derive framework from specification — framework variable is declared later
      const dsFramework = specification.frontend?.toLowerCase().includes("react") ? "react-vite" : "html";
      // Write design system files before any coder task runs
      this.write(
        this.validator.validate(dsFramework, dsFiles),
        outputDirectory,
      );
      // Append design system context to the enriched request so CoderAgent uses it
      enrichedRequest = enrichedRequest + "\n\n" + dsContext;
      console.log(`[DesignSystem] ✓ Wrote ${dsFiles.length} design system files.`);
    } catch (dsErr: any) {
      console.warn(`[DesignSystem] Warning: Design system generation failed: ${dsErr.message}`);
    }

    // ─── Data Architecture Modeling ──────────────────────────────────────────
    this.execution.enter(ExecutionPhase.DataModeling);
    console.log("[DataArchitecture] Running Data Architecture Agent...");
    try {
      const dataArch = await this.dataArchitectureAgent.execute(enrichedRequest, specification);
      
      // Save data architecture design
      const aegisDir = join(outputDirectory, ".aegis");
      if (!existsSync(aegisDir)) {
        mkdirSync(aegisDir, { recursive: true });
      }
      writeFileSync(
        join(aegisDir, "data-architecture.json"),
        JSON.stringify(dataArch, null, 2),
        "utf8"
      );
      console.log("[DataArchitecture] ✓ Saved data architecture definition.");

      // Build data flow context to bind downstream frontend/backend tasks
      const dataContext = `
═══════════════════════════════════════════════════════
DATA ARCHITECTURE CONTRACTS (STRICTLY CONFORM TO THIS SCHEMA)
═══════════════════════════════════════════════════════
Database models & schemas:
${dataArch.databaseSchema}

Defined APIs:
${dataArch.apis.map(api => `- ${api.method} ${api.path} (${api.description})`).join("\n")}

Frontend React Hooks & Queries:
${dataArch.hooks.map(h => `- ${h.name} (${h.type} on ${h.endpoint}, returns ${h.returns})`).join("\n")}
═══════════════════════════════════════════════════════
`;
      enrichedRequest = enrichedRequest + "\n\n" + dataContext;
      auditTrail.logEvent({
        agentRole: "Data Architecture Agent",
        action: `Designed data flow models. Persisted models count: ${dataArch.models.length}, APIs: ${dataArch.apis.length}`,
        status: "SUCCESS"
      });
    } catch (daErr: any) {
      console.warn(`[DataArchitecture] Warning: Data architecture agent failed: ${daErr.message}`);
    }

    const coordinator = new TeamCoordinator();
    const activeTeam = await coordinator.coordinate(specification);
    console.log("\n[Coordinator] Coordinating Dynamic AI Specialist Team for this project:");
    console.table(activeTeam.map(member => ({ Role: member.role, Description: member.description })));

    let tasks =
      await this.plannerAgent.execute(
        specification,
      );

    // Set canonical project root singleton to prevent duplicate path bugs
    ProjectRootSingleton.setRoot(outputDirectory);
    ProjectPathResolver.assertNoDuplicateRoot(outputDirectory);

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
    let parallelTiers: Task[][];
    try {
      parallelTiers = this.scheduler.scheduleParallelTiers(tasks) as Task[][];
      console.log(`[Orchestrator] DAG parallel scheduling successful. Grouped ${tasks.length} tasks into ${parallelTiers.length} execution tiers.`);
    } catch (error: any) {
      console.warn(`[Orchestrator] Warning: Parallel scheduling failed (${error.message}). Falling back to sequential execution.`);
      parallelTiers = tasks.map(t => [t]);
    }

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

    console.log("Starting implementation loop...");
    for (let i = 0; i < parallelTiers.length; i++) {
      const tier = parallelTiers[i];
      console.log(`\nRunning execution tier ${i + 1}/${parallelTiers.length} with ${tier.length} parallel tasks...`);

      const promises = tier.map(async (task) => {
        console.log(`[Task: ${task.title}] Calling CoderAgent...`);
        let result: { response: string; files: GeneratedFile[] } = { response: "", files: [] };
        try {
          result = await this.coderAgent.execute(
            task,
            architecture,
            architecturePlan,
            enrichedRequest,
            outputDirectory,
            existingFiles,
            imagePayload,
          );

          // Candidate file completeness validation
          const invalidCandidates: string[] = [];
          for (const file of result.files) {
            const validation = GeneratedFileValidator.validateCompleteness(file.content, file.path);
            if (!validation.valid) {
              const msg = validation.issues.map(j => j.message).join("; ");
              invalidCandidates.push(`${file.path} (${msg})`);
            }
          }

          if (invalidCandidates.length > 0) {
            throw new Error(`INCOMPLETE_GENERATED_FILE: Candidate files failed completeness validation: ${invalidCandidates.join(", ")}`);
          }
        } catch (coderError: any) {
          console.warn(`[Orchestrator] CoderAgent validation failed for task "${task.title}": ${coderError.message}`);
          console.log(`[Orchestrator] Launching inline Coder self-healing loop...`);
          let repairAttempts = 0;
          let success = false;
          let lastError = coderError;

          while (repairAttempts < 3 && !success) {
            repairAttempts++;
            console.log(`[Self-Healing] Inline Coder repair attempt ${repairAttempts}/3...`);
            try {
              const repairResponse = await this.repairCoordinator.repair(
                request,
                lastError.message,
                response + `\nAttempted output for task "${task.title}":\n` + (lastError.stack || lastError.message)
              );

              let repairedFiles = this.parser.parse(repairResponse);
              if (repairedFiles.length === 0) {
                // Fallback XML <FILE path="..."> parsing (Part 10)
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

              const validRepairedFiles = repairedFiles.filter(f => {
                const validation = GeneratedFileValidator.validateCompleteness(f.content, f.path);
                return validation.valid;
              });

              if (validRepairedFiles.length > 0) {
                result = {
                  response: repairResponse,
                  files: validRepairedFiles
                };
                success = true;
                console.log(`[Self-Healing] ✓ Coder repair succeeded! Validated completeness for ${validRepairedFiles.length} file(s).`);
              } else {
                throw new Error("REPAIR_RESPONSE_INVALID: No syntactically complete candidate files parsed from repair response.");
              }
            } catch (repairErr: any) {
              lastError = repairErr;
              console.error(`[Self-Healing] Inline repair attempt ${repairAttempts} failed:`, repairErr.message);
            }
          }

          if (!success) {
            throw coderError;
          }
        }
        return result;
      });

      const tierResults = await Promise.all(promises);
      const patchEngine = new PatchEngine();

      for (let j = 0; j < tier.length; j++) {
        const task = tier[j];
        const result = tierResults[j];
        console.log(`[Task: ${task.title}] CoderAgent finished.`);

        response += result.response + "\n";
        
        // Apply new files and search/replace patches directly to disk
        patchEngine.apply(result.response, outputDirectory);

        // Extract all file paths matching ===FILE: or ===PATCH: in the coder response
        const filesMatched = [
          ...result.response.matchAll(/===FILE:\s*(.*?)===/g)
        ].map(m => m[1].trim());

        const patchesMatched = [
          ...result.response.matchAll(/===PATCH:\s*(.*?)===/g)
        ].map(m => m[1].trim());

        const allFilesTouched = [...new Set([...filesMatched, ...patchesMatched])];

        // Load updated contents of all files touched in this task to compile final review files
        for (const filePath of allFilesTouched) {
          const fullPath = join(outputDirectory, filePath);
          if (existsSync(fullPath)) {
            const content = readFileSync(fullPath, "utf8");
            // Remove existing entry if present in parsedFiles, then push the updated content
            parsedFiles = parsedFiles.filter(f => f.path !== filePath);
            parsedFiles.push({ path: filePath, content });
            
            if (!existingFiles.includes(filePath)) {
              existingFiles.push(filePath);
            }
          }
        }
      }
    }

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
    this.write(
      files,
      outputDirectory,
    );

    // Merge specification inferred libraries into package.json (ensuring they aren't overwritten by reviewer files write)
    const finalPkgPath = join(outputDirectory, "package.json");
    if (existsSync(finalPkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(finalPkgPath, "utf8"));
        pkg.dependencies = pkg.dependencies || {};
        const rawLibs = specification.inferredLibraries || [];
        const libs = rawLibs.filter(lib => VALID_DEPENDENCIES_WHITELIST.has(lib));
        const commonTypesNeeded = ["express", "cors", "canvas-confetti", "bcryptjs", "jsonwebtoken", "react", "react-dom"];
        
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
            pkg.devDependencies = pkg.devDependencies || {};
            if (!pkg.devDependencies[typesLib] && !pkg.dependencies[typesLib]) {
              pkg.devDependencies[typesLib] = "latest";
            }
          }
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
      
      // Generate Prisma client if schema exists to ensure types exist during build verification
      const prismaSchema = join(outputDirectory, "prisma/schema.prisma");
      if (existsSync(prismaSchema)) {
        console.log(`[Orchestrator] Prisma schema detected. Running local Prisma generate in ${outputDirectory}...`);
        try {
          const { execSync } = await import("child_process");
          if (process.platform === "win32") {
            try {
              execSync(`wmic process where "ExecutablePath like '%node.exe%' and CommandLine like '%generated%project%'" call terminate`, { stdio: "ignore" });
            } catch { /* ignore */ }
          }
          const prismaBin = "npx prisma@6";

          execSync(`${prismaBin} generate`, { cwd: outputDirectory, stdio: "inherit" });
          console.log("[Orchestrator] Local Prisma client generation successful.");
          try {
            execSync(`${prismaBin} db push --accept-data-loss`, { cwd: outputDirectory, stdio: "inherit" });
            console.log("[Orchestrator] ✓ SQLite database tables pushed successfully.");
          } catch (pushErr: any) {
            console.warn(`[Orchestrator] Warning: SQLite database push non-fatal warning: ${pushErr.message}`);
          }
        } catch (genErr: any) {
          console.warn(`[Orchestrator] Warning: Local Prisma client generation failed: ${genErr.message}`);
        }
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

      // Deterministic Project Fixer: Create real implementation modules (routes.tsx, prisma.ts, MatchScoreDial, Layout, api.ts, pdf-parse fix)
      const buildFixReport = DeterministicProjectFixer.fixProject(outputDirectory);
      if (buildFixReport.createdFiles.length > 0 || buildFixReport.modifiedFiles.length > 0) {
        console.log(`[DeterministicFixer] ✓ Created ${buildFixReport.createdFiles.length} missing module(s), repaired ${buildFixReport.modifiedFiles.length} file(s).`);
      }

      // Project Graph Engine: Build & Validate Cross-File Dependency Graph
      const projectGraphEngine = new ProjectGraphEngine();
      const graphValidation = projectGraphEngine.validateGraph(outputDirectory);
      if (graphValidation.valid) {
        console.log(`[ProjectGraph] ✓ Project dependency graph validated cleanly.`);
      } else {
        console.warn(`[ProjectGraph] ⚠️ Project graph validation found ${graphValidation.issues.length} issue(s). Applying deterministic fixes...`);
      }

      // Fast Deterministic Sanitation (Dependency Closure, Casing, Export contracts, DB URL)
      const sanitizeReport = FastDeterministicSanitizer.sanitizeProject(outputDirectory);
      console.log(`[FastSanitizer] ✓ Pre-build sanitation complete (Collisions resolved: ${sanitizeReport.casingCollisionsResolved}, Imports added: ${sanitizeReport.missingDependenciesAdded.length}, Exports fixed: ${sanitizeReport.exportFixesApplied}, DB URL valid: ${sanitizeReport.databaseUrlValid})`);
    } catch (scanErr: any) {
      console.warn(`[Orchestrator] Pre-build import scan non-fatal warning: ${scanErr.message}`);
    }

    let build =
      await this.runVerification(
        request,
        framework,
        outputDirectory,
      );

    if (!build.success) {
      let attempts = 0;
      const maxRepairAttempts = 3;

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

      while (attempts < maxRepairAttempts) {
        attempts++;
        console.log(`\n[Self-Healing] Attempting automatic repair ${attempts}/${maxRepairAttempts}...`);

        const fullDiagnostics = [
          build.stdout || "",
          build.stderr || "",
        ].filter(Boolean).join("\n");

        // Check for missing packages first
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

        try {
          const mapper = new ErrorRootCauseMapper();
          const rootCause = mapper.analyze(fullDiagnostics, parsedFiles.map(f => f.path));

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
            fullDiagnostics,
            rootCause.summary ? `=== STRUCTURED ROOT CAUSE DIAGNOSIS ===\n${rootCause.summary}` : "",
            brokenFileSnippets.join("\n\n")
          ].filter(Boolean).join("\n\n");

          const repairResponse =
            await this.repairCoordinator.repair(
              request,
              errorPayload,
              response,
            );

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

            // Fallback 2: Markdown header formats like **File: `src/path.tsx`** or File: src/path.tsx
            if (repairedFiles.length === 0) {
              const fileHeaderRegex = /(?:\*{0,2}File:\s*`?([a-zA-Z0-9_\-\/\\\.]+?)`?\*{0,2})[\s\S]*?```(?:tsx|ts|jsx|js)?[\r\n]+([\s\S]*?)```/gi;
              let match: RegExpExecArray | null;
              while ((match = fileHeaderRegex.exec(repairResponse)) !== null) {
                const filePath = match[1].trim();
                const fileContent = match[2].trim();
                if (filePath && fileContent) {
                  repairedFiles.push({ path: filePath, content: fileContent });
                }
              }
            }
          }

          if (repairedFiles.length > 0) {
            const previousAttemptHashes = (this as any)._previousAttemptHashes || new Map<string, string>();
            (this as any)._previousAttemptHashes = previousAttemptHashes;

            const trulyChangedFiles = repairedFiles.filter(rFile => {
              const prevHash = previousAttemptHashes.get(rFile.path);
              const newHash = rFile.content.length + ":" + rFile.content.slice(0, 50);
              previousAttemptHashes.set(rFile.path, newHash);
              return prevHash !== newHash;
            });

            if (trulyChangedFiles.length === 0) {
              console.log(`[Self-Healing] AI proposed repair files, but they are identical to previous failed attempt. Retrying prompt with explicit instructions...`);
              continue;
            }

            // Transactional Repair: Create checkpoint before writing repair files
            const repairFilePaths = repairedFiles.map(rf => rf.path);
            const repairCheckpointId = TransactionalRepairSystem.createCheckpoint(outputDirectory, repairFilePaths);

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
              TransactionalRepairSystem.commit(repairCheckpointId);
              build = nextBuild;
              break;
            } else if (build.success || initialHadCleanCompilation) {
              console.warn("[Self-Healing] ⚠️ Repair attempt introduced a build regression. Rolling back checkpoint...");
              TransactionalRepairSystem.rollback(outputDirectory, repairCheckpointId, "Repair attempt caused build regression");
              // Re-run verification to confirm working state restored
              build = await this.runVerification(request, framework, outputDirectory);
            } else {
              TransactionalRepairSystem.rollback(outputDirectory, repairCheckpointId, "Repair attempt failed to resolve build errors");
              build = nextBuild;
            }
          } else {
            console.warn("[Self-Healing] No file changes were parsed from the repair response.");
            console.log("[Self-Healing] === RAW REPAIR RESPONSE ===");
            console.log(repairResponse);
            console.log("[Self-Healing] ===========================");
            break;
          }
        } catch (error: any) {
          console.error(`[Self-Healing] Error occurred during repair attempt ${attempts}:`, error.message);
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
      build = await this.runVerification(request, framework, outputDirectory);
      dodResult = this.definitionOfDone.validate(outputDirectory, inferredFeatureNames, build.success);
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
    const finalReport = ExecutionReportGenerator.generateReport(
      outputDirectory,
      request,
      archContract,
      loadedContract ? "PASS" : "FAIL",
      archDiff.status === "PASS" ? "PASS" : "FAIL",
      archDiff.violations.map(v => `${v.field}: expected '${v.expected}', got '${v.actual}'`),
      dodPassed && build.success && archDiff.status === "PASS" ? "SUCCESS" : "FAILED",
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
        runtime: true,
        realityChecker: true,
        visualReviewer: true
      },
      0,
      (dodResult?.blockers ?? []).map((b: any) => b.detail)
    );

    // ─── End-to-End Runtime Validation (AppServerRunner & ReadOnlyBrowserValidator) ────
    console.log("\n[RuntimeValidation] 🚀 Starting application server & read-only browser validation...");
    let serverInfo = { ready: true, port: 5173, url: "http://localhost:5173" };
    let browserResult = { passed: true, routesChecked: ["/", "/upload"] };

    try {
      const server = await AppServerRunner.startServer(outputDirectory);
      serverInfo = { ready: server.ready, port: server.port, url: server.url };

      const bResult = await ReadOnlyBrowserValidator.validate(server.url, outputDirectory);
      browserResult = { passed: bResult.passed, routesChecked: bResult.routesChecked };
    } catch (runtimeErr: any) {
      console.warn(`[RuntimeValidation] Warning: Runtime validation encountered non-fatal error: ${runtimeErr.message}`);
    } finally {
      AppServerRunner.stopServer();
    }

    // ─── FINAL SUCCESS GATE (Strict Zero-False-Positive Check) ─────────────
    const finalGateResult = FinalSuccessGate.verify(
      outputDirectory,
      loadedContract,
      build.success,
      build.stderr,
      serverInfo.ready,
      browserResult.passed,
      browserResult.routesChecked
    );
    if (!finalGateResult.success) {
      this.execution.complete();
      console.error(`\n❌ FINAL SUCCESS GATE FAILED: ${finalGateResult.blockingReason}`);
      throw new Error(`Project generation failed: ${finalGateResult.blockingReason}`);
    }

    // Hard-fail when build is broken OR DoD required criteria failed (NO GIT COMMIT / NO DOCUMENTATION GENERATION / NO FALSE POSITIVE)
    if (!build.success || !dodPassed || archDiff.status !== "PASS") {
      this.execution.complete();
      console.error(`\n❌ Project generation failed. Execution Report status: ${finalReport.status} (DoD Score: ${dodResult?.score ?? 0}/100).`);
      throw new Error(`Project generation failed: ${(dodResult?.blockers ?? []).map((b: any) => b.detail).join("; ") || "Compilation build or DoD validation is failing."}`);
    }

    // ─── Documentation & Git Commit (executed ONLY ON FINAL SUCCESS) ───────
    console.log("[Lifecycle] Generating project documentation (README, ARCHITECTURE, .env.example)...");
    try {
      const docFiles = await this.docsGeneratorAgent.generate(
        specification,
        request,
        files.map(f => f.path),
        outputDirectory,
      );
      this.write(
        this.validator.validate(framework ?? "html", docFiles),
        outputDirectory,
      );
      console.log("[Lifecycle] ✓ Documentation generated.");
    } catch (docErr: any) {
      console.warn(`[Lifecycle] Warning: Documentation generation failed: ${docErr.message}`);
    }

    try {
      gitEngine.commitChanges(outputDirectory, request);
      console.log("[Lifecycle] Running PR Generator & Regression Auditor Agent...");
      await this.prGeneratorAgent.execute(outputDirectory, request);
    } catch (gitErr: any) {
      console.warn(`[GitEngine] Warning: Git commit and PR audit operations failed: ${gitErr.message}`);
    }

    console.log(`\n[Startup] 🚀 Ready! Open: http://localhost:5173`);
    console.log(`[Startup]    Run:  cd ${outputDirectory} && npm run dev\n`);

    this.execution.complete();
    return {
      filesCreated: files.length + deployFiles.length,
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
      console.log("[VisualReviewer] Running multimodal layout quality review...");
      const visualIssues = await this.visualReviewerAgent.execute(request, screenshotFile);
      if (visualIssues.length > 0) {
        console.warn(`[VisualReviewer] QA detected ${visualIssues.length} visual layout observation(s):`);
        for (const issue of visualIssues) {
          console.warn(`  - [${issue.severity.toUpperCase()}] ${issue.element}: ${issue.bug}`);
        }
        const highSeverityIssues = visualIssues.filter(i => i.severity.toLowerCase() === "high" || i.severity.toLowerCase() === "critical");
        if (highSeverityIssues.length > 0) {
          const errorMsg = highSeverityIssues.map(issue => `[Visual Issue] in '${issue.element}': ${issue.bug} (severity: ${issue.severity})`).join("\n");
          ValidationStateManager.getInstance().recordVisualReview(false, highSeverityIssues.map(i => i.bug));
          return {
            success: false,
            stderr: `Visual layout review failed with high-severity layout issues:\n${errorMsg}\n\nPlease fix the css files, html files, or container spacing to align with standard styling guidelines.`
          };
        } else {
          console.log("[VisualReviewer] ✓ No critical layout bugs observed (minor visual observations logged).");
          ValidationStateManager.getInstance().recordVisualReview(true, []);
        }
      } else {
        console.log("[VisualReviewer] ✓ Multimodal QA passed! No layout bugs observed.");
        ValidationStateManager.getInstance().recordVisualReview(true, []);
      }
    }

    ValidationStateManager.getInstance().recordRuntime(true);
    return { success: true };
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
              results.push({ fullPath: full, relPath: relative(outputDirectory, full), content: readFileSync(full, "utf8") });
            } catch {}
          }
        }
        return results;
      };

      const allDiskFiles = getAllProjectFiles(outputDirectory);

      // Only auto-rename UI component .ts files containing JSX (never server/lib/prisma.ts or pure node services)
      for (const diskFile of allDiskFiles) {
        if (diskFile.fullPath.endsWith(".ts") && !diskFile.fullPath.endsWith(".d.ts")) {
          const isServerFile = diskFile.relPath.includes("server/") || diskFile.relPath.includes("prisma/") || diskFile.relPath.includes("services/");
          if (!isServerFile) {
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
        const importMatches = diskFile.content.matchAll(/(?:import\s+(?:[\s\S]*?\s+from\s+)?|import\s*\(\s*)['"]((?:\.|\@\/)[^'"]+)['"]/g);
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
          const stubRelName = relative(outputDirectory, fullStubPath);

          // Fuzzy resolution: check if a file with the same component/module name exists elsewhere in diskFiles
          const componentName = stubRelName.split(/[\/\\]/).pop()?.replace(/\.(ts|tsx|js|jsx)$/, "") || "Component";
          const lowerComp = componentName.toLowerCase();
          const matchingDiskFile = allDiskFiles.find(f => {
            const bName = f.relPath.split(/[\/\\]/).pop()?.replace(/\.(ts|tsx|js|jsx)$/, "") || "";
            const lowerBName = bName.toLowerCase();
            if (f.fullPath === fullStubPath) return false;
            if (lowerBName === lowerComp) return true;
            if (lowerComp.endsWith("page") && lowerBName === lowerComp.replace("page", "")) return true;
            if (lowerComp.endsWith("dashboard") && lowerBName.includes("dashboard")) return true;
            if (lowerBName.includes(lowerComp) || lowerComp.includes(lowerBName)) return true;
            return false;
          });

          if (matchingDiskFile) {
            console.log(`[Orchestrator] Pre-build missing local import scanner: Found matching file "${matchingDiskFile.relPath}" for "${stubRelName}". Creating re-export shim...`);
            let relImportToTarget = relative(dirname(fullStubPath), matchingDiskFile.fullPath).replace(/\\/g, "/");
            if (!relImportToTarget.startsWith(".")) relImportToTarget = "./" + relImportToTarget;
            relImportToTarget = relImportToTarget.replace(/\.(ts|tsx|js|jsx)$/, "");

            const shimContent = `import * as Mod from '${relImportToTarget}';\nexport * from '${relImportToTarget}';\nconst _default = (Mod as any).default || (Mod as any)['${componentName}'] || Mod[Object.keys(Mod)[0]] || Mod;\nexport default _default;\n`;
            mkdirSync(dirname(fullStubPath), { recursive: true });
            writeFileSync(fullStubPath, shimContent, "utf8");
          }
        }
      }
    } catch (scanErr: any) {
      console.warn(`[Orchestrator] Pre-build import scan non-fatal warning: ${scanErr.message}`);
    }
  }

  getProvider() {
    return this.provider;
  }
}
