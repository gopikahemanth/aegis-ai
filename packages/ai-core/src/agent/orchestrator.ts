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
} from "../agents/index.js";
import { ProjectMemoryEngine } from "../memory/memory-engine.js";
import { FileWriter } from "../writer/writer.js";
import { Parser } from "../generator/parser.js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PatchEngine } from "../healing/patch-engine.js";
import { DependencyGraphEngine } from "../dependency/dependency-graph.js";
import { GitIntegrationEngine } from "../git/git-engine.js";
import { MetricsTracker } from "../providers/metrics-tracker.js";
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

  private readonly executionLoop = new ExecutionLoop();

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
  ) {
    this.memory.add(request);

    this.execution.enter(
      ExecutionPhase.Requirements,
    );

    const {
      specification,
    } =
      await this.architectAgent.execute(
        request,
      );

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
  ) {
    const memoryEngine = new ProjectMemoryEngine(outputDirectory);
    memoryEngine.initDefaults("project", request);
    MetricsTracker.getInstance().reset();

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

    const guidancePrompt = request + (existingArch ? `\n(Guideline: Follow the existing framework "${existingArch.framework}", styled with "${existingArch.styling}", using naming rules: ${existingArch.namingConventions.join(", ")})` : "");

    const {
      specification,
      architecturePlan,
    } =
      await this.architectAgent.execute(
        guidancePrompt,
      );

    const tasks =
      await this.plannerAgent.execute(
        specification,
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
            request,
            outputDirectory,
            existingFiles,
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
    let build =
      await this.runVerification(
        request,
        framework,
        outputDirectory,
      );

    if (!build.success) {
      let attempts = 0;
      const maxRepairAttempts = 3;

      while (!build.success && attempts < maxRepairAttempts) {
        attempts++;
        console.log();
        console.log(`[Self-Healing] Attempting automatic repair ${attempts}/${maxRepairAttempts}...`);

        try {
          const repairResponse =
            await this.repairCoordinator.repair(
              request,
              build.stderr || "",
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

    // Commit changes and create PR report template
    try {
      gitEngine.commitChanges(outputDirectory, request);
      gitEngine.generatePullRequestTemplate(outputDirectory, request, files.length + deployFiles.length);
    } catch (gitErr: any) {
      console.warn(`[GitEngine] Warning: Git commit operations failed: ${gitErr.message}`);
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
  ): Promise<{ success: boolean; stderr?: string }> {
    const verifyResult = await this.buildOrchestrator.verify(outputDirectory);
    if (!verifyResult.success) {
      return { success: false, stderr: verifyResult.stderr || "Build failed" };
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
