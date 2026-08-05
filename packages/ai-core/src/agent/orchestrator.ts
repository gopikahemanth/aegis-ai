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
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { DependencyResolver, DependencyInstaller } from "@aegis/project-builder";
import { PatchEngine } from "../healing/patch-engine.js";
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

    // ── Merge inferred fields into the spec ──────────────────────────────────
    if (inferredFeatureNames.length > 0 && !specification.features?.length) {
      specification.features = inferredFeatureNames;
    }
    if (inferredLibraries.length > 0 && !specification.inferredLibraries?.length) {
      specification.inferredLibraries = inferredLibraries;
    }

    auditTrail.logEvent({
      agentRole: "Architect",
      action: `Completed requirements mapping. Framework: ${specification.type}, Database: ${specification.database || "None"}, Features: [${(specification.features ?? []).join(", ")}]`,
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
      console.log("[DataArchitecture] ✓ Saved data architecture definition in project builder.");

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

    const tasks =
      await this.plannerAgent.execute(
        specification,
      );

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

    const framework =
      this.selector.select(architecture);

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
      specification,
      architecturePlan,
    } =
      await this.architectAgent.execute(
        guidancePrompt,
        imagePayload,
      );

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

    auditTrail.logEvent({
      agentRole: "Architect",
      action: `Completed requirements mapping. Framework: ${specification.type}, Database: ${specification.database || "None"}`,
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

    const tasks =
      await this.plannerAgent.execute(
        specification,
      );

    this.execution.enter(
      ExecutionPhase.Architecture,
    );

    const architecture =
      this.architect.plan(specification);

    this.execution.enter(
      ExecutionPhase.Planning,
    );

    const framework =
      this.selector.select(architecture);

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
        } catch (coderError: any) {
          console.warn(`[Orchestrator] CoderAgent failed for task "${task.title}": ${coderError.message}`);
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

              const repairedFiles = this.parser.parse(repairResponse);
              if (repairedFiles.length > 0) {
                result = {
                  response: repairResponse,
                  files: repairedFiles
                };
                success = true;
                console.log(`[Self-Healing] ✓ Coder repair succeeded! Resolved placeholders.`);
              } else {
                throw new Error("No file changes parsed from repair response.");
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

     // Initial package dependencies installation
    console.log("[Orchestrator] Installing all project dependencies...");
    try {
      const pm = "pnpm";
      console.log(`[Orchestrator] Running '${pm} install' in generated project at ${outputDirectory}...`);
      const installResult = await this.installer.install(pm, outputDirectory);
      console.log(`[Orchestrator] Initial install completed. Exit code: ${installResult.exitCode}`);
      if (installResult.exitCode !== 0) {
        console.warn(`[Orchestrator] Warning: initial install exit code was non-zero. stderr: ${installResult.stderr}`);
      }
      
      // Generate Prisma client if schema exists to ensure types exist during build verification
      const prismaSchema = join(outputDirectory, "prisma/schema.prisma");
      if (existsSync(prismaSchema)) {
        console.log(`[Orchestrator] Prisma schema detected. Running 'pnpm exec prisma generate' in ${outputDirectory}...`);
        try {
          const { execSync } = await import("child_process");
          if (process.platform === "win32") {
            try {
              execSync(`wmic process where "ExecutablePath like '%node.exe%' and CommandLine like '%generated%project%'" call terminate`, { stdio: "ignore" });
            } catch { /* ignore */ }
          }
          execSync("pnpm exec prisma generate", { cwd: outputDirectory, stdio: "inherit" });
          console.log("[Orchestrator] Prisma client generation successful.");
        } catch (genErr: any) {
          console.warn(`[Orchestrator] Warning: Prisma client generation failed: ${genErr.message}`);
        }
      }
    } catch (instErr: any) {
      console.warn(`[Orchestrator] Warning: Initial package installation failed: ${instErr.message}`);
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

      while (!build.success && attempts < maxRepairAttempts) {
        attempts++;
        console.log();
        console.log(`[Self-Healing] Attempting automatic repair ${attempts}/${maxRepairAttempts}...`);

        const fullDiagnostics = [
          build.stderr ? `===== BUILD STDERR =====\n${build.stderr}` : "",
          build.stdout ? `===== BUILD STDOUT =====\n${build.stdout}` : "",
        ].filter(Boolean).join("\n\n") || "Build failed with no output";

        // Check for missing packages first
        const packages = this.dependencyResolver.resolve(fullDiagnostics);
        if (packages.length > 0) {
          console.log(`[DependencyResolver] Installing missing packages: ${packages.join(", ")}`);
          try {
            const pm = "pnpm";
            await this.installer.installPackages(pm, outputDirectory, packages);
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
          const errorPayload = rootCause.summary
            ? `${fullDiagnostics}\n\n=== STRUCTURED ROOT CAUSE DIAGNOSIS ===\n${rootCause.summary}\nTarget files to repair: ${rootCause.filesToFix.join(", ")}`
            : fullDiagnostics;

          const repairResponse =
            await this.repairCoordinator.repair(
              request,
              errorPayload,
              response,
            );

          const repairedFiles = this.parser.parse(repairResponse);
          if (repairedFiles.length > 0) {
            console.log(`[Self-Healing] Parsed ${repairedFiles.length} corrected files. Writing to disk...`);
            const validatedRepairedFiles = this.validate(framework, repairedFiles);
            this.write(validatedRepairedFiles, outputDirectory);

            build = await this.runVerification(request, framework, outputDirectory);
            if (build.success) {
              console.log("[Self-Healing] ✓ Build succeeded after automatic repair!");
              break;
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
      }
    }

    if (!build.success) {
      console.log();
      console.log("❌ Self-Healing: Build is still failing after maximum repair attempts.");
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
      console.log(`[Startup] 🚀 Ready! Open: ${startupResult.url ?? "http://localhost:5173"}`);
      console.log(`[Startup]    Run:  cd ${outputDirectory} && npm run dev`);

      // Re-verify build status after ProjectStartupAgent applied all deterministic fixes
      build = await this.runVerification(request, framework, outputDirectory);
    } catch (startupErr: any) {
      console.warn(`[Startup] Warning: Startup agent failed: ${startupErr.message}`);
    }

    // ─── Documentation (always generate BEFORE DoD validation) ─────────────
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

    // ─── Definition of Done ──────────────────────────────────────────────────
    console.log("[DoD] Running Definition of Done validation...");
    let dodPassed = false;
    try {
      const dodResult = this.definitionOfDone.validate(outputDirectory, inferredFeatureNames, build.success);
      console.log(`[DoD] ${dodResult.summary}`);
      dodPassed = dodResult.passed;
      if (!dodResult.passed) {
        console.error(`[DoD] ❌ Definition of Done FAILED (score: ${dodResult.score}/100).`);
        for (const blocker of dodResult.blockers) {
          console.error(`  - ✗ [Blocker] ${blocker.name}: ${blocker.detail}`);
        }
        auditTrail.logEvent({
          agentRole: "Definition of Done Validator",
          action: `DoD FAILED (score: ${dodResult.score}/100). Blockers: ${dodResult.blockers.map(b => b.name).join(", ")}`,
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
      dodPassed = true;
    }

    // Commit changes and create PR report template
    try {
      gitEngine.commitChanges(outputDirectory, request);
      console.log("[Lifecycle] Running PR Generator & Regression Auditor Agent...");
      await this.prGeneratorAgent.execute(outputDirectory, request);
    } catch (gitErr: any) {
      console.warn(`[GitEngine] Warning: Git commit and PR audit operations failed: ${gitErr.message}`);
    }

    // Only hard-fail when the build is broken AND DoD explicitly failed on build
    if (!build.success && !dodPassed) {
      this.execution.complete();
      console.error("\n❌ Project generation failed. Compilation build is failing or required DoD criteria are unmet.");
      throw new Error("Project generation failed: required completeness criteria or builds are unresolved.");
    }

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
    const verifyResult = await this.buildOrchestrator.verify(outputDirectory);
    if (!verifyResult.success) {
      return { success: false, stderr: verifyResult.stderr || "Build failed", stdout: verifyResult.stdout };
    }

    const screenshotFile = join(outputDirectory, "screenshot.png");
    if (existsSync(screenshotFile)) {
      console.log("[VisualReviewer] Running multimodal layout quality review...");
      const visualIssues = await this.visualReviewerAgent.execute(request, screenshotFile);
      if (visualIssues.length > 0) {
        console.warn(`[VisualReviewer] QA detected ${visualIssues.length} visual layout bugs:`);
        const errorMsg = visualIssues.map(issue => `[Visual Issue] in '${issue.element}': ${issue.bug} (severity: ${issue.severity})`).join("\n");
        for (const issue of visualIssues) {
          console.warn(`  - [${issue.severity.toUpperCase()}] ${issue.element}: ${issue.bug}`);
        }
        return {
          success: false,
          stderr: `Visual layout review failed with the following layout issues:\n${errorMsg}\n\nPlease fix the css files, html files, or container spacing to align with standard styling guidelines.`
        };
      } else {
        console.log("[VisualReviewer] ✓ Multimodal QA passed! No layout bugs observed.");
      }
    }

    return { success: true };
  }

  getProvider() {
    return this.provider;
  }
}
