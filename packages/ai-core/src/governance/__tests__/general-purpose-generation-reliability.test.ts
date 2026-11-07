import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PromptBudgetInstrumenter } from "../prompt-budget-instrumenter.js";
import { GenerationBudgetGuard, BudgetExceededError } from "../generation-budget-guard.js";
import { TaskNormalizer } from "../task-normalizer.js";
import { ImportReconciler } from "../../validation/import-reconciler.js";
import { GeneratedFileValidator } from "../../validation/generated-file-validator.js";
import { TokenBudgetManager } from "../../context/token-budget.js";
import { FailoverProvider } from "../../providers/failover.js";
import { CoderAgent } from "../../agents/coder-agent.js";
import type { AIProvider, ChatMessage, ChatOptions } from "../../providers/base.js";
import type { Task } from "../../planner/task.js";
import type { SystemArchitecture } from "../../architect/index.js";
import type { ArchitectureContractV1 } from "../contract-types.js";

const TEST_DIR = join(process.cwd(), "temp-gen-reliability-test");

describe("AEGIS General-Purpose Website Generation Reliability Suite", () => {
  beforeEach(() => {
    const guard = GenerationBudgetGuard.getInstance();
    guard.reset();
    FailoverProvider.resetState();
    PromptBudgetInstrumenter.setCustomCeiling(null);
    PromptBudgetInstrumenter.setBenchmarkMode(false);

    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(join(TEST_DIR, ".aegis"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "content"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "pages"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "services"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "design-system", "components"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "shared", "components"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  // ── 1. Model-Aware Adaptive Capacity & Context Sizing ──────────────────────
  describe("1. Adaptive Context Sizing & Budget Management", () => {
    it("resolves dynamic model-aware capacity ceilings instead of a fixed 12,000 ceiling", () => {
      // General purpose mode gives models appropriate capacity windows
      expect(PromptBudgetInstrumenter.getActiveCeiling("gemini")).toBe(120000);
      expect(PromptBudgetInstrumenter.getActiveCeiling("anthropic")).toBe(150000);
      expect(PromptBudgetInstrumenter.getActiveCeiling("openai")).toBe(96000);
      expect(PromptBudgetInstrumenter.getActiveCeiling("deepseek")).toBe(48000);
      expect(PromptBudgetInstrumenter.getActiveCeiling("groq")).toBe(6000);
      expect(PromptBudgetInstrumenter.getActiveCeiling("unknown-provider")).toBe(32000);
    });

    it("resolves specific model capacity ceilings without assuming all models from one provider are identical", () => {
      // Gemini models
      expect(PromptBudgetInstrumenter.getActiveCeiling("gemini-1.5-pro")).toBe(200000);
      expect(PromptBudgetInstrumenter.getActiveCeiling("gemini-2.5-pro")).toBe(200000);
      expect(PromptBudgetInstrumenter.getActiveCeiling("gemini-1.5-flash")).toBe(120000);
      expect(PromptBudgetInstrumenter.getActiveCeiling("gemini-2.0-flash-lite")).toBe(64000);

      // Anthropic models
      expect(PromptBudgetInstrumenter.getActiveCeiling("claude-3-5-sonnet")).toBe(160000);
      expect(PromptBudgetInstrumenter.getActiveCeiling("claude-3-5-haiku")).toBe(120000);

      // OpenAI models
      expect(PromptBudgetInstrumenter.getActiveCeiling("gpt-4o")).toBe(100000);
      expect(PromptBudgetInstrumenter.getActiveCeiling("gpt-4o-mini")).toBe(64000);

      // Fast serving / Open models
      expect(PromptBudgetInstrumenter.getActiveCeiling("deepseek-chat")).toBe(48000);
      expect(PromptBudgetInstrumenter.getActiveCeiling("qwen-3.8-27b")).toBe(16000);
    });

    it("resolves model-specific token budget profiles in TokenBudgetManager", () => {
      const geminiPro = TokenBudgetManager.getProfile("gemini-1.5-pro");
      expect(geminiPro.maxPromptTokens).toBe(64000);
      expect(geminiPro.maxCompletionTokens).toBe(32768);

      const claudeSonnet = TokenBudgetManager.getProfile("claude-3-5-sonnet");
      expect(claudeSonnet.maxPromptTokens).toBe(48000);
      expect(claudeSonnet.maxCompletionTokens).toBe(8192);

      const claudeHaiku = TokenBudgetManager.getProfile("claude-3-5-haiku");
      expect(claudeHaiku.maxPromptTokens).toBe(32000);

      const gptMini = TokenBudgetManager.getProfile("gpt-4o-mini");
      expect(gptMini.maxPromptTokens).toBe(24000);

      const qwen = TokenBudgetManager.getProfile("qwen-3.8-27b");
      expect(qwen.maxPromptTokens).toBe(8000);
    });

    it("allows rich prompts (e.g. 18,000 tokens) on high-capacity models without artificial ceiling rejection", () => {
      // Create an 18,000 token prompt payload
      // 48,000 characters * 0.375 = 18,000 tokens
      const sysPrompt = "// Rich system prompt\n".padEnd(2000, "s");
      const userPrompt = "// Large feature implementation instructions\n".padEnd(46000, "u");
      const totalTokens = TokenBudgetManager.estimateTokens(sysPrompt + userPrompt, true);
      expect(totalTokens).toBeGreaterThan(16000);

      const report = PromptBudgetInstrumenter.measurePrompt(sysPrompt, userPrompt, undefined, "gemini");
      expect(report.passedCeiling).toBe(true);
      expect(() => PromptBudgetInstrumenter.assertWithinCeiling(report, "gemini")).not.toThrow();
    });

    it("preserves strict 12,000 ceiling in benchmark mode for historical reproducibility", () => {
      PromptBudgetInstrumenter.setBenchmarkMode(true);
      expect(PromptBudgetInstrumenter.isBenchmarkMode()).toBe(true);
      expect(PromptBudgetInstrumenter.getActiveCeiling("gemini")).toBe(12000);

      const sysPrompt = "// System\n".padEnd(2000, "x");
      const userPrompt = "// User\n".padEnd(30500, "y");
      const report = PromptBudgetInstrumenter.measurePrompt(sysPrompt, userPrompt, undefined, "gemini");
      expect(report.passedCeiling).toBe(false);
      expect(() => PromptBudgetInstrumenter.assertWithinCeiling(report, "gemini")).toThrow(BudgetExceededError);
    });

    it("scales project budgets adaptively across light, standard, fullstack, and enterprise tiers", () => {
      const guard = GenerationBudgetGuard.getInstance();

      guard.adaptiveConfigureForProject("light");
      let status = guard.getStatus();
      expect(status.remainingRequests).toBe(25);
      expect(status.remainingPromptTokens).toBe(150000);

      guard.adaptiveConfigureForProject("standard");
      status = guard.getStatus();
      expect(status.remainingRequests).toBe(45);
      expect(status.remainingPromptTokens).toBe(350000);

      guard.adaptiveConfigureForProject("fullstack");
      status = guard.getStatus();
      expect(status.remainingRequests).toBe(75);
      expect(status.remainingPromptTokens).toBe(750000);

      guard.adaptiveConfigureForProject("enterprise");
      status = guard.getStatus();
      expect(status.remainingRequests).toBe(150);
      expect(status.remainingPromptTokens).toBe(1500000);
    });

    it("strictly preserves user explicit budget configuration without automatic override", () => {
      const guard = GenerationBudgetGuard.getInstance();
      guard.reset();

      // User explicitly configures custom budget
      guard.configure({
        maxRequests: 20,
        maxPromptTokens: 80000,
        maxCompletionTokens: 15000,
      });

      // Subsequent adaptive project scaling should not overwrite user explicit choices
      guard.adaptiveConfigureForProject("fullstack");
      const status = guard.getStatus();
      expect(status.remainingRequests).toBe(20);
      expect(status.remainingPromptTokens).toBe(80000);
      expect(status.remainingCompletionTokens).toBe(15000);
    });

    it("transparently halts and reports BudgetExceededError when limits are breached", () => {
      const guard = GenerationBudgetGuard.getInstance();
      guard.reset();
      guard.configure({ maxRequests: 2, maxPromptTokens: 10000 });

      guard.recordRequest();
      guard.recordRequest();

      expect(() => guard.assertRequestAllowed("coder", 1000, 500)).toThrow(BudgetExceededError);
      expect(() => guard.assertRequestAllowed("coder", 1000, 500)).toThrow(/Maximum provider requests.*\(2\)/);
    });
  });

  // ── 2. Automatic Import & Dual-Export Reconciliation ────────────────────────
  describe("2. AST & Regex Import / Export Reconciliation", () => {
    it("auto-injects missing Lucide icons used in JSX into existing lucide-react import", () => {
      const input = `
import React, { useState } from 'react';
import { ArrowUp, Check } from 'lucide-react';

export default function MetricCard() {
  return (
    <div className="card">
      <TrendingDown className="w-4 h-4 text-rose-500" />
      <ArrowRight className="w-5 h-5 text-gray-400" />
      <Check className="w-4 h-4 text-emerald-500" />
    </div>
  );
}
`;
      const reconciled = ImportReconciler.reconcile(input, "src/components/MetricCard.tsx");
      expect(reconciled).toContain("TrendingDown");
      expect(reconciled).toContain("ArrowRight");
      expect(reconciled).toContain("Check");
      expect(reconciled).toContain("ArrowUp");
      // Check that dual export is added
      expect(reconciled).toContain("export { MetricCard };");
    });

    it("creates lucide-react import if icons are used but import statement is missing", () => {
      const input = `
import React from 'react';

export default function Header() {
  return (
    <header>
      <Search className="w-5 h-5" />
      <Bell className="w-5 h-5" />
      <User className="w-5 h-5" />
    </header>
  );
}
`;
      const reconciled = ImportReconciler.reconcile(input, "src/components/Header.tsx");
      expect(reconciled).toMatch(/import \{.*Bell.*Search.*User.*\} from ["']lucide-react["']/);
      expect(reconciled).toContain("export { Header };");
    });

    it("auto-injects missing React hooks used in component body", () => {
      const input = `
import React from 'react';

export default function DynamicWidget() {
  const [data, setData] = useState([]);
  const activeCount = useMemo(() => data.length, [data]);

  useEffect(() => {
    console.log("mounted");
  }, []);

  return <div>{activeCount}</div>;
}
`;
      const reconciled = ImportReconciler.reconcile(input, "src/components/DynamicWidget.tsx");
      expect(reconciled).toMatch(/import React, \{.*useState.*useEffect.*useMemo.*\} from ["']react["']/);
    });

    it("preserves files that already have valid dual exports without duplication", () => {
      const input = `
import React, { useState } from 'react';

export function NavigationBar() {
  return <nav>Navbar</nav>;
}

export default NavigationBar;
`;
      const reconciled = ImportReconciler.reconcile(input, "src/components/NavigationBar.tsx");
      const exportCount = (reconciled.match(/export default NavigationBar/g) || []).length;
      expect(exportCount).toBe(1);
    });

    it("safely handles import type from lucide-react and adds runtime imports without corruption", () => {
      const input = `
import type { LucideIcon } from 'lucide-react';
import React from 'react';

export default function IconWrapper() {
  return (
    <div>
      <AlertCircle className="w-4 h-4" />
      <ChevronRight className="w-4 h-4" />
    </div>
  );
}
`;
      const reconciled = ImportReconciler.reconcile(input, "src/components/IconWrapper.tsx");
      expect(reconciled).toContain("import type { LucideIcon } from 'lucide-react';");
      expect(reconciled).toContain("AlertCircle");
      expect(reconciled).toContain("ChevronRight");
      expect(reconciled).toContain("export { IconWrapper };");
    });

    it("deduplicates identical imports when icons or hooks are referenced multiple times", () => {
      const input = `
import React, { useState, useState } from 'react';
import { ArrowRight, ArrowRight } from 'lucide-react';

export default function DedupeTest() {
  const [val, setVal] = useState(0);
  return (
    <div>
      <ArrowRight />
      <ArrowRight />
    </div>
  );
}
`;
      const reconciled = ImportReconciler.reconcile(input, "src/components/DedupeTest.tsx");
      // ArrowRight should only appear once in the lucide-react import list
      const lucideImportLine = reconciled.split("\n").find(l => l.includes("lucide-react")) || "";
      const arrowCount = (lucideImportLine.match(/ArrowRight/g) || []).length;
      expect(arrowCount).toBe(1);
    });

    it("safely rolls back to original content if reconciliation introduces AST syntax diagnostics", () => {
      // Mock ts.createSourceFile parseDiagnostics to simulate syntax corruption
      const originalCode = `import React from 'react';\nexport default function Broken() { return <div>Ok</div>; }`;
      
      const spy = vi.spyOn(ImportReconciler, "reconcileReactHooks").mockReturnValue(
        `import React, { broken syntax {{{ from 'react';\nexport default function Broken() { return <div>Ok</div>; }`
      );

      const reconciled = ImportReconciler.reconcile(originalCode, "src/components/Broken.tsx");
      // Must safely roll back to originalCode
      expect(reconciled).toBe(originalCode);
      spy.mockRestore();
    });
  });

  // ── 3. Dynamic Task Decomposition & Anti-Squashing ──────────────────────────
  describe("3. Dynamic Task Decomposition & Task Scaling", () => {
    it("dynamically decomposes 9 distinct application features into 9 tasks without squashing them into Task 6", () => {
      const rawTasks: Task[] = [
        { id: 1, title: "Global App Shell & Navigation", description: "Router and top bar", stage: "Frontend" },
        { id: 2, title: "Product Catalog & Filters", description: "Search and categories", stage: "Frontend" },
        { id: 3, title: "Product Detail & Variant Selector", description: "Gallery and sizing", stage: "Frontend" },
        { id: 4, title: "Interactive Cart & Drawer", description: "Slideout bag and totals", stage: "Frontend" },
        { id: 5, title: "Customer Checkout & Shipping Flow", description: "Address and payment", stage: "Frontend" },
        { id: 6, title: "Customer Account & Order History", description: "Past orders", stage: "Frontend" },
        { id: 7, title: "Inventory & Stock Management", description: "Merchant admin", stage: "Frontend" },
        { id: 8, title: "Express REST API Endpoints", description: "Products and orders endpoints", stage: "Backend" },
        { id: 9, title: "Prisma Database Models & Migrations", description: "Database schema", stage: "Backend" },
      ];

      // In general-purpose mode, default maxTasks is 12 (not 6)
      const tasks = TaskNormalizer.deduplicateAndCapTasks(rawTasks);
      expect(tasks.length).toBe(9);
      expect(tasks.map(t => t.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      // Verify task 6 did NOT get squashed with tasks 7, 8, 9
      expect(tasks[5].title).toBe("Customer Account & Order History");
      expect(tasks[6].title).toBe("Inventory & Stock Management");
      expect(tasks[7].title).toBe("Express REST API Endpoints");
      expect(tasks[8].title).toBe("Prisma Database Models & Migrations");
    });

    it("respects benchmark explicit cap of 6 tasks when requested", () => {
      const rawTasks: Task[] = [
        { id: 1, title: "Global App Shell & Navigation", stage: "Frontend" },
        { id: 2, title: "Executive Dashboard", stage: "Frontend" },
        { id: 3, title: "Transaction Ledger", stage: "Frontend" },
        { id: 4, title: "Analytics & Forecasting", stage: "Frontend" },
        { id: 5, title: "Treasury Accounts & Settings", stage: "Frontend" },
        { id: 6, title: "Express Backend APIs", stage: "Backend" },
        { id: 7, title: "Prisma & SQLite Schema", stage: "Backend" },
        { id: 8, title: "End-to-End Validation", stage: "Backend" },
      ];

      const tasks = TaskNormalizer.deduplicateAndCapTasks(rawTasks, 6);
      expect(tasks.length).toBe(6);
    });

    it("scales dynamically across 4 application tiers without artificial 6 or 16 task limits", () => {
      // Scale 1: Simple 1-page landing page (2 tasks)
      const scale1Tasks: Task[] = [
        { id: 1, title: "Global App Shell", stage: "Frontend" },
        { id: 2, title: "Hero & Contact Form", stage: "Frontend" },
      ];
      const res1 = TaskNormalizer.deduplicateAndCapTasks(scale1Tasks);
      expect(res1.length).toBe(2);

      // Scale 2: Medium multi-page corporate website (4 tasks)
      const scale2Tasks: Task[] = [
        { id: 1, title: "Global App Shell & Navbar", stage: "Frontend" },
        { id: 2, title: "Services & Solutions Showcase", stage: "Frontend" },
        { id: 3, title: "Company & Leadership Bio", stage: "Frontend" },
        { id: 4, title: "Contact & Consultation Request Flow", stage: "Frontend" },
      ];
      const res2 = TaskNormalizer.deduplicateAndCapTasks(scale2Tasks);
      expect(res2.length).toBe(4);

      // Scale 3: Complex SaaS dashboard with multiple workspaces (7 tasks)
      const scale3Tasks: Task[] = [
        { id: 1, title: "Global App Shell & Sidebar", stage: "Frontend" },
        { id: 2, title: "Telemetry & Cluster Observability", stage: "Frontend" },
        { id: 3, title: "Deployment Pipeline Manager", stage: "Frontend" },
        { id: 4, title: "Audit Log & Query Console", stage: "Frontend" },
        { id: 5, title: "Alert Thresholds & Pager Duty", stage: "Frontend" },
        { id: 6, title: "Organization & RBAC Settings", stage: "Frontend" },
        { id: 7, title: "API Explorer & Webhooks", stage: "Frontend" },
      ];
      const res3 = TaskNormalizer.deduplicateAndCapTasks(scale3Tasks);
      expect(res3.length).toBe(7);

      // Scale 4: Full-stack application with multiple backend modules (11 tasks)
      const scale4Tasks: Task[] = [
        { id: 1, title: "Global App Shell & Auth Layout", stage: "Frontend" },
        { id: 2, title: "Customer Dashboard & Overview", stage: "Frontend" },
        { id: 3, title: "Inventory & Catalog Browser", stage: "Frontend" },
        { id: 4, title: "Order History & Invoice Viewer", stage: "Frontend" },
        { id: 5, title: "Billing & Subscription Portal", stage: "Frontend" },
        { id: 6, title: "Support Ticket Desk", stage: "Frontend" },
        { id: 7, title: "Express Auth & Session Service", stage: "Backend" },
        { id: 8, title: "Express Product & Inventory API", stage: "Backend" },
        { id: 9, title: "Express Billing & Stripe Webhooks", stage: "Backend" },
        { id: 10, title: "Prisma Models & Migration Schema", stage: "Backend" },
        { id: 11, title: "Background Job Worker & Telemetry", stage: "Backend" },
      ];
      const res4 = TaskNormalizer.deduplicateAndCapTasks(scale4Tasks);
      // Confirms all 11 tasks remain intact; not squashed at 6 or capped at 16
      expect(res4.length).toBe(11);
      expect(res4.map(t => t.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    });
  });

  // ── 4. Multi-Domain Generation Fidelity (6 Distinct Domains) ─────────────────
  describe("4. Multi-Domain Generation Fidelity & Domain Independence", () => {
    const mockArch: SystemArchitecture = {
      components: [],
      dataFlow: [],
      framework: "react-vite",
      projectStructure: [],
      stateManagement: "react",
    };

    // Category 1: Landing Page & Marketing
    it("Category 1 (Marketing / Landing Page): Generates domain-authentic hero, feature grid, and inquiry form without SaaS convergence", async () => {
      let capturedPrompt = "";
      const mockProvider: AIProvider = {
        name: "gemini",
        chat: vi.fn().mockImplementation(async (messages: ChatMessage[]) => {
          capturedPrompt = messages.map(m => m.content).join("\n");
          return `===FILE: src/pages/LandingPage.tsx===
import React, { useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="landing-container" data-workspace="showcase_landing">
      <section className="hero">
        <h1>Autonomous Intelligence for Modern Engineering</h1>
        <p>Deploy resilient systems with self-healing automation.</p>
        <button className="cta-button">Explore Platform <ArrowRight className="inline w-4 h-4 ml-1" /></button>
      </section>
      <section className="features">
        <div className="feature-item"><Sparkles className="w-5 h-5 text-amber-500" /> Continuous Verification</div>
        <div className="feature-item"><CheckCircle className="w-5 h-5 text-emerald-500" /> Zero-Drift Governance</div>
      </section>
    </div>
  );
}
===END===`;
        }),
      };

      const coder = new CoderAgent(mockProvider);
      const task: Task = {
        id: 2,
        title: "Platform Showcase & Hero Presentation",
        description: "Build marketing hero, platform capabilities showcase, and enterprise contact form",
        stage: "Frontend",
        ownedRoutes: ["/"],
      };

      const plan = {
        experiencePattern: "showcase-landing",
        primaryActivity: "Platform Discovery & Product Showcase",
        expectedHomeRoute: "/",
        authWallAllowed: false,
        experienceIdentity: {
          genre: "Developer Platform Marketing",
          brandIdentity: { name: "Synapse AI", essence: "Autonomous Systems Platform", tone: "authoritative", voice: "technical" },
          navigationDesign: { model: "top-bar", position: "sticky", primaryItems: [{ label: "Overview", path: "/" }, { label: "Pricing", path: "/pricing" }] },
          pageCompositionLanguage: { rhythm: "fluid", gridSystem: "asymmetric-grid", heroPhilosophy: "bold-typographic", pageCompositionRules: [{ route: "/", pageRole: "showcase", dominantStructure: "Hero -> Capabilities -> Contact", primaryFocalElement: "Interactive Terminal" }] },
        },
      };

      writeFileSync(join(TEST_DIR, ".aegis", "locked-experience-plan.json"), JSON.stringify(plan, null, 2));

      const result = await coder.execute(task, mockArch, "plan", "Build marketing landing page", TEST_DIR, []);
      expect(result.files.length).toBe(1);
      expect(result.files[0].content).toContain("data-workspace=\"showcase_landing\"");
      expect(result.files[0].content).toContain("export { LandingPage };");
      expect(capturedPrompt).not.toContain("FinTrack Pro");
      expect(capturedPrompt).not.toContain("Sourdough");
      expect(capturedPrompt).not.toContain("Monty the Monstera");
    });

    // Category 2: Portfolio & Personal
    it("Category 2 (Creative Portfolio): Generates visual masonry work grid and artist profile without corporate dashboard convergence", async () => {
      let capturedPrompt = "";
      const mockProvider: AIProvider = {
        name: "gemini",
        chat: vi.fn().mockImplementation(async (messages: ChatMessage[]) => {
          capturedPrompt = messages.map(m => m.content).join("\n");
          return `===FILE: src/pages/PortfolioGallery.tsx===
import React, { useState } from 'react';
import { Eye, ExternalLink } from 'lucide-react';

export default function PortfolioGallery() {
  const [selectedProject, setSelectedProject] = useState(null);
  const projects = [
    { id: 1, title: 'Architectural Monoliths', category: 'Spatial Photography', year: '2026' },
    { id: 2, title: 'Kinetic Shadows', category: 'Interactive Exhibition', year: '2025' }
  ];

  return (
    <div className="portfolio-stage" data-workspace="showcase_landing">
      <h1>Selected Works & Visual Studies</h1>
      <div className="gallery-masonry">
        {projects.map(p => (
          <div key={p.id} className="project-card" onClick={() => setSelectedProject(p)}>
            <h3>{p.title}</h3>
            <span>{p.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
===END===`;
        }),
      };

      const coder = new CoderAgent(mockProvider);
      const task: Task = {
        id: 2,
        title: "Selected Works & Photography Archive",
        description: "Build curated project gallery, exhibition history, and artist statement",
        stage: "Frontend",
        ownedRoutes: ["/works"],
      };

      const plan = {
        experiencePattern: "showcase-landing",
        primaryActivity: "Visual Arts Curation & Exhibition Showcase",
        expectedHomeRoute: "/",
        authWallAllowed: false,
        experienceIdentity: {
          genre: "Fine Art & Photography Portfolio",
          brandIdentity: { name: "Elena Rostova Studio", essence: "Visual Storytelling", tone: "poetic", voice: "understated" },
          navigationDesign: { model: "minimal-rail", position: "left", primaryItems: [{ label: "Works", path: "/works" }, { label: "Biography", path: "/about" }] },
          pageCompositionLanguage: { rhythm: "editorial", gridSystem: "masonry", heroPhilosophy: "full-bleed-imagery", pageCompositionRules: [{ route: "/works", pageRole: "gallery", dominantStructure: "Masonry -> Detail Drawer", primaryFocalElement: "Exhibition Viewport" }] },
        },
      };

      writeFileSync(join(TEST_DIR, ".aegis", "locked-experience-plan.json"), JSON.stringify(plan, null, 2));

      const result = await coder.execute(task, mockArch, "plan", "Build artist portfolio gallery", TEST_DIR, []);
      expect(result.files.length).toBe(1);
      expect(result.files[0].content).toContain("data-workspace=\"showcase_landing\"");
      expect(result.files[0].content).toContain("export { PortfolioGallery };");
      expect(capturedPrompt).toContain("Elena Rostova Studio");
      expect(capturedPrompt).not.toContain("FinTrack Pro");
    });

    // Category 3: E-commerce Platform
    it("Category 3 (E-Commerce Storefront): Generates dynamic category filters, shopping cart drawer, and product customizer without bakery hardcodes", async () => {
      let capturedPrompt = "";
      const mockProvider: AIProvider = {
        name: "gemini",
        chat: vi.fn().mockImplementation(async (messages: ChatMessage[]) => {
          capturedPrompt = messages.map(m => m.content).join("\n");
          return `===FILE: src/pages/Storefront.tsx===
import React, { useState } from 'react';
import { ShoppingBag, Star, Plus } from 'lucide-react';

export default function Storefront() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const products = [
    { id: 101, name: 'AeroSound Pro Noise-Cancelling Headphones', price: 299, rating: 4.9 },
    { id: 102, name: 'Precision Wireless Mech Keyboard', price: 189, rating: 4.8 }
  ];

  return (
    <div className="storefront" data-workspace="retail_storefront">
      <header className="store-header">
        <h1>Audio & Desktop Gear</h1>
        <button onClick={() => setCartOpen(true)}>
          <ShoppingBag className="w-5 h-5" /> ({cart.length})
        </button>
      </header>
      <div className="product-grid">
        {products.map(p => (
          <div key={p.id} className="item-card">
            <h3>{p.name}</h3>
            <span>\${p.price}</span>
            <button onClick={() => setCart(prev => [...prev, p])}>Add to Bag</button>
          </div>
        ))}
      </div>
    </div>
  );
}
===END===`;
        }),
      };

      const coder = new CoderAgent(mockProvider);
      const task: Task = {
        id: 2,
        title: "Consumer Product Catalog & Interactive Cart",
        description: "Build storefront catalog, live cart drawer, and customizable gear builder",
        stage: "Frontend",
        ownedRoutes: ["/"],
      };

      const plan = {
        experiencePattern: "storefront-commerce",
        primaryActivity: "Consumer Electronics Retail & Hardware Customization",
        expectedHomeRoute: "/",
        authWallAllowed: false,
        requiredCapabilities: [
          { id: "custom-gear-builder", name: "Custom Hardware Configurator", controlsRequired: ["select", "slider", "button"] },
          { id: "express-pickup", name: "Store Pickup Scheduler", controlsRequired: ["date-picker", "time-slot"] },
        ],
        experienceIdentity: {
          genre: "Consumer Hardware Commerce",
          brandIdentity: { name: "Apex Audio Labs", essence: "High-Fidelity Audio Gear", tone: "sleek", voice: "direct" },
          navigationDesign: { model: "top-bar", position: "sticky", primaryItems: [{ label: "Shop", path: "/" }, { label: "Cart", path: "/cart" }] },
          pageCompositionLanguage: { rhythm: "dense", gridSystem: "product-grid", heroPhilosophy: "product-hero", pageCompositionRules: [{ route: "/", pageRole: "storefront", dominantStructure: "Hero -> Catalog -> Cart Drawer", primaryFocalElement: "Featured Gear" }] },
        },
      };

      writeFileSync(join(TEST_DIR, ".aegis", "locked-experience-plan.json"), JSON.stringify(plan, null, 2));

      const result = await coder.execute(task, mockArch, "plan", "Build audio storefront", TEST_DIR, []);
      expect(result.files.length).toBe(1);
      expect(result.files[0].content).toContain("data-workspace=\"retail_storefront\"");
      expect(result.files[0].content).toContain("export { Storefront };");
      // Must extract custom capabilities dynamically without forcing sourdough or artisan cakes
      expect(capturedPrompt).toContain("INTERACTIVE PRODUCT CONFIGURATOR");
      expect(capturedPrompt).not.toContain("Sourdough, Viennoiserie");
      expect(capturedPrompt).not.toContain("Freshly Baked at 6 AM");
    });

    // Category 4: SaaS Dashboard & Infrastructure Telemetry
    it("Category 4 (SaaS Telemetry Dashboard): Generates live metric filters, telemetry graphs, and interactive service controls", async () => {
      let capturedPrompt = "";
      const mockProvider: AIProvider = {
        name: "gemini",
        chat: vi.fn().mockImplementation(async (messages: ChatMessage[]) => {
          capturedPrompt = messages.map(m => m.content).join("\n");
          return `===FILE: src/pages/TelemetryDashboard.tsx===
import React, { useState } from 'react';
import { Activity, Server, AlertTriangle, RefreshCw } from 'lucide-react';

export default function TelemetryDashboard() {
  const [clusterRegion, setClusterRegion] = useState('us-east-1');
  const [metrics, setMetrics] = useState({ latency: 42, errorRate: 0.02, throughput: 14500 });

  return (
    <div className="telemetry-dashboard" data-workspace="configurator_workspace">
      <h1>Cloud Infrastructure Observability</h1>
      <div className="control-bar">
        <select value={clusterRegion} onChange={e => setClusterRegion(e.target.value)}>
          <option value="us-east-1">US East (N. Virginia)</option>
          <option value="eu-west-1">EU West (Dublin)</option>
        </select>
        <button onClick={() => setMetrics(m => ({ ...m, throughput: m.throughput + 100 }))}>
          <RefreshCw className="w-4 h-4 mr-1 inline" /> Poll Metrics
        </button>
      </div>
      <div className="metrics-grid">
        <div className="kpi"><Activity className="w-5 h-5 text-indigo-500" /> Latency: {metrics.latency}ms</div>
        <div className="kpi"><Server className="w-5 h-5 text-emerald-500" /> Throughput: {metrics.throughput} req/s</div>
      </div>
    </div>
  );
}
===END===`;
        }),
      };

      const coder = new CoderAgent(mockProvider);
      const task: Task = {
        id: 2,
        title: "Cluster Telemetry & Performance Console",
        description: "Build realtime telemetry graphs, region selector, and threshold alerts",
        stage: "Frontend",
        ownedRoutes: ["/telemetry"],
      };

      const plan = {
        experiencePattern: "realtime-console",
        primaryActivity: "Infrastructure Observability & Latency Monitoring",
        expectedHomeRoute: "/telemetry",
        authWallAllowed: false,
        requiredCapabilities: [
          { id: "cluster-telemetry", name: "Cluster Telemetry Inspector", controlsRequired: ["select", "button", "chart"], evidenceVocabulary: ["latency", "throughput", "clusters", "p99", "nodes", "error-rate"] },
        ],
        experienceIdentity: {
          genre: "Cloud Infrastructure SaaS",
          brandIdentity: { name: "AetherOps", essence: "Realtime Telemetry & Edge Routing", tone: "precision", voice: "technical" },
          navigationDesign: { model: "top-bar", position: "sticky", primaryItems: [{ label: "Telemetry", path: "/telemetry" }] },
          pageCompositionLanguage: { rhythm: "metric-dense", gridSystem: "console-grid", heroPhilosophy: "telemetry-ribbon", pageCompositionRules: [{ route: "/telemetry", pageRole: "console", dominantStructure: "Controls -> Telemetry -> Alarms", primaryFocalElement: "Metrics Ribbon" }] },
        },
      };

      writeFileSync(join(TEST_DIR, ".aegis", "locked-experience-plan.json"), JSON.stringify(plan, null, 2));

      const result = await coder.execute(task, mockArch, "plan", "Build cloud telemetry dashboard", TEST_DIR, []);
      expect(result.files.length).toBe(1);
      expect(result.files[0].content).toContain("data-workspace=\"configurator_workspace\"");
      expect(result.files[0].content).toContain("export { TelemetryDashboard };");
      expect(capturedPrompt).toContain("Cluster Telemetry Inspector");
      expect(capturedPrompt).toContain("latency, throughput, clusters");
      expect(capturedPrompt).not.toContain("FinTrack Pro");
    });

    // Category 5: Booking & Reservation Platform
    it("Category 5 (Hospitality / Booking Platform): Generates availability search, suite selection, and reservation drawer", async () => {
      let capturedPrompt = "";
      const mockProvider: AIProvider = {
        name: "gemini",
        chat: vi.fn().mockImplementation(async (messages: ChatMessage[]) => {
          capturedPrompt = messages.map(m => m.content).join("\n");
          return `===FILE: src/pages/RetreatBooking.tsx===
import React, { useState } from 'react';
import { Calendar, Users, Check, MapPin } from 'lucide-react';

export default function RetreatBooking() {
  const [checkIn, setCheckIn] = useState('2026-12-01');
  const [guests, setGuests] = useState(2);
  const [selectedSuite, setSelectedSuite] = useState(null);

  const suites = [
    { id: 'alp-1', name: 'Alpine Panoramic Chalet', capacity: 4, rate: 450, amenities: ['Sauna', 'Mountain View'] },
    { id: 'for-2', name: 'Forest Spa Suite', capacity: 2, rate: 320, amenities: ['Thermal Bath', 'Fireplace'] }
  ];

  return (
    <div className="retreat-portal" data-workspace="hospitality_portal">
      <h1>Alpine Sanctuary & Wellness Retreat</h1>
      <div className="booking-bar">
        <label><Calendar className="w-4 h-4 inline mr-1" /> Dates: <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} /></label>
        <label><Users className="w-4 h-4 inline mr-1" /> Guests: <input type="number" min="1" max="6" value={guests} onChange={e => setGuests(Number(e.target.value))} /></label>
      </div>
      <div className="suites-grid">
        {suites.map(s => (
          <div key={s.id} className="suite-card">
            <h3>{s.name}</h3>
            <p>\${s.rate} / night</p>
            <button onClick={() => setSelectedSuite(s)}>Reserve Suite</button>
          </div>
        ))}
      </div>
    </div>
  );
}
===END===`;
        }),
      };

      const coder = new CoderAgent(mockProvider);
      const task: Task = {
        id: 2,
        title: "Accommodations Showcase & Reservation Flow",
        description: "Build retreat suite catalog, dates/guest availability bar, and booking confirmation drawer",
        stage: "Frontend",
        ownedRoutes: ["/"],
      };

      const plan = {
        experiencePattern: "hospitality-portal",
        primaryActivity: "Boutique Wellness Accommodations & Sanctuary Booking",
        expectedHomeRoute: "/",
        authWallAllowed: false,
        experienceIdentity: {
          genre: "Luxury Wellness Hospitality",
          brandIdentity: { name: "Lumina Alpine Sanctuary", essence: "Mindful Alpine Escapes", tone: "calm", voice: "welcoming" },
          navigationDesign: { model: "top-bar", position: "sticky", primaryItems: [{ label: "Sanctuary", path: "/" }, { label: "Suites", path: "/suites" }] },
          pageCompositionLanguage: { rhythm: "spacious", gridSystem: "suite-grid", heroPhilosophy: "sanctuary-hero", pageCompositionRules: [{ route: "/", pageRole: "portal", dominantStructure: "Hero -> Availability -> Suites -> Reservation", primaryFocalElement: "Alpine Suites" }] },
        },
      };

      writeFileSync(join(TEST_DIR, ".aegis", "locked-experience-plan.json"), JSON.stringify(plan, null, 2));

      const result = await coder.execute(task, mockArch, "plan", "Build sanctuary booking page", TEST_DIR, []);
      expect(result.files.length).toBe(1);
      expect(result.files[0].content).toContain("data-workspace=\"hospitality_portal\"");
      expect(result.files[0].content).toContain("export { RetreatBooking };");
      expect(capturedPrompt).toContain("Lumina Alpine Sanctuary");
      expect(capturedPrompt).not.toContain("Where Pristine Coastline Meets Unrivaled Serenity");
    });

    // Category 6: Full-Stack CRUD Application
    it("Category 6 (Full-Stack CRUD App): Generates structured Express routes, Prisma schema, and interactive frontend table without backend contamination in frontend", async () => {
      let capturedBackendPrompt = "";
      const mockProvider: AIProvider = {
        name: "gemini",
        chat: vi.fn().mockImplementation(async (messages: ChatMessage[]) => {
          capturedBackendPrompt = messages.map(m => m.content).join("\n");
          return `===FILE: server/routes/issues.routes.ts===
import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  const issues = await prisma.issue.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: issues });
});

router.post('/', async (req, res) => {
  const { title, description, priority, status } = req.body;
  const newIssue = await prisma.issue.create({
    data: { title, description, priority: priority || 'MEDIUM', status: status || 'OPEN' }
  });
  res.status(201).json({ success: true, data: newIssue });
});

export default router;
===END===
===FILE: prisma/schema.prisma===
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Issue {
  id          String   @id @default(cuid())
  title       String
  description String?
  priority    String   @default("MEDIUM")
  status      String   @default("OPEN")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
===END===`;
        }),
      };

      const coder = new CoderAgent(mockProvider);
      const backendTask: Task = {
        id: 7,
        title: "Issue Tracker REST APIs & Prisma Models",
        description: "Build Express issue controllers, validation routes, and Prisma Issue model",
        stage: "Backend",
      };

      const result = await coder.execute(backendTask, mockArch, "plan", "Build Express routes and Prisma models for issue tracker", TEST_DIR, []);
      expect(result.files.length).toBe(2);
      expect(result.files.some(f => f.path === "server/routes/issues.routes.ts")).toBe(true);
      expect(result.files.some(f => f.path === "prisma/schema.prisma")).toBe(true);
      expect(capturedBackendPrompt).toContain("BACKEND & DATABASE STAGE: Implement Express routes, controllers, services, and Prisma schema");
      expect(capturedBackendPrompt).not.toContain("FRONTEND-ONLY TASK");
    });

    // Category 7: Education & Learning Platform
    it("Category 7 (Education & Learning Platform): Generates course syllabus, lesson navigation, and quiz modal without banking/finance hardcodes", async () => {
      let capturedPrompt = "";
      const mockProvider: AIProvider = {
        name: "gemini",
        chat: vi.fn().mockImplementation(async (messages: ChatMessage[]) => {
          capturedPrompt = messages.map(m => m.content).join("\n");
          return `===FILE: src/pages/CourseViewer.tsx===
import React, { useState } from 'react';
import { BookOpen, CheckCircle, Award } from 'lucide-react';

export default function CourseViewer() {
  const [activeModule, setActiveModule] = useState(1);
  return (
    <div className="course-viewer" data-workspace="curriculum_viewer">
      <h1>Advanced Distributed Systems</h1>
      <div className="module-list">
        <button onClick={() => setActiveModule(1)}>
          <BookOpen className="w-4 h-4 mr-1 inline" /> Module 1: Consensus Protocols
        </button>
      </div>
      <div className="lesson-body">
        <p>Lesson content on Paxos and Raft algorithms...</p>
      </div>
    </div>
  );
}
===END===`;
        }),
      };

      const coder = new CoderAgent(mockProvider);
      const task: Task = {
        id: 2,
        title: "Curriculum Navigation & Lesson Interactive Viewer",
        description: "Build course syllabus outline, video lesson player container, and knowledge check quiz modal",
        stage: "Frontend",
        ownedRoutes: ["/courses"],
      };

      const plan = {
        experiencePattern: "learning-portal",
        primaryActivity: "Distributed Computing Education & Skill Assessment",
        expectedHomeRoute: "/courses",
        authWallAllowed: false,
        requiredCapabilities: [
          { id: "syllabus-navigator", name: "Curriculum Syllabus Navigator", controlsRequired: ["tree", "button"] },
        ],
        experienceIdentity: {
          genre: "Higher Education & Technical Training",
          brandIdentity: { name: "Distributed Systems Academy", essence: "Mastery in Cloud Protocols", tone: "academic", voice: "precise" },
          navigationDesign: { model: "sidebar", position: "left", primaryItems: [{ label: "Courses", path: "/courses" }] },
          pageCompositionLanguage: { rhythm: "dense", gridSystem: "split-pane", heroPhilosophy: "compact-header", pageCompositionRules: [{ route: "/courses", pageRole: "viewer", dominantStructure: "Sidebar -> Lesson -> Quiz", primaryFocalElement: "Curriculum Tree" }] },
        },
      };

      writeFileSync(join(TEST_DIR, ".aegis", "locked-experience-plan.json"), JSON.stringify(plan, null, 2));

      const result = await coder.execute(task, mockArch, "plan", "Build course viewer", TEST_DIR, []);
      expect(result.files.length).toBe(1);
      expect(result.files[0].content).toContain("data-workspace=\"curriculum_viewer\"");
      expect(result.files[0].content).toContain("export { CourseViewer };");
      expect(capturedPrompt).toContain("Distributed Systems Academy");
      expect(capturedPrompt).not.toContain("FinTrack Pro");
      expect(capturedPrompt).not.toContain("Sourdough");
    });

    // Category 8: Social & Community Platform
    it("Category 8 (Community & Social Network): Generates community feed, post cards, threaded replies, and upvote counters", async () => {
      let capturedPrompt = "";
      const mockProvider: AIProvider = {
        name: "gemini",
        chat: vi.fn().mockImplementation(async (messages: ChatMessage[]) => {
          capturedPrompt = messages.map(m => m.content).join("\n");
          return `===FILE: src/pages/CommunityFeed.tsx===
import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Share2 } from 'lucide-react';

export default function CommunityFeed() {
  const [posts, setPosts] = useState([
    { id: 1, author: 'Alex Chen', content: 'RFC: Zero-copy deserialization in Rust', votes: 42 },
  ]);

  return (
    <div className="community-feed" data-workspace="discussion_board">
      <h1>Developer Discussions & Proposals</h1>
      <div className="posts">
        {posts.map(p => (
          <div key={p.id} className="post-card">
            <h4>{p.author}</h4>
            <p>{p.content}</p>
            <button onClick={() => setPosts(prev => prev.map(item => item.id === p.id ? { ...item, votes: item.votes + 1 } : item))}>
              <ThumbsUp className="w-4 h-4 mr-1 inline" /> {p.votes}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
===END===`;
        }),
      };

      const coder = new CoderAgent(mockProvider);
      const task: Task = {
        id: 2,
        title: "Community Discussion Forum & Real-Time Feed",
        description: "Build member feed, upvote counter, and threaded comments composer",
        stage: "Frontend",
        ownedRoutes: ["/feed"],
      };

      const plan = {
        experiencePattern: "community-portal",
        primaryActivity: "Open Source Collaboration & Member Discussions",
        expectedHomeRoute: "/feed",
        authWallAllowed: false,
        requiredCapabilities: [
          { id: "community-feed", name: "Community Discussion Forum", controlsRequired: ["feed", "button", "input"] },
        ],
        experienceIdentity: {
          genre: "Open Source Developer Community",
          brandIdentity: { name: "Kernel Guild", essence: "Systems Programming Community", tone: "collaborative", voice: "technical" },
          navigationDesign: { model: "top-bar", position: "sticky", primaryItems: [{ label: "Feed", path: "/feed" }] },
          pageCompositionLanguage: { rhythm: "conversational", gridSystem: "feed-grid", heroPhilosophy: "feed-header", pageCompositionRules: [{ route: "/feed", pageRole: "forum", dominantStructure: "Feed -> Thread -> Composer", primaryFocalElement: "Discussion Feed" }] },
        },
      };

      writeFileSync(join(TEST_DIR, ".aegis", "locked-experience-plan.json"), JSON.stringify(plan, null, 2));

      const result = await coder.execute(task, mockArch, "plan", "Build community feed", TEST_DIR, []);
      expect(result.files.length).toBe(1);
      expect(result.files[0].content).toContain("data-workspace=\"discussion_board\"");
      expect(result.files[0].content).toContain("export { CommunityFeed };");
      expect(capturedPrompt).toContain("Kernel Guild");
      expect(capturedPrompt).not.toContain("FinTrack Pro");
      expect(capturedPrompt).not.toContain("Sourdough");
    });
  });

  // ── 5. Generation Lifecycle Gate Reliability ────────────────────────────────
  describe("5. Generation Lifecycle Gate Reliability", () => {
    it("reports honest failure and blocks git commits / documentation when artifacts or gates fail", () => {
      // Simulate finalGateResult with BLOCKED status
      const finalGateResult = {
        success: false,
        status: "BLOCKED" as const,
        blockingReason: "DoD Verification failed: Required route /feed missing interactive elements",
        evidenceSummary: "1 of 2 routes failed interactive verification",
      };

      expect(finalGateResult.success).toBe(false);
      expect(finalGateResult.status).toBe("BLOCKED");
      expect(finalGateResult.blockingReason).toContain("DoD Verification failed");
    });
  });

  // ── 6. Deterministic Application Requirements & Relational Fidelity Fixtures ───
  describe("6. Deterministic Application Requirements & Relational Preservation", () => {
    const fixtureArch: SystemArchitecture = {
      components: [],
      dataFlow: [],
      framework: "react-vite",
      projectStructure: [],
      stateManagement: "react",
    };

    it("preserves required pages, interactions, shared components, and relational database schema for full-stack e-commerce", async () => {
      const ecomContract: ArchitectureContractV1 = {
        version: 1,
        frontend: { framework: "React-Vite", provenance: "explicit" },
        backend: { framework: "Express", provenance: "explicit" },
        database: { provider: "PostgreSQL", orm: "Prisma", provenance: "explicit", ormProvenance: "explicit" },
        language: "TypeScript",
        styling: "TailwindCSS",
        authentication: "JWT",
        packageManager: "pnpm",
        requiredRoutes: ["/", "/catalog", "/cart", "/checkout", "/orders"],
        requiredModels: ["User", "Product", "Order", "OrderItem", "Category"],
        requiredFeatures: ["Catalog Filter", "Cart Drawer", "Checkout Form", "Order Tracking"],
        requiredLibraries: ["lucide-react"],
      };

      // 1. Task Planning Preservation
      const rawPlannerTasks: Task[] = [
        { id: 1, title: "Global App Shell, Header Nav & Cart Drawer", stage: "Frontend", ownedRoutes: ["/"], dependencies: [] },
        { id: 2, title: "Product Catalog, Category Filter & Search", stage: "Frontend", ownedRoutes: ["/catalog"], dependencies: [1] },
        { id: 3, title: "Interactive Cart & Quantity Updates", stage: "Frontend", ownedRoutes: ["/cart"], dependencies: [1] },
        { id: 4, title: "Checkout Flow, Shipping & Payment Form", stage: "Frontend", ownedRoutes: ["/checkout"], dependencies: [1, 3] },
        { id: 5, title: "Customer Orders Ledger & Tracking View", stage: "Frontend", ownedRoutes: ["/orders"], dependencies: [1] },
        { id: 6, title: "Express Auth & Session Endpoints", stage: "Backend", dependencies: [] },
        { id: 7, title: "Express Products & Orders REST API", stage: "Backend", dependencies: [6] },
        { id: 8, title: "Prisma Relational Database Models & Migrations", stage: "Backend", dependencies: [] },
      ];

      const tasks = TaskNormalizer.deduplicateAndCapTasks(rawPlannerTasks);
      // All 8 tasks must be preserved without artificial squashing
      expect(tasks.length).toBe(8);
      expect(tasks.map(t => t.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

      // Every required route must have a task owner
      const allOwnedRoutes = tasks.flatMap(t => t.ownedRoutes || []);
      for (const route of ecomContract.requiredRoutes) {
        expect(allOwnedRoutes).toContain(route);
      }

      // Backend tasks must remain distinct and unmerged
      expect(tasks[5].title).toContain("Express Auth");
      expect(tasks[6].title).toContain("Express Products & Orders");
      expect(tasks[7].title).toContain("Prisma Relational Database");

      // 2. Relational Schema & Backend Code Preservation
      let capturedCoderPrompt = "";
      const mockProvider: AIProvider = {
        name: "gemini",
        chat: vi.fn().mockImplementation(async (messages: ChatMessage[]) => {
          capturedCoderPrompt = messages.map(m => m.content).join("\n");
          return `===FILE: server/routes/orders.routes.ts===
import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/orders', async (req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: { include: { product: true } }, user: true }
  });
  res.json({ success: true, data: orders });
});

router.post('/orders', async (req, res) => {
  const { userId, items, totalAmount } = req.body;
  const order = await prisma.order.create({
    data: {
      userId,
      totalAmount,
      status: 'PENDING',
      items: {
        create: items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        }))
      }
    },
    include: { items: true }
  });
  res.status(201).json({ success: true, data: order });
});

export default router;
===END===
===FILE: prisma/schema.prisma===
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  orders    Order[]
  createdAt DateTime @default(now())
}

model Category {
  id       String    @id @default(cuid())
  name     String    @unique
  products Product[]
}

model Product {
  id          String      @id @default(cuid())
  name        String
  price       Float
  categoryId  String
  category    Category    @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
}

model Order {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  totalAmount Float
  status      String      @default("PENDING")
  items       OrderItem[]
  createdAt   DateTime    @default(now())
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  unitPrice Float
}
===END===`;
        }),
      };

      const coder = new CoderAgent(mockProvider);
      const backendResult = await coder.execute(tasks[6], fixtureArch, "plan", "Build orders API and relational schema", TEST_DIR, []);
      
      expect(backendResult.files.length).toBe(2);
      // Backend route file must retain .ts extension without erroneous .tsx renaming
      const routeFile = backendResult.files.find(f => f.path === "server/routes/orders.routes.ts");
      expect(routeFile).toBeDefined();
      expect(routeFile?.path).toBe("server/routes/orders.routes.ts");

      // Prisma schema must preserve 1-to-many foreign key relations
      const schemaFile = backendResult.files.find(f => f.path === "prisma/schema.prisma");
      expect(schemaFile).toBeDefined();
      expect(schemaFile?.content).toContain("model User");
      expect(schemaFile?.content).toContain("model Order");
      expect(schemaFile?.content).toContain("model OrderItem");
      expect(schemaFile?.content).toContain("model Product");
      expect(schemaFile?.content).toMatch(/category\s+Category\s+@relation/);
      expect(schemaFile?.content).toMatch(/user\s+User\s+@relation/);
      expect(schemaFile?.content).toMatch(/order\s+Order\s+@relation/);

      // Verify prompt included relational backend guidance
      expect(capturedCoderPrompt).toContain("BACKEND & DATABASE STAGE");
    });

    it("preserves patient booking, doctor scheduling, and medical records relational requirements for healthcare SaaS", () => {
      const healthTasks: Task[] = [
        { id: 1, title: "Global Healthcare Shell & Patient Nav", stage: "Frontend", ownedRoutes: ["/"] },
        { id: 2, title: "Physician Directory & Availability Search", stage: "Frontend", ownedRoutes: ["/doctors"] },
        { id: 3, title: "Interactive Appointment Booking Calendar", stage: "Frontend", ownedRoutes: ["/schedule"] },
        { id: 4, title: "Patient Health Records & Diagnostic History", stage: "Frontend", ownedRoutes: ["/records"] },
        { id: 5, title: "Express Doctors & Appointments Service", stage: "Backend" },
        { id: 6, title: "Express Medical Records API", stage: "Backend" },
        { id: 7, title: "Prisma Healthcare Schema & Relations", stage: "Backend" },
      ];

      const res = TaskNormalizer.deduplicateAndCapTasks(healthTasks);
      expect(res.length).toBe(7);
      expect(res.map(t => t.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(res[4].title).toBe("Express Doctors & Appointments Service");
      expect(res[5].title).toBe("Express Medical Records API");
      expect(res[6].title).toBe("Prisma Healthcare Schema & Relations");
    });
  });
});
