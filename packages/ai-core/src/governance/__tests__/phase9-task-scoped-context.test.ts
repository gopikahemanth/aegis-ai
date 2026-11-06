import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { TaskNormalizer } from "../task-normalizer.js";
import { PromptBudgetInstrumenter } from "../prompt-budget-instrumenter.js";
import { TokenBudgetManager } from "../../context/token-budget.js";
import { PromptManager } from "../../prompts/prompt-manager.js";
import { PromptBuilderEngine } from "../../prompts/builder.js";
import type { Task } from "../../planner/task.js";
import type { ProjectSpecification } from "../../architect/specification.js";

const FIXTURE_DIR = join(process.cwd(), "temp-phase9-scoped-context-test");

describe("Phase 9.2 — Task-Scoped Context Optimization & Prompt Efficiency", () => {
  beforeEach(() => {
    if (existsSync(FIXTURE_DIR)) {
      rmSync(FIXTURE_DIR, { recursive: true, force: true });
    }
    mkdirSync(join(FIXTURE_DIR, ".aegis"), { recursive: true });
    mkdirSync(join(FIXTURE_DIR, "src", "components"), { recursive: true });
    mkdirSync(join(FIXTURE_DIR, "src", "content"), { recursive: true });
    mkdirSync(join(FIXTURE_DIR, "src", "design-system"), { recursive: true });

    // Seed mock .aegis artifacts representing FinTrack Pro
    const mockPagePlans = [
      { route: "/", pageRole: "Overview", purpose: "Executive Treasury Dashboard", focalElement: "Liquidity Dial", composition: { dominantStructure: "workspace", topology: "split", sections: ["Hero", "Metrics", "Feed"] }, interaction: { primary: ["filter", "inspect"] }, requiredCapabilities: ["kpi-cluster"], forbiddenPatterns: ["generic-cards"] },
      { route: "/executive-login", pageRole: "Auth", purpose: "HSM Token Authentication", focalElement: "Security Key Console", composition: { dominantStructure: "card", topology: "centered", sections: ["Form"] }, interaction: { primary: ["authenticate"] }, requiredCapabilities: ["hsm-auth"], forbiddenPatterns: ["social-login"] },
      { route: "/liquidity-overview", pageRole: "Analytics", purpose: "Multi-bank balance breakdown", focalElement: "Cash Map", composition: { dominantStructure: "grid", topology: "full-width", sections: ["Chart", "Accounts"] }, interaction: { primary: ["drilldown"] }, requiredCapabilities: ["bank-feed"], forbiddenPatterns: ["fake-numbers"] },
      { route: "/analyze-burn-rate-forecast", pageRole: "Forecasting", purpose: "Predictive runway simulator", focalElement: "Runway Slider", composition: { dominantStructure: "stage", topology: "split", sections: ["Sliders", "Trajectory"] }, interaction: { primary: ["simulate"] }, requiredCapabilities: ["scenario-engine"], forbiddenPatterns: ["static-tables"] },
      { route: "/execute-fund-transfer", pageRole: "Workflow", purpose: "Validated fund movement", focalElement: "Transfer Form", composition: { dominantStructure: "stepper", topology: "modal", sections: ["Source", "Dest", "Amount"] }, interaction: { primary: ["transfer"] }, requiredCapabilities: ["transactional-commit"], forbiddenPatterns: ["unvalidated-submit"] },
      { route: "/filter-export-ledger", pageRole: "Ledger", purpose: "Searchable transaction records", focalElement: "Ledger Table", composition: { dominantStructure: "table", topology: "stacked", sections: ["Search", "Filters", "Table"] }, interaction: { primary: ["search", "filter"] }, requiredCapabilities: ["instant-search"], forbiddenPatterns: ["dummy-alerts"] },
      { route: "/treasury-accounts", pageRole: "Accounts", purpose: "Bank and facility manager", focalElement: "Facility Matrix", composition: { dominantStructure: "grid", topology: "multi-col", sections: ["AccountsList", "FacilityModal"] }, interaction: { primary: ["addAccount"] }, requiredCapabilities: ["facility-config"], forbiddenPatterns: ["missing-delete-confirm"] },
      { route: "/configure-budget-thresholds", pageRole: "Budgets", purpose: "Category spend tracking", focalElement: "Variance Progress", composition: { dominantStructure: "cards", topology: "stacked", sections: ["BudgetBars"] }, interaction: { primary: ["updateBudget"] }, requiredCapabilities: ["threshold-alert"], forbiddenPatterns: ["raw-inputs"] },
      { route: "/audit-log", pageRole: "Compliance", purpose: "Immutable security trail", focalElement: "Event Timeline", composition: { dominantStructure: "timeline", topology: "vertical", sections: ["TimelineList"] }, interaction: { primary: ["inspectLog"] }, requiredCapabilities: ["audit-trail"], forbiddenPatterns: ["editable-rows"] },
    ];

    writeFileSync(
      join(FIXTURE_DIR, ".aegis", "product-experience-plan.json"),
      JSON.stringify({ experiencePattern: "operations-dashboard", pagePlans: mockPagePlans }, null, 2)
    );

    const mockDesignBrief = {
      artDirectionName: "Linear Corporate Finance",
      artDirectionRationale: "High density dark treasury interface",
      colorSystem: { primary: "Emerald", primaryHex: "#059669", background: "#141416", surface: "#1c1c1f", textPrimary: "#f4f4f5" },
      typography: { displayFont: "JetBrains Mono", bodyFont: "Inter", displayScale: "medium" },
      geometry: { style: "crisp", radiusMd: "4px", borderWidth: "1px" },
      componentLanguage: { cardStyle: "bordered-glass", buttonPrimary: "emerald-fill", loadingStyle: "skeleton" },
      vocabularyContract: { required: ["Treasury", "Liquidity", "Inflow"], preferred: ["Runway"], forbidden: ["Total Activity Volume"] },
      pageCompositions: mockPagePlans.map((p, i) => ({ route: p.route, name: p.purpose, compositionFamily: "dashboard", heroElement: "metric-dial", primaryFocus: p.focalElement })),
    };

    writeFileSync(
      join(FIXTURE_DIR, ".aegis", "design-brief.json"),
      JSON.stringify(mockDesignBrief, null, 2)
    );

    // Seed mock existing source files
    writeFileSync(join(FIXTURE_DIR, "src", "design-system", "tokens.ts"), `export const themeTokens = { primary: "#059669", bg: "#141416" };\nexport interface ThemeConfig { dark: boolean; }`);
    writeFileSync(join(FIXTURE_DIR, "src", "content", "site-content.ts"), `export default { brand: { name: "FinTrack Pro", tagline: "Treasury Intelligence" } };`);
    writeFileSync(join(FIXTURE_DIR, "src", "components", "Navbar.tsx"), `import React from 'react';\nexport interface NavbarProps { activeRoute: string; }\nexport const Navbar: React.FC<NavbarProps> = ({ activeRoute }) => <nav>{activeRoute}</nav>;`);
  });

  afterEach(() => {
    if (existsSync(FIXTURE_DIR)) {
      rmSync(FIXTURE_DIR, { recursive: true, force: true });
    }
  });

  it("1. Task-scoped route plan resolution: maps explicit ownedRoutes or deterministic keywords", () => {
    const taskShell: Task = { id: 1, title: "FinTrack Pro Shell & Navigation Scaffold", description: "Create navbar and routes", completed: false };
    const taskDashboard: Task = { id: 2, title: "Executive Liquidity Dashboard & Treasury Accounts Workspace", description: "Build liquidity charts", completed: false };
    const taskLedger: Task = { id: 4, title: "Transaction Ledger & Fund Transfer Workflow", description: "Searchable table", completed: false };

    const routesShell = TaskNormalizer.resolveOwnedRoutes(taskShell);
    const routesDashboard = TaskNormalizer.resolveOwnedRoutes(taskDashboard);
    const routesLedger = TaskNormalizer.resolveOwnedRoutes(taskLedger);

    expect(routesShell).toContain("/");
    expect(routesDashboard).toContain("/liquidity-overview");
    expect(routesDashboard).toContain("/treasury-accounts");
    expect(routesLedger).toContain("/filter-export-ledger");
    expect(routesLedger).toContain("/execute-fund-transfer");
  });

  it("2. Compact CoderAgent system prompt achieves ~1,500 token target while preserving core rules", () => {
    const promptManager = new PromptManager();
    const coderPrompt = promptManager.getCoderPrompt();

    // Verify critical invariants are strictly retained
    expect(coderPrompt).toContain("COMPLETE IMPLEMENTATION");
    expect(coderPrompt).toContain("ACCURATE DOMAIN VOCABULARY");
    expect(coderPrompt).toContain("PROFESSIONAL UI & ACCESSIBILITY");
    expect(coderPrompt).toContain("RESPONSIVE DESIGN");
    expect(coderPrompt).toContain("<BrowserRouter> exactly once");
    expect(coderPrompt).toContain("MODULARITY & TOKEN LIMITS");
    expect(coderPrompt).toContain("===FILE: relative/path/to/file.tsx===");

    // Verify measured token size
    const estTokens = TokenBudgetManager.estimateTokens(coderPrompt, true);
    // Static prompt should be between 1,200 and 2,000 tokens (target ~1,500)
    expect(estTokens).toBeGreaterThan(1000);
    expect(estTokens).toBeLessThan(2100);
  });

  it("3. Authoritative file context eliminates double file loading", () => {
    const builder = new PromptBuilderEngine();
    const mockSpec: ProjectSpecification = {
      name: "FinTrack Pro",
      type: "website",
      frontend: "React",
      backend: "Express",
      database: "PostgreSQL",
      language: "TypeScript",
      styling: "TailwindCSS",
      packageManager: "pnpm",
      features: ["dashboard", "ledger"],
      inferredLibraries: ["lucide-react"],
      userFlows: ["view-dashboard"],
      dataModels: ["Account", "Transaction"],
      featureDescriptions: { dashboard: "Cash flow metrics" },
      auth: "none",
      deployment: "none",
    };

    // When skipFileContext is true, PromptBuilderEngine does NOT dump ===FILE: blocks into prompt
    const prompt = builder.build(
      [{ title: "Task 1: Shell" }],
      mockSpec,
      "Use feature-based structure",
      "Build FinTrack Pro",
      FIXTURE_DIR,
      { skipFileContext: true }
    );

    // Full file dumping should NOT occur in the builder prompt
    expect(prompt).not.toContain("===FILE: src/content/site-content.ts===");
    expect(prompt).not.toContain("===FILE: src/design-system/tokens.ts===");
  });

  it("4. TokenBudgetManager extracts TypeScript signatures for indirect dependencies and prevents duplicates", () => {
    const candidateFiles = [
      { path: "src/content/site-content.ts", content: `export default { brand: { name: "FinTrack Pro" } };`, isDirect: true },
      { path: "src/components/Navbar.tsx", content: `import React from 'react';\nexport interface NavbarProps { active: string; }\nexport const Navbar: React.FC<NavbarProps> = (props) => <div>{props.active}</div>;`, isDirect: false },
      { path: "src/components/Navbar.tsx", content: `duplicate entry`, isDirect: false }, // Duplicate check
    ];

    const degraded = TokenBudgetManager.degradeFilesToBudget(candidateFiles, 5000);

    // Tier 1 should only contain direct dependencies
    expect(degraded.tier1FullFiles.some(f => f.path === "src/content/site-content.ts")).toBe(true);
    // Tier 2 should contain signatures for indirect dependencies
    expect(degraded.tier2SignatureFiles.some(f => f.path === "src/components/Navbar.tsx")).toBe(true);
    expect(degraded.tier2SignatureFiles.find(f => f.path === "src/components/Navbar.tsx")?.signatures).toContain("export interface NavbarProps");

    // Duplicate check: Navbar.tsx must only be included once
    const formatted = TokenBudgetManager.formatFileContext(degraded);
    const matches = formatted.match(/src\/components\/Navbar\.tsx/g);
    expect(matches?.length).toBe(1);
  });

  it("5. PromptBudgetInstrumenter detects duplicate content and enforces 12,000 ceiling", () => {
    const cleanPrompt = `=== FILE: src/routes.tsx ===\nexport const routes = [];`;
    const duplicatePrompt = `=== FILE: src/routes.tsx ===\nexport const routes = [];\n=== FILE: src/routes.tsx ===\nexport const routes = [];`;

    const reportClean = PromptBudgetInstrumenter.measurePrompt("system instructions", cleanPrompt);
    expect(reportClean.duplicateContentDetected).toBe(false);
    expect(reportClean.passedCeiling).toBe(true);

    const reportDuplicate = PromptBudgetInstrumenter.measurePrompt("system instructions", duplicatePrompt);
    expect(reportDuplicate.duplicateContentDetected).toBe(true);
    expect(reportDuplicate.duplicateDetails?.[0]).toContain('File "src/routes.tsx" is included 2 times');
  });

  it("6. Task 1 and Task 2 context accumulation protection: stays below 8,500 target tokens", () => {
    const sysPrompt = new PromptManager().getCoderPrompt();
    const builder = new PromptBuilderEngine();

    const mockSpec: ProjectSpecification = {
      name: "FinTrack Pro",
      type: "website",
      frontend: "React",
      backend: "Express",
      database: "PostgreSQL",
      language: "TypeScript",
      styling: "TailwindCSS",
      packageManager: "pnpm",
      features: ["dashboard", "ledger"],
      inferredLibraries: ["lucide-react"],
      userFlows: ["view-dashboard"],
      dataModels: ["Account", "Transaction"],
      featureDescriptions: { dashboard: "Cash flow metrics" },
      auth: "none",
      deployment: "none",
    };

    // Simulate Task 1 (Shell)
    const task1: Task = { id: 1, title: "FinTrack Pro Shell, Navigation & Routing Scaffold", description: "Create shell, layout, and routes", completed: false, ownedRoutes: ["/"] };
    const task1BuilderPrompt = builder.build([task1], mockSpec, "Use clean architecture", "FinTrack Pro", FIXTURE_DIR, { skipFileContext: true });

    const task1Files = TokenBudgetManager.degradeFilesToBudget([
      { path: "src/content/site-content.ts", content: `export default { brand: { name: "FinTrack Pro" } };`, isDirect: true },
      { path: "src/design-system/tokens.ts", content: `export const theme = { bg: "#141416" };`, isDirect: false },
    ], 3000);

    const task1UserPrompt = `${task1BuilderPrompt}\n\nExisting files:\n${TokenBudgetManager.formatFileContext(task1Files)}`;
    const task1Report = PromptBudgetInstrumenter.measurePrompt(sysPrompt, task1UserPrompt);

    expect(task1Report.passedCeiling).toBe(true);
    expect(task1Report.totalEstimatedPromptTokens).toBeLessThan(8500);

    // Simulate Task 2 (Liquidity Dashboard) with Task 1 artifacts on disk
    const task2: Task = { id: 2, title: "Executive Liquidity Dashboard & Treasury Accounts Workspace", description: "Build liquidity charts and account cards", completed: false, ownedRoutes: ["/", "/treasury-accounts"] };
    const task2BuilderPrompt = builder.build([task2], mockSpec, "Use clean architecture", "FinTrack Pro", FIXTURE_DIR, { skipFileContext: true });

    // Task 2 only loads Task 1 outputs (Navbar, Layout) as indirect Tier 2 signatures
    const task2Files = TokenBudgetManager.degradeFilesToBudget([
      { path: "src/content/site-content.ts", content: `export default { brand: { name: "FinTrack Pro" } };`, isDirect: true },
      { path: "src/components/Navbar.tsx", content: `export interface NavbarProps { active: string; }\nexport const Navbar: React.FC<NavbarProps> = () => null;`, isDirect: false },
      { path: "src/components/Layout.tsx", content: `export interface LayoutProps { children: React.ReactNode; }\nexport const Layout: React.FC<LayoutProps> = () => null;`, isDirect: false },
      { path: "src/design-system/tokens.ts", content: `export const theme = { bg: "#141416" };`, isDirect: false },
    ], 3000);

    const task2UserPrompt = `${task2BuilderPrompt}\n\nExisting files:\n${TokenBudgetManager.formatFileContext(task2Files)}`;
    const task2Report = PromptBudgetInstrumenter.measurePrompt(sysPrompt, task2UserPrompt);

    expect(task2Report.passedCeiling).toBe(true);
    expect(task2Report.totalEstimatedPromptTokens).toBeLessThan(8500);
  });

  it("7. Real FinTrack Pro task plan maps all 9 benchmark routes deterministically", () => {
    const realTasks: Task[] = [
      { id: 1, title: "Application Shell, Navigation & Executive Routing", description: "Build the enterprise application shell with a sticky sidebar and topbar navigation, role-switching header (CFO, Finance Director, Treasury Analyst), page layout container, React Router setup for all feature views (/, /treasury, /forecasting, /transfers, /ledger, /thresholds, /audit), and mobile navigation drawer. Seed clean route stubs.", completed: false },
      { id: 2, title: "Executive Liquidity Dashboard & Treasury Accounts Workspace", description: "Implement the primary executive dashboard displaying real-time total liquidity, working capital, net cash position, cash runway indicators, and quick-action widgets. Build the Treasury Accounts view with interactive account creation/edit modal, balance breakdown charts (Recharts), account status toggles, and rich seed data for operational, checking, savings, and investment accounts.", completed: false },
      { id: 3, title: "Burn-Rate Forecasting & Cash-Flow Scenario Simulator", description: "Implement the interactive burn-rate forecasting page with multi-month trajectory area/line charts, scenario-based input sliders (headcount change, revenue growth, expense adjustments), cash runway projection calculators, and interactive variance breakdown tables driven by local state.", completed: false },
      { id: 4, title: "Transaction Ledger & Fund Transfer Workflow", description: "Build the comprehensive transaction ledger featuring category filters, date-range selectors, search input, multi-column sorting, and simulated CSV/PDF export preview. Implement the interactive fund transfer modal & workflow featuring source/destination account selectors, real-time balance validation, signoff step, and immediate ledger entry insertion.", completed: false },
      { id: 5, title: "Budget Threshold Alerts & Audit Trail Inspector", description: "Build the budget threshold & velocity alert manager with editable liquidity thresholds, status badges, and rule toggles. Implement the audit trail explorer featuring event log timelines, user action tracking, event-type filtering, timestamp ranges, and detailed log record inspection modal.", completed: false },
      { id: 6, title: "Responsive Polish, Interactive States & Accessibility Polish", description: "Ensure complete responsive layout compliance across mobile (375px), tablet (768px), and desktop (1440px). Add simulated executive auth state toggler, toast notification feedback system, empty search/filter states with reset CTAs, skeleton loading animations, and full focus/hover states across all interactive elements.", completed: false },
    ];

    const routeAssignments = realTasks.map(t => ({
      id: t.id,
      title: t.title,
      routes: TaskNormalizer.resolveOwnedRoutes(t),
    }));

    // Verify task 1 owns executive login (shell frame + auth gateway, no duplicate dashboard ownership)
    expect(routeAssignments[0].routes).toEqual(["/executive-login"]);
    // Verify task 2 owns dashboard, liquidity overview, and treasury accounts
    expect(routeAssignments[1].routes).toEqual(["/", "/liquidity-overview", "/treasury-accounts"]);
    // Verify task 3 owns forecasting
    expect(routeAssignments[2].routes).toEqual(["/analyze-burn-rate-forecast"]);
    // Verify task 4 owns fund transfer and transaction ledger
    expect(routeAssignments[3].routes).toEqual(["/execute-fund-transfer", "/filter-export-ledger"]);
    // Verify task 5 owns budget thresholds and audit log
    expect(routeAssignments[4].routes).toEqual(["/configure-budget-thresholds", "/audit-log"]);
    // Verify task 6 falls back safely to root layout
    expect(routeAssignments[5].routes).toEqual(["/"]);

    // Verify ALL 9 routes are covered
    const allAssignedRoutes = Array.from(new Set(routeAssignments.flatMap(r => r.routes)));
    const expected9Routes = [
      "/",
      "/executive-login",
      "/liquidity-overview",
      "/analyze-burn-rate-forecast",
      "/execute-fund-transfer",
      "/filter-export-ledger",
      "/treasury-accounts",
      "/configure-budget-thresholds",
      "/audit-log",
    ];
    for (const expRoute of expected9Routes) {
      expect(allAssignedRoutes).toContain(expRoute);
    }
  });

  it("8. PromptBudgetInstrumenter rejects oversized prompts (> 12,000 tokens) safely", () => {
    const sysPrompt = "System instructions";
    const normalUserPrompt = "Short user prompt";
    const reportNormal = PromptBudgetInstrumenter.measurePrompt(sysPrompt, normalUserPrompt);
    expect(() => PromptBudgetInstrumenter.assertWithinCeiling(reportNormal)).not.toThrow();

    // Create a synthetic oversized prompt exceeding 12,000 tokens
    const oversizedText = "x".repeat(50000); // ~13,800 tokens
    const reportOversized = PromptBudgetInstrumenter.measurePrompt(sysPrompt, oversizedText);
    expect(reportOversized.passedCeiling).toBe(false);
    expect(() => PromptBudgetInstrumenter.assertWithinCeiling(reportOversized)).toThrow(
      /exceeds regression ceiling/
    );
  });
});

