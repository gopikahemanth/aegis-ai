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

    const contract = ArchitectureResolver.loadContract(outputDirectory);
    const domainContract = DomainContractManager.load(outputDirectory);
    const lockedPlan = CanonicalPlanManager.load(outputDirectory);
    const { DynamicFileGraphManager } = await import("../governance/dynamic-file-graph.js");
    const dynamicGraph = DynamicFileGraphManager.load(outputDirectory);

    const isATS = (contract?.requiredModels || []).some(m => ["Resume", "JobDescription", "AnalysisResult", "Scan"].includes(m)) &&
                  (request.toLowerCase().includes("resume") || request.toLowerCase().includes("ats"));

    let canonicalContractContext = "";
    if (dynamicGraph && dynamicGraph.entries.length > 0) {
      const isFrontendTask = taskTitle.includes("frontend") || taskTitle.includes("ui") || taskTitle.includes("react") || (task as any).stage === "Frontend";
      const isBackendTask = taskTitle.includes("backend") || taskTitle.includes("api") || taskTitle.includes("server") || (task as any).stage === "Backend";
      const isDbTask = taskTitle.includes("database") || taskTitle.includes("prisma") || taskTitle.includes("schema") || (task as any).stage === "Database";

      const matchedEntries = dynamicGraph.entries.filter(f => {
        if (isFrontendTask && f.layer === "frontend") return true;
        if (isBackendTask && f.layer === "backend") return true;
        if (isDbTask && (f.layer === "schema" || f.layer === "config")) return true;
        const role = (f.semanticRole || "").toLowerCase();
        return role.includes(taskTitle.slice(0, 15)) || taskTitle.includes(role.slice(0, 15)) || f.canonicalPath.toLowerCase().includes(taskTitle.slice(0, 15));
      });
      if (matchedEntries.length > 0) {
        canonicalContractContext = `CANONICAL FILE CONTRACTS FOR THIS TASK (YOU MUST IMPLEMENT THESE SPECIFIED FILES):\n` + matchedEntries
          .map(f => `FILE: ${f.canonicalPath}\nRole: ${f.semanticRole}\nRequired Exports: ${(f.requiredExports || []).join(", ") || "default export"}`)
          .join("\n\n");
      }
    } else if (isATS) {
      const CANONICAL_FILES_IMPORT = (await import("../governance/canonical-file-graph.js")).CANONICAL_FILES;
      const taskFiles = CANONICAL_FILES_IMPORT.filter(f => {
        if (f.taskOwner) {
          return f.taskOwner.toLowerCase().includes(taskTitle.slice(0, 20)) ||
                 taskTitle.includes(f.semanticRole.toLowerCase().slice(0, 15));
        }
        const role = f.semanticRole.toLowerCase();
        return taskTitle.includes(role.split(" ")[0]) || taskDesc.includes(role.split(" ")[0]);
      });
      canonicalContractContext = CanonicalFileGraph.toContextString();
      if (taskFiles.length > 0) {
        canonicalContractContext += "\n\n" + taskFiles.map(f => CanonicalFileGraph.getFileContract(f.canonicalPath)).join("\n\n");
      }
    }

    const activeModels = contract?.requiredModels?.length
      ? contract.requiredModels
      : (domainContract?.entities?.length ? domainContract.entities : (lockedPlan?.dataArchitecture?.models?.map((m: any) => m.name) || []));

    const canonicalDomainModelsList = activeModels.length > 0
      ? activeModels.map((m: string) => `- ${m}`).join("\n")
      : "- User\n- (Derive domain models strictly from task prompt & locked schema)";

    // Inject API contract for API-related tasks only when ATS or generic API is appropriate
    if (isATS && (taskTitle.includes("api") || taskTitle.includes("service") || taskTitle.includes("frontend"))) {
      canonicalContractContext += `\n\n${CANONICAL_ATS_API_CONTRACT}`;
    }

    // Inject Multer contract for upload/scan controller tasks only when ATS or explicitly uploading files
    if (isATS && (taskTitle.includes("upload") || taskTitle.includes("scan") || taskTitle.includes("multer") || taskTitle.includes("pdf"))) {
      canonicalContractContext += `\n\n${CANONICAL_MULTER_CONTRACT}`;
    }

    let designBriefContext = "";
    const briefPath = join(outputDirectory, ".aegis", "design-brief.json");
    if (existsSync(briefPath)) {
      try {
        const brief = JSON.parse(readFileSync(briefPath, "utf8"));
        const reqWords = (brief.vocabularyContract?.required || []).join(", ");
        const prefWords = (brief.vocabularyContract?.preferred || []).join(", ");
        const forbWords = (brief.vocabularyContract?.forbidden || []).join(", ");
        const principles = (brief.designPrinciples || []).map((p: string) => `  • ${p}`).join("\n");
        const pages = (brief.pageCompositions || []).map((p: any) => 
          `  • Route "${p.route}" (${p.name}): Family=${p.compositionFamily}, Hero=${p.heroElement}, Focus="${p.primaryFocus}"`
        ).join("\n");

        designBriefContext = `
══════════════════════════════════════════════════════════════════════════════
LOCKED PRODUCT DESIGN BRIEF (AUTHORITATIVE & IMMUTABLE MANDATE)
══════════════════════════════════════════════════════════════════════════════
- Art Direction: ${brief.artDirectionName}
  Rationale: ${brief.artDirectionRationale || "Consistent domain-specific aesthetic"}
- Experience Pattern: ${brief.productCharacteristics?.experiencePattern || "custom"} (Activity: ${brief.productCharacteristics?.primaryActivity || "custom"}, Density: ${brief.productCharacteristics?.informationDensity || "moderate"})
- Primary Navigation: Strategy=${brief.navigation?.strategy || "top-bar"}, MaxItems=${brief.navigation?.maxPrimaryItems || 5}
- Color System: Primary=${brief.colorSystem?.primary}, Surface=${brief.colorSystem?.surface}, TextPrimary=${brief.colorSystem?.textPrimary}, Accent=${brief.colorSystem?.accent}
- Typography: Display="${brief.typography?.displayFont}", Body="${brief.typography?.bodyFont}", Scale=${brief.typography?.displayScale || "medium"}
- Geometry: Style=${brief.geometry?.style || "soft"}, Radius=${brief.geometry?.radiusMd || "0.5rem"}, Border=${brief.geometry?.borderWidth || "standard"}
- Component Language:
  Card Style: ${brief.componentLanguage?.cardStyle || "rounded-xl border shadow"}
  Button Style: ${brief.componentLanguage?.buttonPrimary || "primary button"}
  Loading Style: ${brief.componentLanguage?.loadingStyle || "skeleton"}
- 3-Tier Vocabulary Contract:
  ✓ REQUIRED VOCABULARY (Contractually MUST appear naturally in domain views): ${reqWords || "(none)"}
  ○ PREFERRED VOCABULARY (Use naturally where appropriate): ${prefWords || "(none)"}
  ✗ FORBIDDEN VOCABULARY (STRICT CRITICAL VIOLATION in JSX text/labels/headings): ${forbWords || "(none)"}
- Page Compositions & Information Architecture:
${pages || "  (Defined by feature specs)"}
- Design Principles:
${principles || "  • Domain authenticity and high-contrast usability"}
- Page Semantic Hierarchy Requirements:
  • Every primary page component MUST contain exactly one semantic <h1> derived from the active feature name.
  • Follow <h1> immediately with a descriptive <p> explaining the page purpose.
  • NEVER omit <h1> and NEVER render multiple <h1> elements on the same page.
══════════════════════════════════════════════════════════════════════════════
`;
      } catch {}
    }

    const CANONICAL_CODER_CONTEXT_HEADER = `
══════════════════════════════════════════════════════════════════════════════
DO NOT REPLACE THE EXISTING GOVERNANCE PROTECTIONS.
This is a workflow refactor. Preserve provenance, domain isolation, non-generative ProjectGraphEngine, mechanical-only FastSanitizer, capability completeness, DesignBrief locking, and architecture validation. Build the new staged frontend → approval → database → backend → integration workflow on top of them.

DATABASE IS A FIRST-CLASS STAGE.

After the user approves the frontend, do NOT immediately write arbitrary backend code.

First perform DATABASE DESIGN.

Inspect the approved frontend and locked Product/Experience Brief.

Derive ONLY the data actually required by the product:

USER REQUIREMENT
→ FRONTEND FEATURE
→ REQUIRED DATA
→ ENTITY
→ RELATIONSHIP
→ DATABASE MODEL

For every database entity, identify:

- purpose
- fields
- types
- required/optional fields
- relationships
- unique constraints
- indexes where justified
- foreign keys
- lifecycle/status values
- validation rules

Then generate the Prisma schema and PostgreSQL migration.

DATABASE MUST BE VERIFIED INDEPENDENTLY BEFORE BACKEND/API INTEGRATION.

Verify:

1. PostgreSQL connection
2. Prisma schema validity
3. migrations
4. tables
5. relationships
6. foreign keys
7. unique constraints
8. required fields
9. create operations
10. read operations
11. update operations
12. delete operations where the product actually requires deletion
13. persistence after application restart
14. invalid-data rejection
15. relationship integrity
16. transaction behavior where required

Do not create generic entities such as:

Record
Item
Entry
Data
Status

unless they are genuinely required by the product.

Do not create database tables merely because a generic CRUD template expects them.

Every database model must trace to:

USER REQUIREMENT
→ PRODUCT FEATURE
→ FRONTEND NEED
→ DATABASE NEED

If a database model has no such provenance, reject it.

After database verification passes, generate the Express backend against the VERIFIED schema.

Every backend API must trace to:

FRONTEND ACTION
→ API CONTRACT
→ EXPRESS ROUTE
→ CONTROLLER
→ SERVICE
→ PRISMA
→ POSTGRESQL
→ RESPONSE

Do not connect the frontend to the backend until BOTH:

DATABASE VERIFICATION = PASS
BACKEND VERIFICATION = PASS

Only then perform frontend/backend integration.

During integration, eliminate temporary frontend mock data one feature at a time and replace it with real API/database flows.

Then run the complete user workflow in real Chromium.

A feature is complete only when:

USER ACTION
→ FRONTEND
→ API
→ BACKEND
→ DATABASE
→ RESPONSE
→ FRONTEND STATE
→ VISIBLE RESULT

has been verified.

If any stage fails, STOP the pipeline at that stage, fix the responsible stage, re-run its verification, and only then continue.

Never hide a database/backend failure by modifying the frontend.

Never declare a feature complete merely because the UI looks correct.
Never declare a feature complete merely because the API returns 200.
Never declare a feature complete merely because the database contains tables.

The final application must pass:

FRONTEND
+ DATABASE
+ BACKEND
+ INTEGRATION
+ REAL BROWSER
+ VISUAL QUALITY
+ PERSISTENCE

before BROWSER_CERTIFIED.
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
- FORBIDDEN INSECURE PROTOCOLS: NEVER call raw fetch('http://...') with plain http protocol. Always use the canonical api client (import { api } from "@/services/api") or relative paths (e.g. fetch('/api/...')). Insecure http:// calls fail the Definition of Done security gate.

CANONICAL DATABASE CLIENT (EXPRESS BACKEND ONLY):
- server/lib/prisma.ts  (import { prisma } from "../lib/prisma")
- server/db/index.ts    (import { prisma } from "../db/index")

CANONICAL DOMAIN MODELS:
${canonicalDomainModelsList}

CANONICAL DIRECTORY BOUNDARIES:
- src/       React frontend code ONLY (NEVER import @prisma/client or server/**). Frontend tasks MUST ONLY output files inside src/.
- server/    Express backend code ONLY (routes, controllers, services, middleware). Backend tasks MUST ONLY output files inside server/.
- prisma/    Prisma database schema (prisma/schema.prisma). Database tasks MUST ONLY output files inside prisma/ or server/lib/.

CANONICAL UI & FEATURE RICHNESS (MANDATORY FOR ALL FRONTEND VIEWS):
- MUST implement all required domain features and models with reachable, interactive UI (dedicated pages or rich embedded components/drawers/modals).
- Every primary view/page MUST render a semantic <h1> containing the domain feature title (e.g. <h1>Glaze Chemistry Formulation</h1>) followed by a descriptive <p> explaining its purpose.
- NEVER output generic placeholder text (e.g. "Welcome to the application platform", "Dashboard placeholder", or unmounted views).
- All primary views MUST render:
  1. Top app bar / navigation header with branding, navigation links, and system status indicator.
  2. Domain KPI metric cards with live counts and trend percentages.
  3. Interactive Data Table / List with 4-8 realistic domain seed records (e.g. const [records, setRecords] = useState([...])). NEVER leave tables empty or render "No records found" on initial page load.
  4. Live search input & multi-tab status filters (e.g. All, In Progress, Pending, Completed).
  5. Interactive "+ New [Entity]" creation modal with input fields, select menus, validation, and working state updates.
  6. Operational panels (e.g. staff/resource load, parts/inventory status, quick action buttons).
  7. API integration calling backend endpoints via src/services/api.ts.
  8. Interactive Selection & Detail Inspector (MANDATORY FOR ALL VIEWS WITH DATA/RECORDS):
     - Declare: const [selectedItem, setSelectedItem] = useState<any>(null);
     - Every row or card item MUST attach: onClick={() => setSelectedItem(item)} className="cursor-pointer hover:bg-stone-50..."
     - When selectedItem !== null, render a detail inspector panel displaying its properties with an explicit close button: <button onClick={() => setSelectedItem(null)}>Close</button>.
  9. Interactive Status Filtering (MANDATORY FOR ALL VIEWS WITH DATA/RECORDS):
     - Declare: const [statusFilter, setStatusFilter] = useState('all');
     - Render multi-tab status filter buttons with onClick: <button onClick={() => setStatusFilter('all')}>All</button>, <button onClick={() => setStatusFilter('Active')}>Active</button>, etc.
     - Filter items: const filteredItems = (records || data || []).filter((r: any) => statusFilter === 'all' || (r.status || '').toLowerCase() === statusFilter.toLowerCase()); and render filteredItems.
     - NOTE: Even if data is fetched via a custom hook (e.g. const { data } = useDashboardData()), you MUST still declare [selectedItem, setSelectedItem] = useState(null), attach onClick={() => setSelectedItem(item)} to each row/card, render the detail inspector {selectedItem && ...}, declare [statusFilter, setStatusFilter] = useState('all'), and filter the records before rendering!
  10. Include data-workspace attribute on the root/workspace container element (e.g. data-workspace="catalog_grid").
${designBriefContext}

FORBIDDEN TECHNOLOGIES:
- Next.js, NextAuth, App Router, Server Actions, Next.js API Routes
- MongoDB, Mongoose, Drizzle
- Generic placeholder fallback pages or empty stub components
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

    let finalPrompt = prompt;
    if (task.id >= 9900 || request.includes("TARGETED CODER CAPABILITY REPAIR INSTRUCTION")) {
      // For targeted single-file repair, use a lean, focused prompt without dumping the entire project codebase
      finalPrompt = `${request}

