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
import { TokenBudgetManager } from "../context/token-budget.js";
import { ImportReconciler } from "../validation/import-reconciler.js";

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

    const { TaskNormalizer } = await import("../governance/task-normalizer.js");
    const taskOwnedRoutes: string[] = task.ownedRoutes && task.ownedRoutes.length > 0
      ? [...task.ownedRoutes]
      : TaskNormalizer.resolveOwnedRoutes(task);

    const taskTitle = (task.title || task.description || "").toLowerCase();
    const taskDesc = (task.description || "").toLowerCase();
    const isShellTask = taskTitle.includes("shell") || taskTitle.includes("navigation") || taskTitle.includes("scaffold") || taskTitle.includes("routing") || task.id === 1;
    const isBackendOrDbTask = taskTitle.includes("backend") || taskTitle.includes("api") || taskTitle.includes("server") || taskTitle.includes("prisma") || taskTitle.includes("database") || (task as any).stage === "Backend" || (task as any).stage === "Database";

    const selector = new FileSelector();
    const taskQuery = `${task.title || ""} ${task.description || ""}`.trim();
    const selectedEntries = selector.select(taskQuery, codebaseEntries, outputDirectory, task.ownedFiles ? task.ownedFiles.join(" ") : "");

    const candidateFiles: Array<{ path: string; content: string; isDirect?: boolean }> = [];
    const ownedSet = new Set(task.ownedFiles || []);
    for (const entry of selectedEntries) {
      const fullPath = join(outputDirectory, entry.path);
      if (existsSync(fullPath)) {
        try {
          const isSiteContent = entry.path.endsWith("site-content.ts");
          // Backend or database tasks do not need site copy
          if (isSiteContent && isBackendOrDbTask) {
            continue;
          }

          const content = readFileSync(fullPath, "utf8");
          const taskNeedsDirectContent = ownedSet.has(entry.path) ||
            taskTitle.includes("content") ||
            taskTitle.includes("copy") ||
            taskTitle.includes("marketing") ||
            taskDesc.includes("content strategist");

          const isDirect = ownedSet.has(entry.path) || (isSiteContent && taskNeedsDirectContent);

          let fileContent = content;
          if (isSiteContent && !taskNeedsDirectContent) {
            const brandMatch = content.match(/name:\s*["']([^"']+)["']/);
            const taglineMatch = content.match(/tagline:\s*["']([^"']+)["']/);
            const defaultBrand = architecture.name || "Application";
            const defaultTagline = (architecture as any).description ? String((architecture as any).description).slice(0, 50).trim() : "Modern Web Application";
            const bName = brandMatch ? brandMatch[1] : defaultBrand;
            const tLine = taglineMatch ? taglineMatch[1] : defaultTagline;
            fileContent = `// Structured summary of src/content/site-content.ts
export interface SiteContent {
  brand: { name: string; tagline: string; description: string };
  navigation: { items: Array<{ label: string; href: string }> };
  pages: Record<string, any>;
}
export const siteContent: SiteContent = {
  brand: { name: "${bName}", tagline: "${tLine}", description: "Authoritative domain copy" },
  navigation: { items: [] },
  pages: {},
};
export default siteContent;`;
          }

          candidateFiles.push({ path: entry.path, content: fileContent, isDirect });
        } catch {}
      }
    }

    // Keep complete project manifest path list intact — path lists are compact and prevent duplicate path hallucinations
    const manifestText = allFiles.join("\n");

    // ── Build canonical file contract context for this task ──────────────────────
    // Determine which canonical files this task is responsible for
    const promptLower = (request || "").toLowerCase();

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
        const layerStr = String((f as any).layer || "");
        if (layerStr === "config") return isShellTask || isDbTask;
        if (isFrontendTask && layerStr === "frontend") {
          // If this is a shell/layout/scaffold task, only match entry point & shell components, NOT all feature modules
          if (isShellTask) {
            const isEntryOrShell = f.canonicalPath === "src/main.tsx" ||
              f.canonicalPath === "src/App.tsx" ||
              f.canonicalPath === "src/index.css" ||
              f.canonicalPath === "src/routes.tsx" ||
              f.canonicalPath.includes("Navbar") ||
              f.canonicalPath.includes("Layout") ||
              f.canonicalPath.includes("Header");
            return isEntryOrShell;
          }
          // For feature tasks, match files belonging to this feature/entity or mentioned in title/description
          const entity = (f.entityName || (f as any).domain || "").toLowerCase();
          const role = (f.semanticRole || "").toLowerCase();
          const pathLower = f.canonicalPath.toLowerCase();
          const genericStopwords = new Set(["order", "orders", "page", "pages", "feature", "features", "module", "modules", "view", "views", "component", "components", "service", "services", "route", "routes", "workspace", "workspaces", "item", "items", "data", "management", "system", "index"]);

          // Check if entity name is specifically in the task title
          const entityInTitle = entity && entity.length > 2 && !genericStopwords.has(entity) && taskTitle.includes(entity);
          // Check if key role terms (non-stopwords) appear in title
          const roleInTitle = role.split(/[\s_-]+/).some(w => w.length > 3 && !genericStopwords.has(w) && taskTitle.includes(w));
          // Check if path segment (non-stopwords) appears in title
          const pathInTitle = pathLower.split(/[\/._-]+/).some(seg => seg.length > 3 && !genericStopwords.has(seg) && taskTitle.includes(seg));

          return entityInTitle || roleInTitle || pathInTitle;
        }
        if (isBackendTask && layerStr === "backend") {
          const entity = (f.entityName || (f as any).domain || "").toLowerCase();
          return !entity || taskTitle.includes(entity) || taskDesc.includes(entity) || f.canonicalPath.includes("server/index.ts") || f.canonicalPath.includes("auth");
        }
        if (isDbTask && (layerStr === "schema" || layerStr === "config")) return true;
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

    // Load locked Prisma schema model and field definitions if available on disk
    let lockedPrismaSchemaContext = "";
    const prismaSchemaPath = join(outputDirectory, "prisma", "schema.prisma");
    if (existsSync(prismaSchemaPath)) {
      try {
        const rawSchema = readFileSync(prismaSchemaPath, "utf8");
        const modelBlocks = rawSchema.match(/model\s+[A-Za-z0-9_$]+\s*\{[\s\S]*?\}/g);
        if (modelBlocks && modelBlocks.length > 0) {
          lockedPrismaSchemaContext = modelBlocks.join("\n\n");
        }
      } catch {}
    }

    // Inject API contract for API-related tasks only when ATS or generic API is appropriate
    if (isATS && (taskTitle.includes("api") || taskTitle.includes("service") || taskTitle.includes("frontend"))) {
      canonicalContractContext += `\n\n${CANONICAL_ATS_API_CONTRACT}`;
    }

    // Inject Multer contract for upload/scan controller tasks only when ATS or explicitly uploading files
    if (isATS && (taskTitle.includes("upload") || taskTitle.includes("scan") || taskTitle.includes("multer") || taskTitle.includes("pdf"))) {
      canonicalContractContext += `\n\n${CANONICAL_MULTER_CONTRACT}`;
    }

    let productExperiencePlanContext = "";
    let experiencePattern = "custom";
    let plan: any = null;
    let matchedPagePlans: any[] = [];
    try {
      const { ProductExperiencePlanManager } = await import("../design/product-experience-plan.js");
      plan = ProductExperiencePlanManager.load(outputDirectory);
      if (plan?.pagePlans && plan.pagePlans.length > 0) {
        const taskText = (taskTitle + " " + taskDesc).toLowerCase();
        matchedPagePlans = plan.pagePlans.filter((p: any) => {
          const routeSlug = p.route.replace(/^\//, "").replace(/[-_]/g, " ").toLowerCase();
          const roleLower = (p.pageRole || "").toLowerCase();
          const routeWords = routeSlug.split(/\s+/).filter((w: string) => w.length > 2);
          const roleWords = roleLower.split(/\s+/).filter((w: string) => w.length > 3 && !["stage", "view", "page", "feature"].includes(w));
          const focalWords = (p.focalElement || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);

          const matchesOwned = (task.ownedFiles || []).some((of: string) => {
            const ofLower = of.toLowerCase();
            return routeWords.some((w: string) => ofLower.includes(w)) ||
                   (p.route !== "/" && ofLower.includes(p.route.replace(/^\//, "")));
          });

          return matchesOwned ||
                 routeWords.some((w: string) => taskText.includes(w)) ||
                 roleWords.some((w: string) => taskText.includes(w)) ||
                 focalWords.some((w: string) => taskText.includes(w));
        });
      }
      if (plan) {
        experiencePattern = plan.experiencePattern || "custom";
        const capabilitiesList = (plan.requiredCapabilities || []).map((c: any) =>
          `  • ${c.name} (id: ${c.id})
      - Required Vocabulary (must appear visibly in headers, labels, descriptions): ${(c.evidenceVocabulary || []).join(", ")}
      - Required Interactive Controls: ${(c.controlsRequired || []).join(", ")}
      - Expected User Interaction: ${c.testInteraction?.controlType || "button"} ${c.testInteraction?.action || "click"}`
        ).join("\n\n");

        const expCap = plan.experienceCapability;
        const experienceCapabilityDetails = expCap ? `
- Experience Type: ${expCap.experienceType}
- Rendering Mode: ${expCap.renderingMode}
- Interaction Mode: ${expCap.interactionMode}
- Composition Mode: ${expCap.compositionMode}
- Motion Mode: ${expCap.motionMode}
- Depth Model: ${expCap.depthModel}
- Navigation Model: ${expCap.navigationModel}
- REAL_3D_REQUIRED: ${expCap.real3dRequired ? "TRUE (MANDATORY WebGL / Three.js 3D implementation)" : "FALSE"}
- Forbidden Substitutions: ${(expCap.forbiddenSubstitutions || []).join(", ") || "None"}
` : "";

        const real3dMandate = expCap?.real3dRequired ? `
══════════════════════════════════════════════════════════════════════════════
MANDATORY REAL 3D / WEBGL IMPLEMENTATION DIRECTIVE (HARD INVARIANT)
══════════════════════════════════════════════════════════════════════════════
The requested 3D experience is a FUNCTIONAL IMPLEMENTATION REQUIREMENT.
CSS-only decoration, box shadows, gradients, and 2D cards are STRICTLY FORBIDDEN as substitutes.
When the experience contract specifies IMMERSIVE_3D or REAL_3D_REQUIRED:
1. You MUST implement an actual WebGL / 3D scene (using Three.js via 'import * as THREE from "three"' or a native WebGL canvas).
2. The 3D scene MUST include:
   - A WebGL canvas element marked with data-aegis-3d="true" (e.g. <canvas data-aegis-3d="true" ref={canvasRef} className="w-full h-full" />).
   - An initialized Three.js Scene (new THREE.Scene()) or WebGL context.
   - A PerspectiveCamera (new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)).
   - Lighting (e.g. THREE.AmbientLight and THREE.DirectionalLight or PointLight with shadows/highlights).
   - Rendered 3D Mesh objects (geometric primitives, claymation shapes, spheres, cylinders, rounded terrain, interactive tokens, clouds). Group primitives with vibrant, tactile materials (MeshStandardMaterial with roughness ~0.6).
   - An active requestAnimationFrame render loop with continuous rotation, floating motion, or orbit/scroll response.
   - Pointer / mouse / scroll interaction with the 3D scene.
3. RUNTIME EXPERIENCE CONTRACT INSTRUMENTATION:
   The component MUST expose the runtime contract on window so Chromium can verify it:
   (window as any).__AEGIS_EXPERIENCE__ = {
     experienceType: "IMMERSIVE_3D",
     renderingMode: "webgl",
     ready: true,
     sceneReady: true,
     objectsRendered: 15,
     interactiveObjects: 5,
     scrollDriven: true,
     animationActive: true
   };
4. ZERO DOWNGRADE POLICY:
   If this page renders only 2D cards without a WebGL canvas and 3D scene, THE BUILD WILL BE REJECTED AT CHROMIUM REVIEW.
5. PRIMARY LANDING VIEW (ROUTE '/') ENFORCEMENT:
   - The primary landing view (mounted on route '/') MUST DIRECTLY render the active 3D WebGL canvas (<canvas data-aegis-3d="true">).
   - NEVER delegate the 3D canvas to a sub-route or sub-component while putting a flat 2D card grid on route '/'.
   - The 3D scene is the centerpiece stage. Auxiliary information (lore, notes, waypoints, stats) MUST be rendered as lightweight floating HUD overlays or dock pills over the 3D scene.
   - Keep card containers on the 3D stage minimal (maximum 3-4 HUD pills/panels). Strictly NO card walls or 6+ card grids.
══════════════════════════════════════════════════════════════════════════════` : "";

        const isEditorial = expCap?.experienceType === "EDITORIAL" || experiencePattern === "craft-editorial" || (plan?.compositionGraph?.navigationModel === "minimal-top-masthead");
        const editorialMandate = isEditorial ? `
══════════════════════════════════════════════════════════════════════════════
MANDATORY EDITORIAL / PUBLICATION ARCHITECTURE (ANTI-CONVERGENCE INVARIANT)
══════════════════════════════════════════════════════════════════════════════
This project is an EDITORIAL / MAGAZINE / MONOGRAPH publication.
A standard SaaS/marketing template ('Hero -> 3 Cards -> 3 Cards -> CTA -> Footer') is STRICTLY FORBIDDEN.
1. UNCONVENTIONAL TYPOGRAPHY & MASTHEAD:
   - Use dramatic editorial typography: large serif/display headlines, issue volume marks, author monographs, and reading-time metadata.
   - Navigation must be a minimal editorial masthead (publication title, issue number, article index toggle, curatorial credits).
2. ASYMMETRIC STORYTELLING & PHOTO ESSAYS:
   - Large full-bleed or split-column editorial imagery/photography paired with pull-quotes, italicized marginalia, and photo captions.
   - Immersive article reading layout with dual columns, drop-caps, archival footnotes, or horizontal/experimental scrolling.
3. ZERO CANNED CARD GRIDS:
   - Do NOT render a generic grid of 3 identical SaaS cards or feature boxes.
   - Present stories as curated issues, full-spread features, photo essays, and photographer profiles.
══════════════════════════════════════════════════════════════════════════════` : "";

        const identity = plan.experienceIdentity;
        const relevantIdentityRules = isShellTask
          ? []
          : (identity?.pageCompositionLanguage?.pageCompositionRules || []).filter((r: any) =>
              taskOwnedRoutes.length === 0 || taskOwnedRoutes.includes(r.route)
            );
        const identityRulesToRender = relevantIdentityRules.length > 0
          ? relevantIdentityRules
          : (identity?.pageCompositionLanguage?.pageCompositionRules || []).slice(0, 1);
        const compositionRulesText = isShellTask
          ? "  • Shell Scaffold: Layout shell, header navigation, and routing outlets for all declared routes."
          : identityRulesToRender.map((r: any) => `  • Route "${r.route}" (${r.pageRole}):
    - Structure: ${r.dominantStructure}
    - Focal Element: ${r.primaryFocalElement}
    - Banned Patterns: ${(r.bannedPatterns || []).join(", ")}
    - Allowed Components: ${(r.allowedComponents || []).join(", ")}
    - Layout: ${r.layoutDescription}`).join("\n\n");

        const identityContext = identity ? `
══════════════════════════════════════════════════════════════════════════════
WEBSITE EXPERIENCE IDENTITY (AUTHORITATIVE SYSTEM ARCHITECTURE)
══════════════════════════════════════════════════════════════════════════════
- Experience Genre: ${identity.genre}
- Brand Identity: "${identity.brandIdentity.name}" — ${identity.brandIdentity.essence}
- Tone & Voice: ${identity.brandIdentity.tone} | Voice: ${identity.brandIdentity.voice}
- Surface & Material: ${identity.surfaceMaterialLanguage.philosophy}
- Typography Language:
  * Display: "${identity.typographyLanguage.displayFont}" | Body: "${identity.typographyLanguage.bodyFont}" | Scale: ${identity.typographyLanguage.scale}
  ${identity.typographyLanguage.pullQuoteStyle ? `* Pull-Quote Style: "${identity.typographyLanguage.pullQuoteStyle}"` : ""}
  ${identity.typographyLanguage.marginaliaStyle ? `* Marginalia Style: "${identity.typographyLanguage.marginaliaStyle}"` : ""}
- Navigation Model (CONSISTENT ACROSS ENTIRE SITE):
  * Model: ${identity.navigationDesign.model} (Position: ${identity.navigationDesign.position})
  * Primary Routes: ${(identity.navigationDesign.primaryItems || []).map((i: any) => `${i.label} (${i.path})`).join(" • ")}
  * RULE: The navbar shell is CONSISTENT across all routes of this site. Do NOT reinvent or replace the navbar on sub-pages.
- Page Composition Language & Rhythm:
  * Rhythm: ${identity.pageCompositionLanguage.rhythm} | Grid: ${identity.pageCompositionLanguage.gridSystem}
  * Hero Philosophy: ${identity.pageCompositionLanguage.heroPhilosophy}
  * Card Prohibition: ${identity.pageCompositionLanguage.cardProhibitionReason || "Controlled card density"}

══════════════════════════════════════════════════════════════════════════════
CRITICAL ANTI-CONVERGENCE MANDATE: NO SEARCH + FILTER + CARD-GRID REPETITION
══════════════════════════════════════════════════════════════════════════════
DO NOT FALL BACK TO:
  [Heading] -> [Search input + Filter buttons] -> [Grid of 4-6 Cards with 'Read More / Detail'] -> [Modal]
This pattern is STRICTLY FORBIDDEN on non-database/non-CRUD websites.
Instead, compose each route according to its assigned architectural role:
${compositionRulesText}
══════════════════════════════════════════════════════════════════════════════` : "";

        productExperiencePlanContext = `
══════════════════════════════════════════════════════════════════════════════
LOCKED PRODUCT EXPERIENCE PLAN (HIGHEST PRIORITY PRODUCT MANDATE)
══════════════════════════════════════════════════════════════════════════════
- Experience Pattern: ${plan.experiencePattern}
- Primary Activity: ${plan.primaryActivity}
${experienceCapabilityDetails}- Expected Home Route: '${plan.expectedHomeRoute}'
  * CRITICAL: Route '${plan.expectedHomeRoute}' MUST DIRECTLY render the primary interactive domain workspace / 3D universe!
  * NEVER render a generic landing page, an unpopulated showcase dashboard, or a login wall at '${plan.expectedHomeRoute}'.
  * The root view ('/') must be fully interactive with live working domain tools immediately on initial page load.
- Required Domain Capabilities (YOU MUST IMPLEMENT FULLY WORKING INTERACTIVE UI FOR EACH):
${capabilitiesList || "  (Defined by feature specs)"}
- ZERO PLACEHOLDER POLICY:
  * Strictly NO "pending Three.js integration", NO "canvas placeholder", NO "coming soon", NO "TODO", NO "No records found".
  * Every capability must render functional, working interactive controls (sliders, color pickers, material dropdowns, dimension inputs, live recalculating formulas/meters, and interactive 3D WebGL / Canvas charts).
- AUTHENTICATION POLICY:
  * authWallAllowed: ${plan.authWallAllowed}
  * ${plan.authWallAllowed ? "Authentication is expected." : "NEVER redirect to or gate the home route with a login screen. The product tools must be directly usable on initial page load."}
══════════════════════════════════════════════════════════════════════════════
${identityContext}
${plan.compositionGraph ? `
══════════════════════════════════════════════════════════════════════════════
LOCKED COMPOSITION GRAPH & ARCHITECTURE (ANTI-TEMPLATE MANDATE)
══════════════════════════════════════════════════════════════════════════════
- Experience Intent: ${plan.compositionGraph.experienceIntent || plan.primaryActivity}
- Focal Element:     ${plan.compositionGraph.focalElement || "Primary workspace stage"}
- Layout Topology:   ${plan.compositionGraph.layoutTopology || "custom"}
- Navigation Model:  ${plan.compositionGraph.navigationModel || "custom"}
- Interaction Model: ${plan.compositionGraph.interactionModel || "direct"}
- Motion Language:   ${plan.compositionGraph.motionPlan ? `${plan.compositionGraph.motionPlan.style} (${plan.compositionGraph.motionPlan.entryAnimation})` : "fluid micro-interactions"}
- Card Density Limit:${plan.compositionGraph.cardDensityRatio !== undefined ? ` Max ${Math.round(plan.compositionGraph.cardDensityRatio * 100)}% cards` : " Controlled"}
- Forbidden Layouts: ${(plan.compositionGraph.forbiddenTemplates || []).join(", ") || "Hero -> Cards -> CTA"}

ARCHITECTURAL SECTIONS (IMPLEMENT IN THIS EXACT STRUCTURAL ORDER):
${(plan.compositionGraph.sections || []).map((s: any, idx: number) => `  ${idx + 1}. [${s.type.toUpperCase()}] ${s.name} (layout: ${s.layoutRule || "custom"})\n     Focus: ${s.primaryFocus}\n     Components: ${(s.components || []).join(", ")}`).join("\n\n")}
══════════════════════════════════════════════════════════════════════════════
` : ""}
${real3dMandate}
${editorialMandate}
${(plan.pagePlans && plan.pagePlans.length > 0) ? `
══════════════════════════════════════════════════════════════════════════════
APPLICATION NAVIGATION & TASK-SCOPED PAGE PLAN
══════════════════════════════════════════════════════════════════════════════
All project routes: ${(plan.pagePlans || []).map((p: any) => `${p.route} (${p.pageRole})`).join(" • ")}
Assigned task route(s): ${taskOwnedRoutes.join(", ")}

AUTHORITATIVE PAGE EXPERIENCE PLAN FOR ASSIGNED ROUTE(S):
${isShellTask
    ? `• GLOBAL APPLICATION SHELL & SCAFFOLD:
  - Focus: Navigation Header, Route Scaffold, Shared Layout Shell
  - Declared project routes: ${(plan.pagePlans || []).map((p: any) => p.route).join(", ")}`
    : (((plan.pagePlans || []).filter((p: any) => taskOwnedRoutes.includes(p.route))).length > 0
        ? (plan.pagePlans || []).filter((p: any) => taskOwnedRoutes.includes(p.route))
        : (matchedPagePlans.length > 0 ? matchedPagePlans : (plan.pagePlans || []).slice(0, 1))
      ).map((p: any) => `
• ROUTE: "${p.route}" (${p.pageRole})
  - Purpose: ${p.purpose}
  - Experience Intent: ${p.experienceIntent}
  - Primary Focal Element: ${p.focalElement}
  - Dominant Structure: ${p.composition.dominantStructure} (Topology: ${p.composition.topology})
  - Sections: ${(p.composition.sections || []).join(" -> ")}
  - Primary Interactions: ${(p.interaction.primary || []).join("; ")}
  - Content Presentation: ${p.contentPresentation}
  - Required Capabilities: ${(p.requiredCapabilities || []).join(", ")}
  - FORBIDDEN PATTERNS: ${(p.forbiddenPatterns || []).join(", ")}
`).join("\n")}

STRICT RULE FOR SECONDARY PAGES:
- A page is INCOMPLETE if it merely renders search/filter bars, card grids, or a generic "+ Add [Item]" CRUD modal.
- NEVER create state variables like [newTitle, setNewTitle], [records, setRecords] with "+ Add [Entity]" forms on experiential routes!
- Adhere strictly to the focal element and dominant structure specified for this route.
══════════════════════════════════════════════════════════════════════════════` : ""}
`;
      }
    } catch {}

    let designBriefContext = "";
    let isOverviewTask = false;
    let pageMetricGuidance = "";
    const briefPath = join(outputDirectory, ".aegis", "design-brief.json");
    if (existsSync(briefPath)) {
      try {
        const brief = JSON.parse(readFileSync(briefPath, "utf8"));
        const matchedPage = (brief.pageCompositions || []).find((p: any) => {
          const pName = (p.name || "").toLowerCase();
          const pRoute = (p.route || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const tTitle = taskTitle.toLowerCase();
          const tDesc = taskDesc.toLowerCase();
          return (pName && (tTitle.includes(pName) || tDesc.includes(pName))) ||
                 (pRoute && (tTitle.includes(pRoute) || tDesc.includes(pRoute)));
        });
        isOverviewTask = Boolean(
          matchedPage?.isSummaryOverview === true ||
          matchedPage?.heroElement === "metric-cluster" ||
          (taskTitle.includes("dashboard") && (experiencePattern === "operations-dashboard" || experiencePattern === "realtime-console"))
        );

        pageMetricGuidance = isOverviewTask
          ? `══════════════════════════════════════════════════════════════════════════════
PAGE METRIC CONTRACT (SUMMARY / OVERVIEW VIEW):
══════════════════════════════════════════════════════════════════════════════
- This view is a designated summary/overview page and may render KPI or summary metric cards.
- DYNAMIC DATA COMPUTATION REQUIREMENT: Every metric value MUST be computed from this page's active seed dataset (e.g. records.length, filtered counts, calculated sums, or real proportions).
- STRICTLY FORBIDDEN: Do NOT hardcode arbitrary static numbers (e.g. "6 Specimens", "96% Optimal") or copy metrics from other routes.
══════════════════════════════════════════════════════════════════════════════`
          : `══════════════════════════════════════════════════════════════════════════════
PAGE METRIC CONTRACT (DIRECT FEATURE / WORKSPACE VIEW):
══════════════════════════════════════════════════════════════════════════════
- This view is a DIRECT WORKSPACE, CATALOG, JOURNAL, SCHEDULE, OR WORKFLOW VIEW (NOT a dashboard summary).
- Open DIRECTLY with the page heading, a brief natural subtitle, and the active feature workspace/catalog/timeline.
- STRICTLY FORBIDDEN: Do NOT render a top row of 3-4 KPI stat cards, metric summary boxes, or <MetricCard> components.
- STRICTLY FORBIDDEN: Do NOT import or use <MetricCard> in this page.
══════════════════════════════════════════════════════════════════════════════`;

        const reqWords = (brief.vocabularyContract?.required || []).join(", ");
        const prefWords = (brief.vocabularyContract?.preferred || []).join(", ");
        const forbWords = (brief.vocabularyContract?.forbidden || []).join(", ");
        const principles = (brief.designPrinciples || []).map((p: string) => `  • ${p}`).join("\n");
        const scopedCompositions = (brief.pageCompositions || []).filter((p: any) => taskOwnedRoutes.includes(p.route));
        const effectiveCompositions = scopedCompositions.length > 0
          ? scopedCompositions
          : ((brief.pageCompositions || []).slice(0, 1));
        const pages = effectiveCompositions.map((p: any) =>
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
- Color System: Primary=${brief.colorSystem?.primary} (${brief.colorSystem?.primaryHex || ""}), Secondary=${brief.colorSystem?.secondary || ""} (${brief.colorSystem?.secondaryHex || ""}), Background=${brief.colorSystem?.background}, Surface=${brief.colorSystem?.surface}, SurfaceElevated=${brief.colorSystem?.surfaceRaised || ""}, TextPrimary=${brief.colorSystem?.textPrimary}, Accent=${brief.colorSystem?.accent}
- Aesthetic Compliance: You MUST strictly adopt the specified Art Direction and Color System palette (e.g. background ${brief.colorSystem?.background}, primary ${brief.colorSystem?.primaryHex}, secondary ${brief.colorSystem?.secondaryHex}). Never fall back to generic indigo/cyan corporate SaaS styles unless explicitly directed by the brief. Never output raw kebab-case slugs (e.g. "plant-management", "watering-schedules Volume") as user-visible button labels, card titles, or headings.
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



    let brandName = "";
    let tagline = "";
    const siteContentPath = join(outputDirectory, "src", "content", "site-content.ts");
    if (existsSync(siteContentPath)) {
      try {
        const contentSource = readFileSync(siteContentPath, "utf8");
        const brandMatch = contentSource.match(/name:\s*["']([^"']+)["']/);
        const taglineMatch = contentSource.match(/tagline:\s*["']([^"']+)["']/);
        brandName = brandMatch ? brandMatch[1] : "";
        tagline = taglineMatch ? taglineMatch[1] : "";
      } catch {}
    }

    const isFrontendStage = (task as any)?.stage === "Frontend" || (task as any)?.stage === "frontend";

    // ── Task-to-Route PageExperiencePlan Matching ────────────────────────────
    let taskPageExperienceContract = "";
    if (plan?.pagePlans && plan.pagePlans.length > 0) {
      if (matchedPagePlans.length > 0 && !isShellTask) {
        taskPageExperienceContract = `
══════════════════════════════════════════════════════════════════════════════
AUTHORITATIVE PAGE EXPERIENCE CONTRACT FOR THIS TASK (ROUTE-SPECIFIC MANDATE)
══════════════════════════════════════════════════════════════════════════════
This task is explicitly assigned to build the following intentional designed route(s):
${matchedPagePlans.map((p: any) => `
▶ ROUTE: "${p.route}" — ${p.pageRole.toUpperCase()}
  • Purpose: ${p.purpose}
  • Experience Intent: ${p.experienceIntent}
  • Primary Focal Element: ${p.focalElement}
  • Dominant Structure: ${p.composition.dominantStructure}
  • Composition Topology: ${p.composition.topology}
  • Structural Sections: ${(p.composition.sections || []).join(" -> ")}
  • Primary Interactions to Implement:
${(p.interaction.primary || []).map((i: string) => `    * ${i}`).join("\n")}
  • Required Capabilities: ${(p.requiredCapabilities || []).join(", ")}
  • Content Presentation: ${p.contentPresentation}
  • Visual Hierarchy: Primary=${p.visualHierarchy?.primary || "Hero visual"}, Secondary=${(p.visualHierarchy?.secondary || []).join(", ")}

  HARD NEGATIVE CONSTRAINTS (CRITICAL FAILURE AT PageExperienceQualityGate):
  ${(p.forbiddenPatterns || []).map((f: string) => `  ✗ NO ${f.toUpperCase()}`).join("\n")}
  ✗ DO NOT declare statusFilter or searchQuery state variables.
  ✗ DO NOT render <input placeholder="Search..."> or search bars.
  ✗ DO NOT render filter buttons (e.g. ['all', 'unlocked', 'dozing']).
  ✗ DO NOT render a 3-column card grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3) with <div className="card">.
  ✗ DO NOT render generic "+ Add [Item]" forms, CRUD modals, or [newTitle, setNewTitle] state.
  ✗ Set root container attribute: data-workspace="${p.pageRole.toLowerCase().replace(/[^a-z0-9]/g, "_")}"
`).join("\n\n")}
══════════════════════════════════════════════════════════════════════════════`;
      }
    }

    let capabilityInstructions = "";
    if (isShellTask) {
      const navDesign = plan?.navigationDesign;
      const navGuidance = navDesign ? `
MANDATORY NAVIGATION DESIGN (PRODUCT-LEVEL UNIQUE IDENTITY):
- Navigation Model: "${navDesign.model}" (Position: ${navDesign.position})
- Brand Treatment: "${navDesign.brandTreatment.name}"
  * Typography: ${navDesign.brandTreatment.typography}
  * Logo Type: ${navDesign.brandTreatment.logoType}
  * STRICT RULE: Never truncate the brand name with ellipses (e.g. "Create an independent fa..."). Use clean brand "${navDesign.brandTreatment.name}".
- Primary Navigation Items (Authoritative):
${(navDesign.primaryItems || []).map((i: any) => `  * Route "${i.path}" -> Label: "${i.label}"`).join("\n")}
- Visual & Surface Treatment:
  * Surface: ${navDesign.visualTreatment?.surface || "bespoke"}
  * Active state: ${navDesign.visualTreatment?.activeState || "underline/glow"}
  * Container style: ${navDesign.visualTreatment?.containerClass || navDesign.visualTreatment?.geometry || "bespoke"}
- STRICTLY FORBIDDEN:
  * DO NOT insert a generic "More" dropdown menu.
  * DO NOT generate generic items like "Bookmark", "Portfolio Item", or "Primary Workspace" in navigation.
  * DO NOT use generic dark stone-900 / amber-pulse templates across different products.
  * DO NOT make "Home" mandatory if the product contract uses domain-specific labels.` : "";

      capabilityInstructions = `SHELL & SCAFFOLD TASK INSTRUCTIONS:
====================================
This task is strictly responsible for the Application Shell, Layout, and Routing Scaffold:
${navGuidance}
- Implement navigation header (Navbar.tsx or Header.tsx) strictly adhering to the Navigation Design specification above.
- Implement React Router configuration (routes.tsx or App.tsx) mapping all user flow routes.
- Keep route pages as ultra-compact inline stubs within routes.tsx or simple placeholders. DO NOT create large multi-file feature implementations.
- MAXIMUM 3-4 FILES TOTAL: Only output src/App.tsx, src/routes.tsx, and src/components/Navbar.tsx (plus Layout.tsx if used).
- Detailed feature pages and capabilities MUST NOT be generated in this task; they are assigned to Tasks 2–4.
- Keep output concise, modular, and focused on layout and navigation.`;
    } else if (experiencePattern === "immersive-3d" || plan?.experienceCapability?.real3dRequired) {
      const spatial = plan?.compositionGraph?.spatialPlan;
      const sceneType = spatial?.sceneType || "SPATIAL_STAGE";
      const focalObj = spatial?.focalObject || `${brandName || "Domain"} interactive 3D focal subject`;
      const lighting = spatial?.lightingModel || "Balanced three-point studio lighting with subtle ambient fill";
      const cameraDesc = spatial?.cameraStrategy || "Interactive pointer orbit with smooth damping";
      const scenesList = spatial?.scenes && spatial.scenes.length > 0
        ? spatial.scenes.map((s: any, i: number) => `      * Scene ${i + 1} ("${s.name}"): ${s.description} [Cam: ${s.cameraPosition.join(", ")}]`).join("\n")
        : `      * Scene 1 ("Hero Stage"): Procedural focal scene with interactive 3D elements\n      * Scene 2 ("Detailed Inspection"): Close perspective view on focal subject\n      * Scene 3 ("Interactive State"): Reactive elements responding to user interaction`;

      const isRootTask = matchedPagePlans.some((p: any) => p.route === "/") || taskTitle.toLowerCase().includes("world") || taskTitle.toLowerCase().includes("stage");
      const isCharacterTask = matchedPagePlans.some((p: any) => p.route.includes("character") || (p.requiredCapabilities || []).some((c: string) => c.includes("character") || c.includes("avatar"))) || taskTitle.toLowerCase().includes("character") || taskTitle.toLowerCase().includes("avatar");
      const isQuestTask = matchedPagePlans.some((p: any) => p.route.includes("quest") || p.route.includes("map") || (p.requiredCapabilities || []).some((c: string) => c.includes("map") || c.includes("quest") || c.includes("trail"))) || taskTitle.toLowerCase().includes("quest") || taskTitle.toLowerCase().includes("map");
      const isSoundTask = matchedPagePlans.some((p: any) => p.route.includes("sound") || p.route.includes("audio") || (p.requiredCapabilities || []).some((c: string) => c.includes("sound") || c.includes("audio"))) || taskTitle.toLowerCase().includes("sound") || taskTitle.toLowerCase().includes("audio");
      const isJourneyTask =
        matchedPagePlans.some((p: any) =>
          p.route.includes("journey") || p.route.includes("chronicle") ||
          (p.requiredCapabilities || []).some((cap: string) =>
            cap === "scroll-chapter-controller" || cap === "scroll-driven-storytelling" || cap === "parallax-background"
          )
        ) ||
        taskTitle.toLowerCase().includes("journey") ||
        taskTitle.toLowerCase().includes("chronicle") ||
        taskTitle.toLowerCase().includes("scroll") ||
        matchedPagePlans.some((p: any) => (p.pageRole || "").toLowerCase().includes("scroll-driven") || (p.pageRole || "").toLowerCase().includes("narrative") || (p.pageRole || "").toLowerCase().includes("chronicle"));

      if (isRootTask) {
        capabilityInstructions = `MANDATORY IMMERSIVE 3D EXPERIENCE COMPOSITION (WEBGL / THREE.JS):
================================================================================
This view is the REAL IMMERSIVE 3D SPATIAL WORLD ENTRANCE [${sceneType}] — NOT a flat card grid, NOT a SaaS dashboard!
Focal Subject: ${focalObj}

1. ROOT ROUTE ('/') — THE 3D STAGE:
   - Must mount a full-bleed interactive 3D WebGL Scene using Three.js:
     import * as THREE from 'three';
   - Mount a canvas element with: <canvas data-aegis-3d="true" ref={canvasRef} className="w-full h-full absolute inset-0" />
   - 3D Scene Initialization:
     * Scene: const scene = new THREE.Scene();
     * Camera: const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
     * Renderer: Wrap WebGLRenderer instantiation in a try/catch with fallback so headless environments without GPU hardware render safely: let renderer = null; try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { console.warn("WebGL fallback", e); }. In animation loop, guard: if (renderer) renderer.render(scene, camera); In cleanup, guard: if (renderer) renderer.dispose();
     * Lighting: ${lighting}
     * Meshes: Procedural 3D geometry representing ${focalObj}. Group Three.js primitives with tactile MeshStandardMaterial / MeshPhysicalMaterial.
     * Render Loop: Active requestAnimationFrame loop rotating objects, animating particles/floating motion, and responding to pointer/mouse movement or scroll progress.
     * Spatial Progression / Scenes:
${scenesList}
     * Camera Strategy: ${cameraDesc}
   - INTERACTIVE HUD OVERLAY (Layered directly over 3D canvas):
     * Navigation: Minimal HUD overlay with brand wordmark and scene controls (NO generic card grids floating over the canvas).
     * Interactive Controls: View switcher pills or focal inspection buttons that orbit the camera or animate scene objects when clicked.

2. RUNTIME EXPERIENCE CONTRACT INSTRUMENTATION:
   The component MUST expose window.__AEGIS_EXPERIENCE__ on mount:
   (window as any).__AEGIS_EXPERIENCE__ = {
     experienceType: "IMMERSIVE_3D",
     renderingMode: "webgl",
     ready: true,
     sceneReady: true,
     objectsRendered: 15,
     interactiveObjects: 5,
     scrollDriven: true,
     animationActive: true
   };

CRITICAL INVARIANTS:
- ZERO downgrade to flat 2D cards. The canvas MUST be present and WebGL MUST render real 3D geometry.
- ROOT CONTAINER ATTRIBUTE: The root container MUST have: data-workspace="immersive_3d_stage"`;
      } else if (isCharacterTask) {
        capabilityInstructions = `MANDATORY CHARACTER ENCOUNTER & DIALOGUE STAGE COMPOSITION:
================================================================================
This view is a CHARACTER-FOCUSED INTERACTIVE ENCOUNTER — NOT a directory of cards, NOT a search page!
STRICTLY FORBIDDEN:
- NO search bars (<input placeholder="Search...">) or searchQuery state
- NO filter buttons or statusFilter state
- NO 3-column card grid (<div className="card">)
- NO "+ Add" CRUD form or modals

MANDATORY COMPOSITION:
1. Two-Column Interactive Character Stage:
   - Left Column: Character Avatar Plinth / Preview Stage with interactive expressions using animated SVG avatars or tactile canvas.
   - Right Column: Interactive Character Console:
     * Character switcher dock with active selection state.
     * Personality dossier (voice tone, attributes, background lore).
     * Interactive Voice / Dialogue Simulator: Action triggering audio chime / reaction state.
     * Branching dialogue prompt choices with reactive conversational responses.
2. Root container MUST have: data-workspace="character_stage"`;
      } else if (isQuestTask) {
        capabilityInstructions = `MANDATORY SPATIAL MAP & ROUTE PLOTTER COMPOSITION:
================================================================================
This view is an INTERACTIVE SPATIAL MAP & ROUTE PLOTTER — NOT a table, NOT a card grid!
STRICTLY FORBIDDEN:
- NO search inputs or filter button rows
- NO 3-column card directories
- NO "+ Add" modal or CRUD form

MANDATORY COMPOSITION:
1. Spatial Map Canvas / Terrain Viewport:
   - Interactive SVG or 2D canvas cartographic map showing domain landmarks or waypoints.
   - Clickable landmark nodes/markers with coordinates, hover tooltips, and connection paths/trails.
   - Landmark selection state updating the active waypoint inspect panel.
2. Waypoint Dossier & Progress Ledger (Slide-out or side panel):
   - Selected landmark details, challenges, difficulty badge, and rewards.
   - Interactive "Embark" or "Complete Waypoint" action with celebratory feedback.
   - Progress bar computed from unlocked nodes.
3. Root container MUST have: data-workspace="spatial_quest_map"`;
      } else if (isSoundTask) {
        capabilityInstructions = `MANDATORY ATMOSPHERIC SOUNDBOARD & AUDIO CONSOLE COMPOSITION:
================================================================================
This view is an INTERACTIVE AUDIO ENVIRONMENT — NOT a flat card list!
STRICTLY FORBIDDEN:
- NO search inputs or filter button rows
- NO 3-column card directories

MANDATORY COMPOSITION:
1. Audio Synthesizer Matrix & Resonance Pads:
   - Interactive sound pads triggering real Web Audio API sounds (AudioContext with oscillators).
   - Active playing visual state: waveform / frequency bar pulses when audio triggers.
   - Ambient loop toggle with master volume and tempo sliders.
2. Root container MUST have: data-workspace="tactile_soundboard"`;
      } else if (isJourneyTask) {
        const scrollPlan = matchedPagePlans.find((p: any) =>
          (p.requiredCapabilities || []).some((cap: string) =>
            cap === "scroll-chapter-controller" || cap === "scroll-driven-storytelling"
          ) || p.route.includes("journey") || p.route.includes("chronicle")
        ) || matchedPagePlans[0];
        const scrollPurpose = scrollPlan?.purpose || "Immersive narrative storytelling experience";
        const scrollFocalEl = scrollPlan?.focalElement || "Cinematic chapter progression";
        const scrollInteractions = (scrollPlan?.interaction?.primary || []).slice(0, 3).join("; ") || "Scroll progression, chapter navigation, interactive details";
        const scrollWorkspace = (scrollPlan?.pageRole || "narrative_scroll").toLowerCase().replace(/[^a-z0-9]/g, "_");

        capabilityInstructions = `MANDATORY SCROLL-DRIVEN NARRATIVE CHRONICLE COMPOSITION:
================================================================================
This view is a NARRATIVE SCROLL STORYTELLING EXPERIENCE — NOT a card directory, NOT a search page!
Route Purpose: ${scrollPurpose}
Focal Element: ${scrollFocalEl}
Key Interactions: ${scrollInteractions}
STRICTLY FORBIDDEN:
- NO search inputs, filter button rows, or statusFilter state variables
- NO 3-column card grids or generic card directories
- NO "+Add" CRUD forms or newTitle/newContent state

MANDATORY COMPOSITION:
1. Continuous Immersive Scroll Chronicle derived from the domain:
   - Scroll-driven chapter progression (4 meaningful chapter sections).
   - Each chapter section: large cinematic headline, editorial prose from siteContent, visual showcase, and an interactive action element.
   - scrollProgress state variable tracking scroll position.
   - Floating pill nav or chapter indicators allowing smooth jump.
2. REQUIRED scroll-story DOM markers:
   - data-scene="scene-N" on each chapter section container
   - data-chapter="chapter-N" on each chapter section container
   - data-scroll-progress="true" on the root scroll container
   - Root container MUST expose: (window as any).__AEGIS_EXPERIENCE__ = { experienceType: "SCROLL_STORY", renderingMode: "canvas2d", ready: true, scrollDriven: true, scrollProgress: 0, chaptersLoaded: 4 };
3. Root container MUST have: data-workspace="${scrollWorkspace}"`;
      } else {
        capabilityInstructions = `MANDATORY BESPOKE EXPERIENTIAL ROUTE COMPOSITION:
================================================================================
This view is an intentional designed stage derived from the PageExperiencePlan.
Build the assigned dominant structure and primary focal element.
STRICTLY FORBIDDEN:
- NO generic card grids, NO search/filter bars, NO "+ Add" CRUD forms.
- Root container MUST have: data-workspace="${(matchedPagePlans[0]?.pageRole || 'bespoke_stage').toLowerCase().replace(/[^a-z0-9]/g, '_')}"`;
      }
    } else if (experiencePattern === "storefront-commerce") {
      const domainCaps = plan?.requiredCapabilities || [];
      const customConfigurator = domainCaps.find((c: any) => (c.id || "").includes("builder") || (c.id || "").includes("configurator") || (c.id || "").includes("custom"));
      const schedulerCap = domainCaps.find((c: any) => (c.id || "").includes("scheduler") || (c.id || "").includes("pickup") || (c.id || "").includes("booking"));
      const subscriptionCap = domainCaps.find((c: any) => (c.id || "").includes("subscription") || (c.id || "").includes("membership"));
      const dealsCap = domainCaps.find((c: any) => (c.id || "").includes("deal") || (c.id || "").includes("discount") || (c.id || "").includes("sale"));
      const locationCap = domainCaps.find((c: any) => (c.id || "").includes("pincode") || (c.id || "").includes("zip") || (c.id || "").includes("location"));

      capabilityInstructions = `MANDATORY STOREFRONT COMPOSITION (CONSUMER RETAIL / COMMERCE / MARKETPLACE):
================================================================================
This product is a CONSUMER STOREFRONT — NOT a tabbed console, NOT a CRM table, NOT an admin dashboard.
The root route ('/') MUST be a single continuous-scroll page composed of the following sections IN ORDER:

1. STICKY TOP NAVBAR:
   - Brand mark (left), category filter pills, search bar, cart icon with live item badge, and account avatar.
   - Cart icon click MUST open a slide-out cart drawer showing: item list (name, qty, price), subtotal sum, and primary "Proceed to Checkout" button.
   - Implement: const [cartItems, setCartItems] = useState<any[]>([]);
   - Implement: const [cartOpen, setCartOpen] = useState(false);

2. HERO PRESENTATION:
   - Full-width visually rich hero banner with authentic domain headline ("${tagline || 'Curated Essentials Delivered Daily'}"), editorial subtitle, and a primary CTA button that scrolls down to the catalog.

3. MAIN CATALOG / MENU GRID:
   - Responsive grid of 8–16 authentic domain item cards with: high-res image, item title, description/specs, price, and primary "Add to Bag" / "Add to Cart" button.
   - "Add to Bag" / "Add to Cart" MUST increment/append the item to cartItems and open or update the cart badge.
   - Implement: const addToCart = (item: any) => setCartItems(prev => ...);
   - Include authentic domain badges (e.g. 'Featured', 'Bestseller', 'Staff Pick', 'Limited').

${customConfigurator ? `4. INTERACTIVE PRODUCT CONFIGURATOR (${customConfigurator.name}):
   - An interactive configurator section: customer selects options (size/tier, materials/flavors, accessories/customizations).
   - Live price estimator that updates dynamically with choices.
   - "Add Customized Item" button that adds the configured item directly to the cart bag.
` : ""}${schedulerCap ? `5. INTERACTIVE APPOINTMENT / PICKUP SCHEDULER (${schedulerCap.name}):
   - Inline slot reservation widget: customer selects date and morning/afternoon time slot.
` : ""}${subscriptionCap ? `6. RECURRING SUBSCRIPTION / MEMBERSHIP TIERS (${subscriptionCap.name}):
   - Tiered weekly/monthly subscription cards with 'Subscribe' action buttons.
` : ""}${dealsCap ? `7. SPECIAL OFFERS & COUNTDOWN DEALS (${dealsCap.name}):
   - Countdown timer with discounted items strip.
` : ""}${locationCap ? `8. DELIVERY / AVAILABILITY CHECKER (${locationCap.name}):
   - Compact inline widget to check postal/location delivery availability.
` : ""}
9. SLIDE-OUT CART DRAWER (conditionally rendered when cartOpen === true):
   - Right-anchored sliding panel showing each item, quantity modifiers (−/+), line prices, subtotal calculation, and "Proceed to Checkout" button.
   - Clicking backdrop or close button closes drawer (setCartOpen(false)).

CRITICAL CONSUMER STOREFRONT RULES:
- ZERO TABS as page layout containers. The entire customer journey is continuous scroll down route '/'.
- ZERO ADMIN CONTROLS on customer routes: Do NOT render '+ Add Menu Item', '+ Add Product', or 'Manage Records' buttons. This is a public storefront for customers, NOT an internal operations dashboard.
- AUTHENTIC SECTION HEADINGS: Do NOT print internal capability IDs or metadata in headings. Use authentic customer copy.
- ROOT CONTAINER ATTRIBUTE: The root page container MUST have: data-workspace="retail_storefront"`;
    } else if (experiencePattern === "hospitality-portal" || experiencePattern === "booking-platform") {
      capabilityInstructions = `MANDATORY HOSPITALITY & RESERVATION PORTAL COMPOSITION:
================================================================================
This product is a CONSUMER HOSPITALITY / BOOKING PORTAL — NOT a tabbed management console, NOT an admin panel.
The root route ('/') MUST be a continuous-scroll guest experience combining:

1. LUXURY HERO BANNER:
   - High-impact visual presentation, brand wordmark, tagline ("${tagline || 'Experience Exceptional Hospitality'}").
   - Integrated "Check Availability" bar: Arrival Date picker, Departure Date picker, Guest/Party count selector, and "Check Rates" button.
2. ACCOMMODATIONS & SPACES SHOWCASE:
   - Curated grid/carousel of rooms, villas, suites, or bookable spaces.
   - Each card: high-res photo, guest capacity, amenities badge, rate per night/slot, and "Reserve" button.
   - "Reserve" click opens an interactive booking drawer or reservation modal with dates and guest options.
3. AMENITIES & EXPERIENCES PREVIEW:
   - Curated showcase of dining, wellness, or curated excursions with schedule and details.
4. INTERACTIVE RESERVATION DRAWER / MODAL:
   - Summary of selected accommodation/experience, dates, guest count, live price calculation, and "Confirm Reservation" CTA.

CRITICAL HOSPITALITY PORTAL RULES:
- The root route ('/') MUST mount this full experience portal, NEVER an isolated single-item page.
- ZERO admin management buttons (+ Add Villa, Manage Inventory).
- ZERO tab-consoles as page root. Stacks sections elegantly with smooth scrolling.
- ROOT CONTAINER ATTRIBUTE: The root page container MUST have: data-workspace="hospitality_portal"`;
    } else if (experiencePattern === "personal-tracker") {
      capabilityInstructions = `MANDATORY PERSONAL TRACKER & JOURNAL PAGE COMPOSITION:
================================================================================
This is a PERSONAL TRACKER product — NOT a database admin panel, NOT a CRM, NOT an ops dashboard.
The page MUST feel warm, personal, and human — like a physical journal or personal companion come to life.

STRICTLY FORBIDDEN PATTERNS:
- NEVER render a row of 4 corporate KPI cards with fake percentages
- NEVER render a data table with columns (Name, Status, Date, Actions)
- NEVER render "Active Service View" or "Service Status: Online"
- NEVER use hardcoded stone-*/indigo-* classes; use CSS variable tokens or design system palette

MANDATORY COMPOSITION:
1. PAGE HEADER (personal and warm):
   - Date-aware greeting: const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
   - Render: <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Today · {today}</p>
   - Natural phrase headline derived from domain activity
   - Motivational streak badge inline: "🔥 7-day streak" or "📖 12 entries this month"

2. PRIMARY INTERACTIVE TRACKER ZONE:
   - Domain-authentic tracker tool: interactive input controls, selectors, buttons, and progress incrementers.
   - State changes MUST update the UI visibly in real time.

3. TIMELINE / JOURNAL FEED:
   - Vertical feed of 3–5 seeded past entries styled as personal cards with date header, tags, and notes.

4. VISUAL PROGRESS & METRICS:
   - Current streak, progress indicators, inline SVG bar chart or completion ring.

ROOT CONTAINER ATTRIBUTE: data-workspace="personal_tracker"`;
    } else if (plan?.requiredCapabilities && plan.requiredCapabilities.length > 0) {
      const isPrimaryWorkspaceTask = taskTitle.includes("workspace") && (taskTitle.includes("primary") || taskTitle.includes("dashboard") || task.id === 1);
      const taskCaps = isPrimaryWorkspaceTask
        ? plan.requiredCapabilities
        : plan.requiredCapabilities.filter((cap: any) => {
            const capName = (cap.name || "").toLowerCase();
            const capId = (cap.id || "").toLowerCase();
            const words = [...capName.split(/\s+/), ...capId.split(/[-_]+/)].filter((w: string) => w.length > 3);
            return words.some((w: string) => taskTitle.includes(w) || taskDesc.includes(w));
          });
      const capsToInject = taskCaps.length > 0 ? taskCaps : plan.requiredCapabilities.slice(0, 2);

      capabilityInstructions = `MANDATORY CAPABILITY PANELS STRUCTURE:
======================================
This view MUST implement working interactive controls for the domain capabilities assigned to this task:

${capsToInject.map((cap: any, idx: number) => {
  const controls = (cap.controlsRequired || ["button", "input"]).map((c: string) => `<${c}>`).join(", ");
  const vocabSample = (cap.evidenceVocabulary || []).slice(0, 6).join(", ");
  return `CAPABILITY / FEATURE ${idx + 1} — "${cap.name}":
  - Required vocabulary: ${vocabSample}
  - Interactive controls: Must render working interactive ${controls}
  - Initial State: Must render sensible default values and visible results immediately on initial load.`;
}).join("\n\n")}

Mount this capability into the feature view with working local state (useState), active parameters, and visible results.
The feature root element MUST have: data-workspace="configurator_workspace"
ZERO placeholder text. ZERO "Coming soon". ZERO empty results on initial load — prepopulate with default values.`;
    } else if (experiencePattern === "showcase-landing" || experiencePattern === "portfolio") {
      capabilityInstructions = `MANDATORY SHOWCASE / PORTFOLIO PAGE COMPOSITION:
================================================================================
MUST be editorial, visual-first, brand-quality. NOT an admin panel.
STRICTLY FORBIDDEN: Tabs, data tables, "Active Service View", hardcoded classes.

1. FULL-WIDTH HERO: Large typographic statement, brand tagline, primary CTA
2. WORK / PROJECT GRID: Masonry or responsive grid of showcase cards with preview, title, tags, and action
3. ABOUT SECTION: Two-column layout (statement left, bio and credentials right)
4. CONTACT / INQUIRY CTA: Interactive contact form with input fields and submit action
ROOT CONTAINER: data-workspace="showcase_landing"`;
    } else if (experiencePattern === "booking-flow") {
      capabilityInstructions = `MANDATORY BOOKING / SCHEDULING PAGE COMPOSITION:
================================================================================
MUST be step-oriented, clear, transactional. NOT an admin table.

1. SERVICE SELECTION: Grid of bookable items with name, duration, price, "Select" button
   const [selectedService, setSelectedService] = useState<any>(null)
2. DATE & TIME PICKER: Calendar grid + time slot selector
   const [selectedDate, setSelectedDate] = useState(new Date())
   const [selectedSlot, setSelectedSlot] = useState<string>("")
3. BOOKING SUMMARY: Sticky panel with selected service, date, time, price, "Confirm" CTA
4. SUCCESS STATE: On submit, styled confirmation card with reference ID
   const [confirmed, setConfirmed] = useState(false)
ROOT CONTAINER: data-workspace="booking_flow"`;
    } else if (experiencePattern === "catalog-browser" || experiencePattern === "content-feed") {
      capabilityInstructions = `MANDATORY CATALOG / DISCOVERY PAGE COMPOSITION:
================================================================================
This is a CATALOG or DISCOVERY product — consumer-grade browsing experience.
MUST feel like a curated marketplace or directory — NOT an admin table.

1. SEARCH & FILTER BAR: Full-width search input + horizontal filter pill row (category tags)
   const [searchQuery, setSearchQuery] = useState<string>("")
   const [activeFilter, setActiveFilter] = useState<string>("all")

2. FEATURED ROW: 1–2 featured items in wide editorial cards

3. CATALOG GRID: Responsive CSS grid of 8–12 authentic item cards:
   - Each card: thumbnail div with icon, title, description snippet, tag badge, action button
   const [items, setItems] = useState<any[]>([])

4. FILTER LOGIC:
   const filtered = items.filter(i => activeFilter === "all" || i.category === activeFilter)
                         .filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()))

5. LOAD MORE or PAGINATION button
ROOT CONTAINER: data-workspace="catalog_browser"`;
    } else {
      capabilityInstructions = `MANDATORY BESPOKE VIEW COMPOSITION — ANTI-CONVERGENCE MANDATE:
=====================================================
STRICTLY FORBIDDEN IN ALL GENERATED VIEWS (violation = immediate rejection):
- NEVER render "Active Service View" as any badge, label, or heading text
- NEVER render "Manage and interact with [feature] services and features." as description text
- NEVER render "Submit your inquiry or update configuration for [feature]."
- NEVER render "Search resources..." or generic search inputs unless the PageExperiencePlan explicitly specifies search
- NEVER render generic filter button rows (['all', 'active', 'completed']) unless explicitly an operations dashboard
- NEVER render generic 3-column card grids (<div className="card">) as a substitute for rich feature composition
- NEVER render "+ New [Entity]" or "+ Add [Item]" forms with [newTitle, setNewTitle] state
- NEVER render "Service Status: Online", "Sync Mode: Automatic", or "Availability: Online" info panels
- NEVER use hardcoded Tailwind color classes (stone-*, indigo-*); use CSS tokens or Tailwind utility tokens.

EVERY ROUTE IS A FIRST-CLASS DESIGNED EXPERIENCE:
1. Adhere strictly to the PageExperiencePlan for each route being generated in this task.
2. Build the exact focal element specified in the plan (e.g. 3D plinth, spatial map, soundboard console, editorial spread).
3. Provide meaningful, observable interactive state (working sliders, selectors, audio players, waypoints) with rich seed data.
4. Set the root container attribute data-workspace to the route's specific workspace identifier (e.g. data-workspace="character_stage", "spatial_quest_map", "soundboard_console").`;
    }

    const CANONICAL_CODER_CONTEXT_HEADER = `
══════════════════════════════════════════════════════════════════════════════
CANONICAL PROJECT ARCHITECTURE & QUALITY CONSTRAINTS (AUTHORITATIVE)
══════════════════════════════════════════════════════════════════════════════
1. STAGE & DIRECTORY BOUNDARIES:
${isFrontendStage ? `   - FRONTEND-ONLY TASK: You are implementing Task #${task.id}: "${task.title}". Output files EXCLUSIVELY inside src/.
   - DO NOT generate or modify backend files: NO server/, NO express, NO prisma/, NO database files (FrontendFilePolicy will reject them).
   - ALL interactive features, forms, filters, toggles, modals, and calculations MUST work in the browser with React state (useState/useReducer) and realistic domain seed data.` : `   - BACKEND & DATABASE STAGE: Implement Express routes, controllers, services, and Prisma schema to fulfill approved frontend requirements.
   - Output backend files inside server/ and prisma/schema.prisma.`}
   - NEVER import @prisma/client or server/** inside src/.
   - MODULARITY & TOKEN LIMIT: Keep components focused, clean, and under 300 lines of code to avoid token truncation.
   - NEVER regenerate untouched existing files from previous tasks (e.g. Navbar.tsx, App.tsx, routes.tsx) unless adding an import/route for this task.
   - NEVER preemptively generate full files for future tasks.

2. AUTHORITATIVE DOMAIN CONTENT CONTRACT (MANDATORY IMPORT — HARD GATE):
   - Brand Name: "${brandName || (plan?.experienceIdentity?.brandIdentity?.name) || 'Application'}" | Tagline: "${tagline || (plan?.experienceIdentity?.brandIdentity?.essence) || 'Domain Experience'}"
   - In Navigation (Navbar.tsx / Header.tsx) and primary pages, you MUST import:
     import siteContent from "../../content/site-content"; // or relative path
   - Render the authentic brand info:
     {siteContent.brand.name}
     {siteContent.brand.tagline}
   - IMMUTABLE AUTHORITATIVE COPY: NEVER generate, rewrite, or output src/content/site-content.ts. It is already generated by ContentStrategistAgent. ONLY import from it.
   - DO NOT invent arbitrary brand names, generic mock text, or placeholder marketing strings.
   - Hard Check 11 will inspect every .tsx file. At least one file MUST import siteContent.

3. CANONICAL COMPONENTS & SERVICE ARCHITECTURE:
   - Shared Components (USE THESE — DO NOT INVENT ARBITRARY SHARED COMPONENTS):
     * Button:      src/design-system/components/Button.tsx
     * Skeleton:    src/design-system/components/Skeleton.tsx
     * EmptyState:  src/design-system/components/EmptyState.tsx
     * GlassCard:   src/design-system/components/GlassCard.tsx
     * Card:        src/shared/components/Card.tsx
     * Layout:      src/shared/components/Layout.tsx
   - Canonical Frontend API Service:
     * Canonical API Service: src/services/api.ts (import { api, login, register } from "@/services/api" or "../../services/api")
     * FORBIDDEN IMPORT ALIASES: NEVER import "@/services/apiClient" or "src/services/apiClient.ts" or "src/services/api-client". The ONLY canonical API module is "src/services/api.ts".
     * FORBIDDEN INSECURE PROTOCOLS: NEVER call raw fetch('http://...') with plain http protocol. Always use the canonical api client or relative paths.
   - Canonical Database Client (Express Backend Only):
     * server/lib/prisma.ts  (import { prisma } from "../lib/prisma")
     * server/db/index.ts    (import { prisma } from "../db/index")
   - Locked Canonical Prisma Schema & Field Definitions (STRICT CONTRACT — YOU MUST CONFORM TO THESE EXACT FIELDS):
${lockedPrismaSchemaContext ? lockedPrismaSchemaContext : canonicalDomainModelsList}
   - HARD PRISMA SCHEMA INVARIANT: All database queries and mutations (prisma.<model>.findMany, create, update, etc.) MUST strictly use the exact model and field names defined in prisma/schema.prisma above.
     * NEVER invent or substitute field synonyms (e.g. if Service defines 'durationMinutes', you MUST use 'durationMinutes', NOT 'duration'; if ScheduleRule defines 'isAvailable', you MUST use 'isAvailable', NOT 'isWorkingDay').
     * NEVER omit required schema fields (e.g. userId must always reference a valid User record).

4. BESPOKE PAGE EXPERIENCE & ANTI-TEMPLATE QUALITY (MANDATORY FOR ALL VIEWS):
   - Adhere strictly to the PageExperiencePlan for each route in this task.
   - Build the exact focal element specified in the plan with meaningful interactive state (working sliders, selectors, tables, modals).
   - Set container root attribute: data-workspace="[workspace_identifier]" (e.g. data-workspace="character_stage", "operations_terminal").
   - Every primary view MUST render a semantic <h1> containing the domain feature title followed by a descriptive <p> explaining its purpose.
   - STRICTLY FORBIDDEN IN ALL VIEWS:
     * NEVER render "Active Service View" as any badge, label, or heading text.
     * NEVER render "Manage and interact with [feature] services and features." as description text.
     * NEVER render "Submit your inquiry or update configuration for [feature].".
     * NEVER render generic placeholder text ("Welcome to the application platform", "Dashboard placeholder", or unmounted views).
     * NEVER render generic 3-column card grids as a substitute for rich feature composition.
     * NEVER use hardcoded Tailwind color classes (stone-*, indigo-*); use CSS tokens in src/design-system/tokens.ts.
     * NEVER use technologies conflicting with the locked ArchitectureContract (Frontend: ${contract?.frontend?.framework || "React"}, Backend: ${contract?.backend?.framework || "Express"}, DB: ${contract?.database?.provider || "SQLite"}, ORM: ${contract?.database?.orm || "Prisma"}).

${taskPageExperienceContract}
${productExperiencePlanContext}
${capabilityInstructions}
${designBriefContext}
${pageMetricGuidance}
══════════════════════════════════════════════════════════════════════════════
`.trim();

    // ── Token Budget Management & 3-Tier Degradation ──────────────────────────
    const profile = TokenBudgetManager.getProfile(this.provider.name);

    // Estimate base tokens required for core instructions (excluding file contents)
    const basePromptText = `${request}\n${CANONICAL_CODER_CONTEXT_HEADER}`;
    const baseTokensEstimated = TokenBudgetManager.estimateTokens(basePromptText, true);

    // Compute remaining token headroom for candidate files, bounded by the active model ceiling
    const { PromptBudgetInstrumenter } = await import("../governance/prompt-budget-instrumenter.js");
    const activeCeiling = PromptBudgetInstrumenter.getActiveCeiling(this.provider.name);
    const targetFileBudget = Math.max(
      400,
      activeCeiling - baseTokensEstimated - 2000
    );
    const availableFileTokens = Math.min(
      profile.maxFileTokens,
      targetFileBudget
    );

    // Partition files into Tier 1 (full), Tier 2 (signatures), Tier 3 (withheld) without mid-file truncation
    const degradedFiles = TokenBudgetManager.degradeFilesToBudget(candidateFiles, availableFileTokens);
    const relevantFilesContent = TokenBudgetManager.formatFileContext(degradedFiles);

    const prompt =
      this.promptEngine.build(
        [task],
        architecture,
        architecturePlan,
        request,
        outputDirectory,
        { skipFileContext: true },
      );

    let finalPrompt = "";
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
    } else {
      finalPrompt = `${prompt}

${CANONICAL_CODER_CONTEXT_HEADER}

Existing relevant files content:
${relevantFilesContent}

All existing project files (manifest list):
${manifestText}

══════════════════════════════════════════════════════════════════════════════
CRITICAL TASK SCOPE & BOUNDARY RULES:
1. You are implementing EXCLUSIVELY Task ${task.id}: "${task.title}".
2. ONLY generate or edit the files required for this specific task (${task.title}).
3. NEVER regenerate untouched existing files from previous tasks (e.g. Navbar.tsx, App.tsx, routes.tsx) unless adding an import/route for this task.
4. NEVER preemptively generate full files for future tasks.
5. MODULARITY & TOKEN LIMIT: Keep components focused, clean, and strictly under 250-300 lines of code. Split complex page features into reusable sub-components in src/components/ rather than creating monolithic 500+ line files that risk output token truncation. Never output truncated code blocks.
══════════════════════════════════════════════════════════════════════════════
`;
    }

    // ── Prompt Budget Instrumentation & Hard Regression Ceiling Enforcement ───
    const { PromptManager } = await import("../prompts/prompt-manager.js");
    const sysPrompt = new PromptManager().getCoderPrompt();
    const instrumentReport = PromptBudgetInstrumenter.measurePrompt(
      sysPrompt,
      finalPrompt,
      {
        routePlan: productExperiencePlanContext,
        designBrief: designBriefContext,
        architectureContract: CANONICAL_CODER_CONTEXT_HEADER,
        fileContext: relevantFilesContent,
      }
    );

    console.log(`[PromptBudgetInstrumenter] Task #${task.id} Prompt Tokens: ${instrumentReport.totalEstimatedPromptTokens.toLocaleString()} (Target: < 8,500, Ceiling: ${activeCeiling.toLocaleString()}) | Sys: ${instrumentReport.systemPromptTokens}, User: ${instrumentReport.userPromptTokens}, Files: ${instrumentReport.fileContextTokens}`);
    if (instrumentReport.duplicateContentDetected) {
      console.warn(`[PromptBudgetInstrumenter] ⚠️ Duplicate content detected in Task #${task.id}:`, instrumentReport.duplicateDetails);
    }

    // HARD GATE: Enforce dynamic model-aware ceiling per implementation request.
    // Rejects oversized prompts BEFORE any provider dispatch occurs.
    PromptBudgetInstrumenter.assertWithinCeiling(instrumentReport, this.provider.name);

    const response =
      await this.generator.generate(
        finalPrompt,
        {
          agentType: "coder",
          complexity: (task.id >= 9900 || request.includes("TARGETED CODER CAPABILITY REPAIR INSTRUCTION")) ? 3 : task.estimatedComplexity,
          image,
          maxTokens: profile.maxCompletionTokens,
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
  // Reconcile missing Lucide icons, React hooks, and dual exports deterministically
  file.content = ImportReconciler.reconcile(file.content, file.path);

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
