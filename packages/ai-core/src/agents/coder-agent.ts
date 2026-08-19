import { BaseAgent } from "./base-agent.js";
import { PromptBuilderEngine } from "../prompts/index.js";
import { Generator } from "../generator/generator.js";
import { Parser } from "../generator/parser.js";
import { ExecutionContext } from "../context/index.js";
import type { SystemArchitecture } from "../architect/index.js";
import type { PlanStep } from "../agent/planner.js";
import type { Task } from "../planner/task.js";
import { StubDetector } from "../generator/stub-detector.js";
import { ProjectMemoryEngine } from "../memory/memory-engine.js";
import { ProjectScanner } from "../context/project-scanner.js";
import { FileSelector } from "../context/file-selector.js";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { CodebaseIndex } from "../context/codebase-index.js";
import { CanonicalFileGraph, CANONICAL_API_CONTRACT, CANONICAL_ATS_API_CONTRACT, CANONICAL_MULTER_CONTRACT } from "../governance/canonical-file-graph.js";
import { ArchitectureResolver } from "../governance/architecture-resolver.js";
import { DomainContractManager } from "../governance/domain-contract.js";
import { CanonicalPlanManager } from "../planning/canonical-generation-plan.js";

export class CoderAgent extends BaseAgent {
  readonly name = "Coder Agent";

  private readonly promptEngine =
    new PromptBuilderEngine();

  private readonly generator =
    new Generator(
      this.provider,
    );

