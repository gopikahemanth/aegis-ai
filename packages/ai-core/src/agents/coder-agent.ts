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

    const candidateFiles: Array<{ path: string; content: string }> = [];
    for (const entry of selectedEntries) {
      const fullPath = join(outputDirectory, entry.path);
      if (existsSync(fullPath)) {
        try {
          const content = readFileSync(fullPath, "utf8");
          candidateFiles.push({ path: entry.path, content });
        } catch {}
      }
    }

    // Keep complete project manifest path list intact — path lists are compact and prevent duplicate path hallucinations
    const manifestText = allFiles.join("\n");

    // ── Build canonical file contract context for this task ──────────────────────
    // Determine which canonical files this task is responsible for
    const taskTitle = task.title.toLowerCase();
    const taskDesc = task.description.toLowerCase();
    const isShellTask = taskTitle.includes("shell") || taskTitle.includes("navigation") || taskTitle.includes("scaffold") || taskTitle.includes("routing") || task.id === 1;
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
    try {
      const { ProductExperiencePlanManager } = await import("../design/product-experience-plan.js");
      plan = ProductExperiencePlanManager.load(outputDirectory);
      if (plan) {
        experiencePattern = plan.experiencePattern || "custom";
        const capabilitiesList = plan.requiredCapabilities.map((c: any) => 
          `  • ${c.name} (id: ${c.id})
      - Required Vocabulary (must appear visibly in headers, labels, descriptions): ${(c.evidenceVocabulary || []).join(", ")}
      - Required Interactive Controls: ${(c.controlsRequired || []).join(", ")}
      - Expected User Interaction: ${c.testInteraction?.controlType || "button"} ${c.testInteraction?.action || "click"}`
        ).join("\n\n");

        productExperiencePlanContext = `
══════════════════════════════════════════════════════════════════════════════
LOCKED PRODUCT EXPERIENCE PLAN (HIGHEST PRIORITY PRODUCT MANDATE)
══════════════════════════════════════════════════════════════════════════════
- Experience Pattern: ${plan.experiencePattern}
- Primary Activity: ${plan.primaryActivity}
- Expected Home Route: '${plan.expectedHomeRoute}'
  * CRITICAL: Route '${plan.expectedHomeRoute}' MUST DIRECTLY render the primary interactive domain workspace!
  * NEVER render a generic landing page, an unpopulated showcase dashboard, or a login wall at '${plan.expectedHomeRoute}'.
  * The root view ('/') must be fully interactive with live working domain tools immediately on initial page load.
- Required Domain Capabilities (YOU MUST IMPLEMENT FULLY WORKING INTERACTIVE UI FOR EACH):
${capabilitiesList || "  (Defined by feature specs)"}
- ZERO PLACEHOLDER POLICY:
  * Strictly NO "pending Three.js integration", NO "canvas placeholder", NO "coming soon", NO "TODO", NO "No records found".
  * Every capability must render functional, working interactive controls (sliders, color pickers, material dropdowns, dimension inputs, live recalculating formulas/meters, and interactive SVG/Canvas charts).
- AUTHENTICATION POLICY:
  * authWallAllowed: ${plan.authWallAllowed}
  * ${plan.authWallAllowed ? "Authentication is expected." : "NEVER redirect to or gate the home route with a login screen. The product tools must be directly usable on initial page load."}
══════════════════════════════════════════════════════════════════════════════
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



    let contentContractContext = "";
    const siteContentPath = join(outputDirectory, "src", "content", "site-content.ts");
    if (existsSync(siteContentPath)) {
      try {
        const contentSource = readFileSync(siteContentPath, "utf8");
        const brandMatch = contentSource.match(/name:\s*["']([^"']+)["']/);
        const taglineMatch = contentSource.match(/tagline:\s*["']([^"']+)["']/);
        const brandName = brandMatch ? brandMatch[1] : "";
        const tagline = taglineMatch ? taglineMatch[1] : "";

        contentContractContext = `
══════════════════════════════════════════════════════════════════════════════
AUTHORITATIVE DOMAIN CONTENT CONTRACT (MANDATORY IMPORT — HARD GATE)
══════════════════════════════════════════════════════════════════════════════
The project contains pre-approved, authentic domain copy at: "src/content/site-content.ts".
Brand Name: "${brandName}"
Tagline:    "${tagline}"

MANDATORY CODING RULES:
1. In Navigation (Navbar.tsx / Header.tsx) and primary pages, you MUST import:
   import siteContent from "../../content/site-content"; // or relative path
2. Render the authentic brand info:
   {siteContent.brand.name}
   {siteContent.brand.tagline}
3. DO NOT invent arbitrary brand names, generic mock text, or placeholder marketing strings.
4. Hard Check 11 will inspect every .tsx file. If ZERO files import siteContent, the entire build will be rejected.
`;
      } catch {}
    }

    const isFrontendStage = (task as any)?.stage === "Frontend" || (task as any)?.stage === "frontend";
    const STAGE_SPECIFIC_CODER_INSTRUCTION = isFrontendStage
      ? `══════════════════════════════════════════════════════════════════════════════
CURRENT ACTIVE STAGE: FRONTEND PROTOTYPE (PRE-APPROVAL)
══════════════════════════════════════════════════════════════════════════════
You are implementing a FRONTEND-ONLY task: "${task.title}".
- DO NOT generate or modify backend files: NO server/, NO express, NO prisma/, NO database files.
- Backend and database generation will happen in a later stage AFTER human review and approval.
- Any backend/database files generated in this task WILL BE REJECTED by FrontendFilePolicy.
- ALL interactive features, forms, filters, toggles, modals, and metric calculations MUST work immediately in the browser using React local state (useState, useReducer, or mock stores).
- Prepopulate all state with realistic, rich domain seed data.
- ANTI-AI-WEBSITE PRINCIPLE: Strictly adhere to design tokens in src/design-system/tokens.ts. Avoid random gradients, generic purple cards, and inconsistent border radii.
- AUTHORITATIVE CONTENT CONTRACT: Import and render content from src/content/site-content.ts as-is. This copy is FINAL — do not rewrite, paraphrase, or regenerate it.`
      : `══════════════════════════════════════════════════════════════════════════════
CURRENT ACTIVE STAGE: BACKEND & DATABASE (POST-APPROVAL)
══════════════════════════════════════════════════════════════════════════════
The frontend has been reviewed and approved by the human user.
Implement the backend routes, controllers, services, and Prisma database schema to fulfill the approved frontend requirements.

DATABASE IS A FIRST-CLASS STAGE.
After the user approves the frontend, do NOT immediately write arbitrary backend code.
First perform DATABASE DESIGN.
Inspect the approved frontend and locked Product/Experience Brief.
Derive ONLY the data actually required by the product:
USER REQUIREMENT -> FRONTEND FEATURE -> REQUIRED DATA -> ENTITY -> RELATIONSHIP -> DATABASE MODEL

Every backend API must trace to:
FRONTEND ACTION -> API CONTRACT -> EXPRESS ROUTE -> CONTROLLER -> SERVICE -> PRISMA -> POSTGRESQL -> RESPONSE`;

    let capabilityInstructions = "";
    if (isShellTask) {
      capabilityInstructions = `SHELL & SCAFFOLD TASK INSTRUCTIONS:
====================================
This task is strictly responsible for the Application Shell, Layout, and Routing Scaffold:
- Implement sticky top navigation header (Navbar.tsx or Header.tsx) with brand identity, logo, navigation links, and theme styling.
- Implement React Router configuration (routes.tsx or App.tsx) mapping all user flow routes.
- Keep route pages as ultra-compact inline stubs within routes.tsx or simple placeholders. DO NOT create large multi-file feature implementations.
- MAXIMUM 3-4 FILES TOTAL: Only output src/App.tsx, src/routes.tsx, and src/components/Navbar.tsx (plus Layout.tsx if used).
- Detailed feature pages and capabilities MUST NOT be generated in this task; they are assigned to Tasks 2–4.
- Keep output concise, modular, and focused on layout and navigation.`;
    } else if (experiencePattern === "storefront-commerce") {
      const isBakeryOrFood = promptLower.includes("bakery") || promptLower.includes("bread") || promptLower.includes("pastry") || promptLower.includes("cake") || promptLower.includes("food") || promptLower.includes("cafe");
      const hasCustomCake = (plan?.requiredCapabilities || []).some((c: any) => c.id === "custom-cake-builder") || promptLower.includes("cake");
      const hasPickup = (plan?.requiredCapabilities || []).some((c: any) => c.id === "pickup-scheduler") || promptLower.includes("pickup");
      const hasSubscription = (plan?.requiredCapabilities || []).some((c: any) => c.id === "bread-subscription") || promptLower.includes("subscription");
      const hasCarousel = (plan?.requiredCapabilities || []).some((c: any) => c.id === "hero-carousel") || promptLower.includes("carousel");
      const hasDeals = (plan?.requiredCapabilities || []).some((c: any) => c.id === "lightning-deals") || promptLower.includes("deal");
      const hasPincode = (plan?.requiredCapabilities || []).some((c: any) => c.id === "pincode-checker") || promptLower.includes("pincode");

      capabilityInstructions = `MANDATORY STOREFRONT COMPOSITION (RETAIL / FOOD / MARKETPLACE):
=========================================================
This product is a CONSUMER STOREFRONT — NOT a tabbed console, NOT a CRM table, NOT an admin dashboard.
The root route ('/') MUST be a single continuous-scroll page composed of the following sections IN ORDER:

1. STICKY TOP NAVBAR:
   - Brand mark (left), category filter pills (center: e.g. ${isBakeryOrFood ? "Sourdough, Viennoiserie, Rustic Loaves, Custom Cakes" : "All, Featured, New Arrivals, Best Sellers"}), search bar, cart icon with live item badge, and account avatar.
   - Cart icon click MUST open a slide-out cart drawer showing: item list (name, qty, price), subtotal sum, and primary "Proceed to Checkout" button.
   - Implement: const [cartItems, setCartItems] = useState<any[]>([]);
   - Implement: const [cartOpen, setCartOpen] = useState(false);

2. HERO PRESENTATION:
   - Full-width visually rich hero banner with headline ("${isBakeryOrFood ? "Handcrafted Daily with Slow-Fermented Grains" : "Curated Essentials Delivered Daily"}"), editorial subtitle, and a primary CTA button that scrolls down to the catalog.
   ${hasCarousel ? "- Implement an auto-playing hero banner carousel with next/prev controls and slide indicators." : ""}

3. MAIN CATALOG / MENU GRID:
   - Responsive grid of 8–16 authentic domain item cards with: high-res image, item title, description/ingredients, price, and primary "Add to Bag" / "Add to Cart" button.
   - "Add to Bag" / "Add to Cart" MUST increment/append the item to cartItems and open or update the cart badge.
   - Implement: const addToCart = (item: any) => setCartItems(prev => ...);
   ${isBakeryOrFood ? "- Include badges like 'Freshly Baked at 6 AM', '24h Cold Ferment', 'Organic Flour', or 'Limited Loaves'." : ""}

${hasCustomCake ? `4. CUSTOM CAKE ORDERING CONFIGURATOR:
   - An interactive cake builder section: customer selects cake size (6", 8", 10", 2-tier), sponge flavor (Vanilla Bean, Dark Chocolate, Spiced Carrot), filling/frosting (Swiss Buttercream, Espresso Cream, Raspberry Coulis), and optional personalized inscription input.
   - Live price estimator that updates dynamically with choices.
   - "Order Custom Cake" button that adds the customized cake configuration directly to the cart bag.
` : ""}${hasPickup ? `5. FRESH BAKE PICKUP SCHEDULER:
   - Inline pickup slot reservation widget: customer selects pickup date and morning/afternoon slot (e.g. 8:00 AM - 10:00 AM, 11:00 AM - 1:00 PM).
` : ""}${hasSubscription ? `6. RECURRING BREAD SUBSCRIPTION CLUB:
   - Tiered weekly subscription cards (e.g. 'Weekend Boule Club', 'Artisan Baker's Box') with 'Subscribe' buttons.
` : ""}${hasDeals ? `7. TODAY'S FLASH DEALS & TIMER:
   - Countdown timer with discounted items strip.
` : ""}${hasPincode ? `8. DELIVERY PINCODE CHECKER:
   - Compact inline widget to check postal delivery availability.
` : ""}
9. SLIDE-OUT CART DRAWER (conditionally rendered when cartOpen === true):
   - Right-anchored sliding panel showing each item, quantity modifiers (−/+), line prices, subtotal calculation, and "Proceed to Checkout" button.
   - Clicking backdrop or close button closes the drawer (setCartOpen(false)).

CRITICAL CONSUMER STOREFRONT RULES:
- ZERO TABS as page layout containers. The entire customer journey is continuous scroll down route '/'.
- ZERO ADMIN CONTROLS on customer routes: Do NOT render '+ Add Menu Item', '+ Add Product', or 'Manage Records' buttons. This is a public storefront for customers, NOT an internal operations dashboard.
- AUTHENTIC SECTION HEADINGS: Do NOT print internal capability IDs or metadata in headings (NEVER render 'Product Catalog Grid', 'Delivery Pincode Availability Checker', or 'Artisan Bakery Management Suite'). Use authentic customer copy like "From the Hearth", "Daily Fresh Bakes", "Design Your Cake".
- ROOT CONTAINER ATTRIBUTE: The root page container MUST have: data-workspace="retail_storefront"`;
    } else if (experiencePattern === "hospitality-portal") {
      capabilityInstructions = `MANDATORY HOSPITALITY PORTAL COMPOSITION (LUXURY RESORT / HOTEL):
=============================================================
This product is a LUXURY CONSUMER HOSPITALITY PORTAL — NOT a tabbed management console, NOT an admin panel.
The root route ('/') MUST be a continuous-scroll luxury resort experience combining:

1. LUXURY HERO BANNER:
   - High-impact editorial photography, luxury serif typography, brand wordmark, tagline ("Where Pristine Coastline Meets Unrivaled Serenity").
   - Integrated "Check Availability" bar: Arrival Date picker, Departure Date picker, Guest count selector, and "Check Rates" button.
2. VILLA SUITES & ACCOMMODATIONS SHOWCASE:
   - Curated grid/carousel of luxury villas/suites (e.g. Overwater Villa, Oceanfront Pavilion, Cliffside Estate).
   - Each card: high-res photo, guest capacity, bedroom count, private pool/ocean view badge, nightly rate ($/night), and "Reserve Villa" button.
   - "Reserve Villa" click opens an interactive booking drawer or reservation modal with dates and guest options.
3. CULINARY EXCELLENCE & DINING PREVIEW:
   - Curated preview of the resort's fine dining venues (e.g. L'Étoile de Mer, Cliffside Grill) with cuisine style, opening hours, signature dishes, and "Reserve Table" modal.
4. SANCTUARY & EXPERIENCES:
   - Curated showcase of spa rituals, marine excursions, and private beach dining.
5. INTERACTIVE RESERVATION DRAWER / MODAL:
   - Summary of selected villa, check-in/out dates, guest count, price calculation, and "Confirm Reservation" CTA.

CRITICAL HOSPITALITY PORTAL RULES:
- The root route ('/') MUST mount this full resort portal (HomePage.tsx or ResortPortalPage.tsx), NEVER an isolated single-restaurant menu page.
- ZERO admin management buttons (+ Add Villa, Manage Inventory).
- ZERO tab-consoles as the page root. Stacks sections elegantly down the page with smooth scrolling.
- ROOT CONTAINER ATTRIBUTE: The root page container MUST have: data-workspace="hospitality_portal"`;
    } else if (plan?.requiredCapabilities && plan.requiredCapabilities.length > 0 && [
      "operations-dashboard", "realtime-console", "configurator-workspace", "team-workspace", "workspace-editor"
    ].includes(experiencePattern)) {
      const isPrimaryWorkspaceTask = taskTitle.includes("workspace") && (taskTitle.includes("primary") || taskTitle.includes("dashboard") || task.id === 1);
      const taskCaps = isPrimaryWorkspaceTask
        ? plan.requiredCapabilities
        : plan.requiredCapabilities.filter((cap: any) => {
            const capName = (cap.name || "").toLowerCase();
            const capId = (cap.id || "").toLowerCase();
            const words = [...capName.split(/\s+/), ...capId.split(/[-_]+/)].filter((w: string) => w.length > 3);
            return words.some((w: string) => taskTitle.includes(w) || taskDesc.includes(w));
          });
      const capsToInject = taskCaps.length > 0 ? taskCaps : plan.requiredCapabilities.slice(0, 1);

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
    } else if (experiencePattern === "personal-tracker" && (promptLower.includes("plant") || promptLower.includes("botanical") || promptLower.includes("houseplant") || promptLower.includes("foliage"))) {
      capabilityInstructions = `MANDATORY BOTANICAL COMPANION APP COMPOSITION (WARM, PLAYFUL, HAND-ILLUSTRATED):
================================================================================
This is a COZY, WARM, PLAYFUL HOUSEPLANT COMPANION — NOT a corporate SaaS admin dashboard!
STRICTLY FORBIDDEN PATTERNS (violation = immediate rejection):
- STRICTLY FORBID rows of 4 uniform <MetricCard> stat cards with fake percentages (e.g. "100% On Schedule", "100% Balanced", "100% Success", "100% Detailed"). This is an administrative SaaS anti-pattern.
- NO gray rectangle placeholder boxes with camera icons for growth photos! You MUST render real high-resolution botanical photography using Unsplash images!
- NO corporate tables, NO raw data grids, NO "Plant Dashboard Count" or "Verified [Feature]" robotic titles.

COLOR PALETTE & BUTTON TOKENS:
- Dominant CTA Buttons: MUST use Terracotta clay styling: className="btn-primary" or "bg-[#c4734a] hover:bg-[#a85c37] text-white font-medium px-4 py-2.5 rounded-2xl shadow-sm transition"
- Secondary / Nature Accents: Soft Sage Green: text-[#5b7f6e], bg-[#5b7f6e]/15, border-[#5b7f6e]/25
- Subtle Highlights / Badges: Dusty Rose: bg-[#d4a373]/20 text-[#8c5836] or bg-[#c97a7e]/15 text-[#9e4347]
- Surfaces: Warm Ivory (bg-[#f9f6f1]) with soft white cards (bg-white) and rounded-3xl / rounded-2xl corners

DISTINCT SPECIALIZED PAGE LAYOUTS (EACH PAGE MUST HAVE ITS OWN UNIQUE COMPOSITION):

1. PLANTS / SANCTUARY SHELF (Root / Home Page):
   - Cozy Plant Shelf view: Interactive plant cards showing botanical photo, plant nickname ("Monty the Monstera"), species ("Monstera Deliciosa"), current soil moisture gauge (e.g. 75% moisture bar), sunlight pill ("Bright Indirect"), days since watered, and a prominent Terracotta "Water Today" button.
   - Quick filter pills: "All Plants", "Thirsty Today", "Ficus", "Tropicals", "Low Light".
   - Warm streak banner: "🌿 12-day mindful care streak · All green companions thriving".

2. WATERING TRACKER & HYDRATION SCHEDULE:
   - Interactive watering calendar & room-grouped checklist (Living Room, Balcony, Bedroom).
   - Sliders or moisture meter dials for soil saturation.
   - One-click "Give Drink" / "Water & Record" action that increments hydration streak and updates next due date.
   - Next watering schedule countdown ("Due in 2 days", "Thirsty today!").

3. SUNLIGHT NEEDS & EXPOSURE ZONES:
   - Interactive room window exposure map: "East Window (Bright Morning Glow)", "South Balcony (Direct Sun)", "North Hallway (Low Light Sanctuary)".
   - Plant assignment cards under each light zone with lux recommendations and advice on leaf scorch prevention.
   - Interactive slider to test light hours per season.

4. GROWTH PHOTO JOURNAL & MILESTONES:
   - MUST RENDER REAL BOTANICAL PHOTOS (NO empty camera icons!):
     Monstera: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80"
     Fiddle Leaf Fig: "https://images.unsplash.com/photo-1597055181300-e3633a917c9c?auto=format&fit=crop&w=800&q=80"
     Pothos: "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80"
     Snake Plant: "https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=800&q=80"
     Calathea: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80"
     ZZ Plant: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80"
   - Milestone badges: "🌿 New Fenestration Unfurled", "🌱 Spring Foliage Flush", "🪴 Repotted into Terracotta".
   - Clickable photo card opening full-size inspect modal with date, plant nickname, and care notes.

5. BOTANICAL NOTES & CARE RECIPES:
   - Cozy notebook cards with hand-crafted feel: Soil mix recipes ("60% Potting Soil + 20% Perlite + 20% Orchid Bark"), humidity tips, fertilizer schedules, and seasonal winter dormancy notes.
   - Interactive "Add Care Note" drawer.

ROOT CONTAINER ATTRIBUTE: data-workspace="personal_tracker"`;
    } else if (experiencePattern === "personal-tracker") {
      capabilityInstructions = `MANDATORY PERSONAL TRACKER PAGE COMPOSITION:
=============================================
This is a PERSONAL TRACKER product — NOT a database admin panel, NOT a CRM, NOT an ops dashboard.
The page MUST feel warm, personal, and human — like a physical journal or planner come to life.

STRICTLY FORBIDDEN PATTERNS (violation = immediate rejection):
- NEVER render a row of 4 KPI cards or MetricCards with fake percentages
- NEVER render a data table with columns (Name, Status, Date, Actions)
- NEVER render "Active Service View" as a badge or heading
- NEVER render "Manage and interact with [feature] services and features."
- NEVER render "Submit your inquiry or update configuration"
- NEVER render "Search resources..." as placeholder text
- NEVER render "Service Status: Online", "Sync Mode: Automatic", "Availability: Online"
- NEVER render a 2-col grid (form left + service status card right) — that is a dead generic template
- NEVER use hardcoded Tailwind color classes: stone-50, stone-100, stone-200, stone-900, indigo-600, indigo-700
  USE ONLY CSS variable tokens: className="bg-[var(--color-background)]" or style={{background:'var(--color-surface)'}}

MANDATORY COMPOSITION for every personal-tracker feature page:

1. PAGE HEADER (personal and warm — NOT a breadcrumb):
   - Date-aware greeting: const today = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})
   - Render: <p className="text-sm" style={{color:'var(--color-text-muted)'}}>Today · {today}</p>
   - Feature headline as a NATURAL PHRASE (e.g. "How are you feeling today?" NOT "Select Mood And Texture")
   - Motivational streak badge inline: "🔥 7-day streak" or "📖 32 entries this month"

2. PRIMARY INTERACTIVE ZONE (the REAL feature tool):
   - For MOOD/EMOTION pages: emoji-grid mood picker (😴 Tired, 😊 Good, 🌟 Amazing etc.) with labels
     const [selectedMood, setSelectedMood] = useState<string>("")
   - For JOURNAL/WRITING pages: styled textarea with character count, category tag selector, Save button
     const [entryText, setEntryText] = useState<string>("")
   - For HABIT/STREAK pages: visual habit cards with checkoff buttons + streak fire emojis
     const [habits, setHabits] = useState([{id:1,name:"Morning Pages",done:false,streak:12},...])
   - For STICKER/DECORATION pages: sticker category panel (🌸 Nature, ✨ Sparkle, 🎨 Art) with preview
     const [selectedStickers, setSelectedStickers] = useState<string[]>([])
   - For TAG/FILTER pages: pill-tag selector that filters entries below in real time
     const [activeTag, setActiveTag] = useState<string>("all")
   - ALL interactions MUST work — state changes MUST update the UI visibly

3. ENTRY TIMELINE / HISTORY FEED:
   - Vertical feed of 3–5 seeded past entries styled as personal journal cards:
     - Date header ("Yesterday", "Monday, Sep 23")
     - Mood emoji or habit summary + written excerpt
     - Sticker decorations or tag pills
     - Expandable "Read more" toggle (useState)
   - Filter tabs: "All", "This Week", "This Month"
   - const [entries, setEntries] = useState([{id:1,date:"Yesterday",mood:"😊",text:"...",tags:["grateful"]},...]

4. MINI STATS / PROGRESS (sidebar or bottom strip):
   - Current streak, monthly entry count, top mood/tag
   - Inline SVG bar chart or emoji frequency display (no external chart library)

ROOT CONTAINER ATTRIBUTE: data-workspace="personal_tracker"`;
    } else if (experiencePattern === "catalog-browser" || experiencePattern === "content-feed") {
      capabilityInstructions = `MANDATORY CATALOG / DISCOVERY PAGE COMPOSITION:
================================================
This is a CATALOG or DISCOVERY product — consumer-grade browsing experience.
MUST feel like a magazine or curated marketplace — NOT an admin table.

STRICTLY FORBIDDEN: "Active Service View", data tables, stone-*/indigo-* hardcoded classes.
USE ONLY: var(--color-primary), var(--color-surface), var(--color-text-primary) CSS tokens.

1. SEARCH & FILTER BAR: Full-width search input + horizontal filter pill row (category tags)
   const [searchQuery, setSearchQuery] = useState<string>("")
   const [activeFilter, setActiveFilter] = useState<string>("all")

2. FEATURED ROW: 1–2 featured items in wide editorial cards (full-color accent background, white text)

3. CATALOG GRID: Responsive CSS grid (auto-fill, minmax 260px, 1fr) of 8–12 item cards:
   - Each card: colored thumbnail div with icon, title, description snippet, tag badge, CTA button
   - Hover: transform: translateY(-4px), border-color: var(--color-primary)
   const [items, setItems] = useState([{id:1,title:"...",category:"...",description:"...",featured:false},...]

4. FILTER LOGIC:
   const filtered = items.filter(i => activeFilter === "all" || i.category === activeFilter)
                         .filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()))

5. LOAD MORE button styled with var(--color-primary)
ROOT CONTAINER: data-workspace="catalog_browser"`;
    } else if (experiencePattern === "showcase-landing") {
      capabilityInstructions = `MANDATORY SHOWCASE / PORTFOLIO PAGE COMPOSITION:
=================================================
MUST be editorial, visual-first, brand-quality. NOT an admin panel.
STRICTLY FORBIDDEN: Tabs, data tables, "Active Service View", stone-*/indigo-* hardcoded classes.

1. FULL-WIDTH HERO: Large typographic statement (h1 clamp 3rem 8vw), brand tagline, primary CTA
2. WORK GRID: Masonry or 2-col grid of project cards — large visual area (colored gradient div), title, category, CTA
3. ABOUT SECTION: Two-column (large pull-quote left, bio right)
4. CONTACT CTA: Email input + send button
ROOT CONTAINER: data-workspace="showcase_landing"`;
    } else if (experiencePattern === "booking-flow") {
      capabilityInstructions = `MANDATORY BOOKING / SCHEDULING PAGE COMPOSITION:
=================================================
MUST be step-oriented, clear, transactional. NOT an admin table.
STRICTLY FORBIDDEN: "Active Service View", hardcoded stone-*/indigo-* classes.

1. SERVICE SELECTION: Grid of bookable items with name, duration, price, "Select" button
   const [selectedService, setSelectedService] = useState<any>(null)
2. DATE & TIME PICKER: Calendar grid built with inline React date logic + time slot grid
   const [selectedDate, setSelectedDate] = useState(new Date())
   const [selectedSlot, setSelectedSlot] = useState<string>("")
3. BOOKING SUMMARY: Sticky panel — selected service, date, time, price, "Confirm" CTA
4. SUCCESS STATE: On submit, styled confirmation card with booking reference
   const [confirmed, setConfirmed] = useState(false)
ROOT CONTAINER: data-workspace="booking_flow"`;
    } else {
      capabilityInstructions = `MANDATORY VIEW COMPOSITION — CRITICAL DESIGN RULES:
=====================================================
STRICTLY FORBIDDEN IN ALL GENERATED VIEWS (violation = immediate rejection):
- NEVER render "Active Service View" as any badge, label, or heading text
- NEVER render "Manage and interact with [feature] services and features." as description text
- NEVER render "Submit your inquiry or update configuration for [feature]."
- NEVER render "Search resources..." as an input placeholder
- NEVER render "Service Status: Online", "Sync Mode: Automatic", or "Availability: Online" info panels
- NEVER use a 2-column layout with a generic form (left) + a "Service Status" card (right)
- NEVER use hardcoded Tailwind color classes: stone-50, stone-100, stone-200, stone-900, indigo-600, indigo-700
  USE ONLY CSS variable tokens: style={{background:'var(--color-surface)'}} or className="text-[var(--color-text-primary)]"

For catalog, inventory, and record management views:
  1. Navigation header with brand identity using site-content.ts brand name.
  2. Direct entry into domain items, catalog grid, or record list — DO NOT render a top row of stat cards or KPI metrics unless this specific view is a designated summary/overview page.
  3. Interactive Data Table / List with 4-8 realistic domain seed records. NEVER empty.
  4. Live search input & multi-tab status filters.
  5. Interactive "+ New [Entity]" creation modal.
  6. Interactive Selection & Detail Inspector:
     - const [selectedItem, setSelectedItem] = useState<any>(null);
     - Every row/card: onClick={() => setSelectedItem(item)}
     - Detail panel: {selectedItem && <div>...</div>} with close button.
  7. Interactive Status Filtering:
     - const [statusFilter, setStatusFilter] = useState('all');
     - const filteredItems = records.filter(r => statusFilter === 'all' || r.status === statusFilter);
  8. data-workspace attribute on root container.`;
    }

    const CANONICAL_CODER_CONTEXT_HEADER = `
${STAGE_SPECIFIC_CODER_INSTRUCTION}
${contentContractContext}

══════════════════════════════════════════════════════════════════════════════
CANONICAL PROJECT ARCHITECTURE CONSTRAINTS (MANDATORY & AUTHORITATIVE)
══════════════════════════════════════════════════════════════════════════════
AUTHORITATIVE CONTENT CONTRACT:
Import and render content from src/content/site-content.ts as-is. This copy is FINAL — do not rewrite, paraphrase, or regenerate it.

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
- src/content/site-content.ts: IMMUTABLE AUTHORITATIVE COPY. NEVER generate, rewrite, or output src/content/site-content.ts. It is already generated by ContentStrategistAgent. ONLY import from it.

${productExperiencePlanContext}

CANONICAL UI & FEATURE RICHNESS (MANDATORY FOR ALL FRONTEND VIEWS):
- MUST implement all required domain features and models with reachable, interactive UI (dedicated pages or rich embedded components/drawers/modals).
- Every primary view/page MUST render a semantic <h1> containing the domain feature title (e.g. <h1>Glaze Chemistry Formulation</h1>) followed by a descriptive <p> explaining its purpose.
- NEVER output generic placeholder text (e.g. "Welcome to the application platform", "Dashboard placeholder", or unmounted views).
- For configurator workspaces, engineering studios, calculators, and design tools:
  * Mount the primary tools directly into the workspace so the user can interact immediately on initial load.
  * Implement active parameters with sliders, dropdowns, inputs, and real-time derived calculations/visualizations.
  * Provide data-workspace="configurator_workspace" or "engineering_studio" on the root container.
${capabilityInstructions}
${designBriefContext}
${pageMetricGuidance}

FORBIDDEN TECHNOLOGIES:
- Next.js, NextAuth, App Router, Server Actions, Next.js API Routes
- MongoDB, Mongoose, Drizzle
- Generic placeholder fallback pages or empty stub components
- Inventing arbitrary shared/components modules or duplicate API clients
══════════════════════════════════════════════════════════════════════════════
`.trim();

    // ── Token Budget Management & 3-Tier Degradation ──────────────────────────
    const profile = TokenBudgetManager.getProfile(this.provider.name);

    // Estimate base tokens required for core instructions (excluding file contents)
    const basePromptText = `${request}\n${CANONICAL_CODER_CONTEXT_HEADER}\n${archContext}\n${patternContext}\n${canonicalContractContext}\n${designBriefContext}\n${productExperiencePlanContext}`;
    const baseTokensEstimated = TokenBudgetManager.estimateTokens(basePromptText, true);

    // Compute remaining token headroom for candidate files
    const availableFileTokens = Math.min(
      profile.maxFileTokens,
      Math.max(400, profile.maxPromptTokens - baseTokensEstimated)
    );

    // Partition files into Tier 1 (full), Tier 2 (signatures), Tier 3 (withheld) without mid-file truncation
    const degradedFiles = TokenBudgetManager.degradeFilesToBudget(candidateFiles, availableFileTokens);
    const relevantFilesContent = TokenBudgetManager.formatFileContext(degradedFiles);

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
    } else {
      finalPrompt += `\n
══════════════════════════════════════════════════════════════════════════════
CRITICAL TASK SCOPE & BOUNDARY RULES:
1. You are implementing EXCLUSIVELY Task ${task.id}: "${task.title}".
2. ONLY generate or edit the files required for this specific task (${task.title}).
3. NEVER regenerate untouched existing files from previous tasks (e.g. Navbar.tsx, App.tsx, routes.tsx) unless adding an import/route for this task.
4. NEVER preemptively generate full files for future tasks.
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