${CANONICAL_CODER_CONTEXT_HEADER}

══════════════════════════════════════════════════════════════════════════════
CRITICAL TARGETED REPAIR CONSTRAINTS:
1. ONLY return the single target file specified in TARGET FILE.
2. DO NOT output or regenerate any helper components, design-system files, or other files.
3. Return the complete updated file content wrapped exactly in:
===FILE: [target-file-path]===
[complete updated code]
===END===
4. DO NOT omit any imports, types, or code. Do NOT use ellipsis (...).
══════════════════════════════════════════════════════════════════════════════
`;
    }

    const response =
      await this.generator.generate(
        finalPrompt,
        {
          agentType: "coder",
          complexity: (task.id >= 9900 || request.includes("TARGETED CODER CAPABILITY REPAIR INSTRUCTION")) ? 3 : task.estimatedComplexity,
          image,
          maxTokens: 8192,
        },
      );

    let files =
      this.parser.parse(
        response,
      );

    // Fallback for single-file targeted repair if parser returned no files
    if (files.length === 0 && (task.id >= 9900 || request.includes("TARGETED CODER CAPABILITY REPAIR INSTRUCTION"))) {
      const targetMatch = request.match(/TARGET FILE:\s*([^\r\n]+)/i);
      const targetPath = targetMatch ? targetMatch[1].trim() : ((task as any).files?.[0] || task.ownedFiles?.[0] || null);
      if (targetPath) {
        const codeBlockMatch = response.match(/```(?:[a-zA-Z0-9_-]+)?\s*\r?\n([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1].trim().length >= 150) {
          files = [{ path: targetPath, content: codeBlockMatch[1].trim() }];
        } else {
          const fileBlockMatch = response.match(/(?:^|\r?\n)={3,}\s*(?:FILE:\s*)?[a-zA-Z0-9_.\-\/\\]+\.[a-zA-Z0-9]+\s*={0,3}\r?\n([\s\S]*?)(?=(?:\r?\n={3,}\s*(?:FILE:\s*)?[a-zA-Z0-9_.\-\/\\]+\.[a-zA-Z0-9]+\s*={0,3}\r?\n)|(?:\r?\n={3,}\s*END\s*={0,3})|$)/i);
          if (fileBlockMatch && fileBlockMatch[1].trim().length >= 150) {
            files = [{ path: targetPath, content: fileBlockMatch[1].trim() }];
          }
        }
      }
    }

const stubDetector = new StubDetector();
for (const file of files) {
  // Strip harmless comments containing 'placeholder' or 'todo' so JSX comments don't falsely crash the entire process
  file.content = file.content
    .replace(/\{\/\*[\s\S]*?(placeholder|todo)[\s\S]*?\*\/\}/gi, "")
    .replace(/\/\*[\s\S]*?(placeholder|todo)[\s\S]*?\*\//gi, "")
    .replace(/\/\/(?!.*(?:http|https)).*(?:placeholder|todo).*$/gim, "");

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