  private readonly parser =
    new Parser();
    private readonly context =
  new ExecutionContext();
  async execute(
    task: Task,
    architecture: SystemArchitecture,
    architecturePlan: string,
    request: string,
    outputDirectory: string,
    existingFiles: string[] = [],
    image?: { mimeType: string; data: string },
  ) {
    const memoryEngine = new ProjectMemoryEngine(outputDirectory);
    const existingArch = memoryEngine.loadArchitecture();
    const existingPatterns = memoryEngine.loadPatterns();

    let patternContext = "";
    if (existingPatterns && existingPatterns.reusablePatterns.length > 0) {
      patternContext = "\nReusable code patterns and styling layouts from project library:\n" +
        existingPatterns.reusablePatterns.map(p => `Pattern "${p.name}" (${p.description}):\n${p.sampleCode}`).join("\n\n");
    }

    let archContext = "";
    if (existingArch) {
      const conventions = existingArch.namingConventions.map(rule => `- ${rule}`).join("\n");
      const additional = (existingArch.additionalRules || []).map(rule => `- [LEARNED RULE] ${rule}`).join("\n");
      archContext = `\nDesign Conventions & Coding Rules:\n- Styling framework: ${existingArch.styling}\n${conventions}\n${additional}`;
    }

    // Scan project files and run Context Manager intelligent file selector
    const scanner = new ProjectScanner();
    const allFiles = scanner.scan(outputDirectory).filter(f => !f.startsWith(".aegis/") && f !== "screenshot.png" && f !== "pull-request.md");
    
    const codebaseEntries = new CodebaseIndex().build(allFiles);

    const selector = new FileSelector();
    const selectedEntries = selector.select(request, codebaseEntries, outputDirectory, `${task.title} ${task.description}`);

    const MAX_FILE_CHARS = 3000; // ~750 tokens per file
    const MAX_TOTAL_CHARS = 20000; // ~5000 tokens total for relevantFilesContent

    let totalChars = 0;
    const relevantFilesContent = selectedEntries.map(entry => {
      const fullPath = join(outputDirectory, entry.path);
      if (!existsSync(fullPath)) return "";
      try {
        let code = readFileSync(fullPath, "utf8");
        if (code.length > MAX_FILE_CHARS) {
          code = code.slice(0, MAX_FILE_CHARS) + "\n// ...(truncated for prompt token budget)...";
        }
        if (totalChars + code.length > MAX_TOTAL_CHARS) return "";
        totalChars += code.length;
        return `=== FILE: ${entry.path} ===\n${code}\n`;
      } catch (e) {
        return `=== FILE: ${entry.path} ===\n(Unable to read file content)\n`;
      }
    }).filter(Boolean).join("\n");

    const manifestList = allFiles.slice(0, 50).join("\n");
    const manifestText = allFiles.length > 50 
      ? `${manifestList}\n...[${allFiles.length - 50} more files omitted for prompt token budget]`
      : manifestList;

    // ── Build canonical file contract context for this task ──────────────────────
    // Determine which canonical files this task is responsible for
    const taskTitle = task.title.toLowerCase();
    const taskDesc = task.description.toLowerCase();

    // Find all canonical files whose taskOwner or semanticRole matches this task
    const CANONICAL_FILES_IMPORT = (await import("../governance/canonical-file-graph.js")).CANONICAL_FILES;
    const taskFiles = CANONICAL_FILES_IMPORT.filter(f => {
      if (f.taskOwner) {
        return f.taskOwner.toLowerCase().includes(taskTitle.slice(0, 20)) ||
               taskTitle.includes(f.semanticRole.toLowerCase().slice(0, 15));
      }
      // Heuristic: match by role keyword in task title/description
      const role = f.semanticRole.toLowerCase();
      return taskTitle.includes(role.split(" ")[0]) || taskDesc.includes(role.split(" ")[0]);
    });

    // Build per-file contract blocks
    let canonicalContractContext = CanonicalFileGraph.toContextString();

    if (taskFiles.length > 0) {
      canonicalContractContext += "\n\n" + taskFiles.map(f => CanonicalFileGraph.getFileContract(f.canonicalPath)).join("\n\n");
    }

    const contract = ArchitectureResolver.loadContract(outputDirectory);
    const domainContract = DomainContractManager.load(outputDirectory);
    const lockedPlan = CanonicalPlanManager.load(outputDirectory);

    const isATS = (contract?.requiredModels || []).some(m => ["Resume", "JobDescription", "AnalysisResult", "Scan"].includes(m)) ||
                  (contract?.requiredRoutes || []).some(r => r.includes("scan") || r.includes("resume")) ||
                  request.toLowerCase().includes("resume") || request.toLowerCase().includes("ats");

    const activeModels = contract?.requiredModels?.length
      ? contract.requiredModels
      : (domainContract?.entities?.length ? domainContract.entities : (lockedPlan?.dataArchitecture?.models?.map((m: any) => m.name) || []));

    const canonicalDomainModelsList = activeModels.length > 0
      ? activeModels.map((m: string) => `- ${m}`).join("\n")
      : "- User\n- (Derive domain models strictly from task prompt & locked schema)";

    // Inject API contract for API-related tasks
    if (taskTitle.includes("api") || taskTitle.includes("service") || taskTitle.includes("frontend")) {
      canonicalContractContext += `\n\n${isATS ? CANONICAL_ATS_API_CONTRACT : CANONICAL_API_CONTRACT}`;
    }

    // Inject Multer contract for upload/scan controller tasks only when ATS or explicitly uploading files
    if ((isATS || taskTitle.includes("upload")) && (taskTitle.includes("upload") || taskTitle.includes("scan") || taskTitle.includes("multer") || taskTitle.includes("pdf"))) {
      canonicalContractContext += `\n\n${CANONICAL_MULTER_CONTRACT}`;
    }

    const CANONICAL_CODER_CONTEXT_HEADER = `
══════════════════════════════════════════════════════════════════════════════
CANONICAL PROJECT ARCHITECTURE CONSTRAINTS (MANDATORY & AUTHORITATIVE)
══════════════════════════════════════════════════════════════════════════════
CANONICAL COMPONENTS (USE THESE — DO NOT INVENT ARBITRARY SHARED COMPONENTS):
- Button Component:      src/design-system/components/Button.tsx
- Skeleton Component:    src/design-system/components/Skeleton.tsx
- EmptyState Component:  src/design-system/components/EmptyState.tsx
- GlassCard Component:   src/design-system/components/GlassCard.tsx
- Card Component:        src/shared/components/Card.tsx
- Layout Shell:          src/shared/components/Layout.tsx

CANONICAL FRONTEND API CLIENT SERVICE:
- Canonical API Service: src/services/api.ts (import { api, login, register } from "@/services/api" or "../../services/api")
- FORBIDDEN IMPORT ALIASES: NEVER import "@/services/apiClient" or "src/services/apiClient.ts" or "src/services/api-client". The ONLY canonical API module is "src/services/api.ts".

CANONICAL DATABASE CLIENT (EXPRESS BACKEND ONLY):
- server/lib/prisma.ts  (import { prisma } from "../lib/prisma")
- server/db/index.ts    (import { prisma } from "../db/index")

CANONICAL DOMAIN MODELS:
${canonicalDomainModelsList}

CANONICAL DIRECTORY BOUNDARIES:
- src/       React frontend code ONLY (NEVER import @prisma/client or server/**). Frontend tasks MUST ONLY output files inside src/.
- server/    Express backend code ONLY (routes, controllers, services, middleware). Backend tasks MUST ONLY output files inside server/.
- prisma/    Prisma database schema (prisma/schema.prisma). Database tasks MUST ONLY output files inside prisma/ or server/lib/.

FORBIDDEN TECHNOLOGIES:
- Next.js, NextAuth, App Router, Server Actions, Next.js API Routes
- MongoDB, Mongoose, Drizzle
- Inventing arbitrary shared/components modules or duplicate API clients
══════════════════════════════════════════════════════════════════════════════
`.trim();

    const prompt =
      this.promptEngine.build(
        [task],
        architecture,
        architecturePlan,
        `${request}

${CANONICAL_CODER_CONTEXT_HEADER}

Existing relevant files content:
${relevantFilesContent}

All existing project files (manifest list):
${manifestText}
${archContext}
${patternContext}

${canonicalContractContext}
`,
        outputDirectory,
      );
    const response =
      await this.generator.generate(
        prompt,
        {
          agentType: "coder",
          complexity: task.estimatedComplexity,
          image,
        },
      );

const files =
  this.parser.parse(
    response,
  );

const stubDetector = new StubDetector();
for (const file of files) {
  const stubs = stubDetector.detect(file.content);
  if (stubs.length > 0) {
    console.warn(`[CoderAgent] Warning: Placeholder patterns detected in generated file ${file.path}:`);
    for (const finding of stubs) {
      console.warn(`  - ${finding}`);
    }
    throw new Error(
      `File generation failed: ${file.path} contains incomplete placeholders or TODO blocks:\n${stubs.join("\n")}`
    );
  }
}

this.context.projectMemory.add(
  files,
);
const projectSummary =
  this.context.projectMemory.summarize();

return {
  response,
  files,
  projectSummary,
};
  }
}
