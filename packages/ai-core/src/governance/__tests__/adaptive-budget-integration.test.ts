import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GenerationBudgetGuard, BudgetExceededError, type GenerationBudgetConfig } from "../generation-budget-guard.js";
import { TokenBudgetManager } from "../../context/token-budget.js";
import { FailoverProvider } from "../../providers/failover.js";
import { MetricsTracker } from "../../providers/metrics-tracker.js";
import type { AIProvider, ChatMessage, ChatOptions } from "../../providers/base.js";

class DeterministicMockProvider implements AIProvider {
  public name: string;
  public callCount = 0;
  public capturedOptions: ChatOptions[] = [];
  public responses: string[] = [];
  public reportUsage = true;
  public promptUsage = 1500;
  public completionUsage = 400;

  constructor(name: string, responses: string[] = []) {
    this.name = name;
    this.responses = [...responses];
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    this.callCount++;
    if (options) {
      this.capturedOptions.push({ ...options });
    }

    if (this.reportUsage) {
      MetricsTracker.getInstance().logUsage(this.promptUsage, this.completionUsage);
    }

    const resp = this.responses.shift() || "export const Widget = () => <div>Deterministic Output</div>;";
    return resp;
  }
}

describe("AEGIS Adaptive Project Budgeting & Per-Request Limit Decoupling Suite", () => {
  beforeEach(() => {
    delete process.env.AEGIS_BENCHMARK_MODE;
    delete process.env.AEGIS_MAX_REQUESTS;
    delete process.env.AEGIS_MAX_PROMPT_TOKENS;
    delete process.env.AEGIS_MAX_COMPLETION_TOKENS;

    const guard = GenerationBudgetGuard.getInstance();
    guard.releaseGenerationLock();
    guard.reset();
    FailoverProvider.resetState();
    MetricsTracker.getInstance().reset();
  });

  afterEach(() => {
    delete process.env.AEGIS_BENCHMARK_MODE;
    delete process.env.AEGIS_MAX_REQUESTS;
    delete process.env.AEGIS_MAX_PROMPT_TOKENS;
    delete process.env.AEGIS_MAX_COMPLETION_TOKENS;

    const guard = GenerationBudgetGuard.getInstance();
    guard.releaseGenerationLock();
    guard.reset();
  });

  // ── 1. Scale-Appropriate Adaptive Defaults ──────────────────────────────────
  describe("1. Project Complexity Classification & Adaptive Budgets", () => {
    it("1. Light projects receive appropriate adaptive defaults (25 req, 150k input, 35k output)", () => {
      const guard = GenerationBudgetGuard.getInstance();
      guard.acquireGenerationLock("gen_light_1");

      // Classification via string scale
      guard.adaptiveConfigureForProject("light");
      let status = guard.getStatus();
      expect(status.remainingRequests).toBe(25);
      expect(status.remainingPromptTokens).toBe(150000);
      expect(status.remainingCompletionTokens).toBe(35000);

      // Classification via static contract/spec
      guard.adaptiveConfigureForProject({
        applicationType: "STATIC_WEBSITE",
        requiredFeatures: ["hero", "about"],
        requiredRoutes: ["/", "/about"],
        backend: { framework: "None" },
        database: { provider: "None" },
      });
      status = guard.getStatus();
      expect(status.remainingRequests).toBe(25);
      expect(status.remainingPromptTokens).toBe(150000);
      expect(status.remainingCompletionTokens).toBe(35000);
    });

    it("2. Standard projects receive appropriate defaults (45 req, 350k input, 80k output)", () => {
      const guard = GenerationBudgetGuard.getInstance();
      guard.acquireGenerationLock("gen_standard_1");

      guard.adaptiveConfigureForProject("standard");
      let status = guard.getStatus();
      expect(status.remainingRequests).toBe(45);
      expect(status.remainingPromptTokens).toBe(350000);
      expect(status.remainingCompletionTokens).toBe(80000);

      // Multi-page frontend application without backend
      guard.adaptiveConfigureForProject({
        applicationType: "SPA",
        requiredFeatures: ["home", "catalog", "faq", "contact"],
        requiredRoutes: ["/", "/catalog", "/faq", "/contact"],
      });
      status = guard.getStatus();
      expect(status.remainingRequests).toBe(45);
      expect(status.remainingPromptTokens).toBe(350000);
      expect(status.remainingCompletionTokens).toBe(80000);
    });

    it("3. Full-stack projects receive appropriate cumulative budgets (75 req, 750k input, 160k output)", () => {
      const guard = GenerationBudgetGuard.getInstance();
      guard.acquireGenerationLock("gen_fullstack_1");

      guard.adaptiveConfigureForProject("fullstack");
      let status = guard.getStatus();
      expect(status.remainingRequests).toBe(75);
      expect(status.remainingPromptTokens).toBe(750000);
      expect(status.remainingCompletionTokens).toBe(160000);

      // Real-world Full-Stack Contract (Appointment Booking Platform fixture)
      guard.adaptiveConfigureForProject({
        applicationType: "FULLSTACK_WEB_APPLICATION",
        frontend: { framework: "React-Vite" },
        backend: { framework: "Express" },
        database: { provider: "SQLite", orm: "Prisma" },
        requiredFeatures: ["landing", "catalog", "calendar", "booking", "dashboard", "admin"],
        requiredRoutes: ["/", "/services", "/select-slot", "/complete-booking", "/appointments", "/admin-analytics", "/service-crud"],
        requiredModels: ["User", "Service", "Appointment", "Availability", "Analytics"],
      });
      status = guard.getStatus();
      expect(status.remainingRequests).toBe(75);
      expect(status.remainingPromptTokens).toBe(750000);
      expect(status.remainingCompletionTokens).toBe(160000);
    });

    it("4. Enterprise projects receive appropriate cumulative budgets (150 req, 1.5M input, 300k output)", () => {
      const guard = GenerationBudgetGuard.getInstance();
      guard.acquireGenerationLock("gen_enterprise_1");

      guard.adaptiveConfigureForProject("enterprise");
      let status = guard.getStatus();
      expect(status.remainingRequests).toBe(150);
      expect(status.remainingPromptTokens).toBe(1500000);
      expect(status.remainingCompletionTokens).toBe(300000);

      // Enterprise contract with 10+ features and enterprise application type
      guard.adaptiveConfigureForProject({
        applicationType: "ENTERPRISE_APPLICATION",
        requiredFeatures: ["auth", "rbac", "billing", "tenants", "telemetry", "audit", "compliance", "crm", "workflow", "notifications"],
        requiredRoutes: ["/", "/dashboard", "/tenants", "/billing", "/audit", "/analytics", "/settings", "/compliance", "/users"],
        backend: { framework: "Express" },
        database: { provider: "PostgreSQL", orm: "Prisma" },
      });
      status = guard.getStatus();
      expect(status.remainingRequests).toBe(150);
      expect(status.remainingPromptTokens).toBe(1500000);
      expect(status.remainingCompletionTokens).toBe(300000);
    });

    it("general-purpose domain recognition handles E-commerce, SaaS, Booking, Education, Social, and Finance", () => {
      const guard = GenerationBudgetGuard.getInstance();

      // E-commerce
      guard.adaptiveConfigureForProject("Build a complete modern E-commerce storefront with products, cart, stripe checkout, and Postgres Prisma database");
      expect(guard.getStatus().remainingRequests).toBe(75);
      expect(guard.getStatus().remainingCompletionTokens).toBe(160000);

      // SaaS
      guard.adaptiveConfigureForProject("Build a SaaS subscription platform with team billing, JWT authentication, and Express REST APIs");
      expect(guard.getStatus().remainingRequests).toBe(75);
      expect(guard.getStatus().remainingCompletionTokens).toBe(160000);

      // Appointment Booking
      guard.adaptiveConfigureForProject("Create an appointment booking platform with time slot calendar and SQLite database transactions");
      expect(guard.getStatus().remainingRequests).toBe(75);

      // Social Platform
      guard.adaptiveConfigureForProject("Build a social networking application with user profiles, posts, feed, and relational database persistence");
      expect(guard.getStatus().remainingRequests).toBe(75);

      // Enterprise Cloud Platform
      guard.adaptiveConfigureForProject("Build an enterprise distributed microservices orchestration control-plane with compliance audits");
      expect(guard.getStatus().remainingRequests).toBe(150);
      expect(guard.getStatus().remainingCompletionTokens).toBe(300000);
    });
  });

  // ── 2. User Configuration & Mid-Generation Preservation ────────────────────
  describe("2. Explicit Configuration Precedence & Mid-Generation State Integrity", () => {
    it("5. Explicit user budgets take precedence over adaptive configuration", () => {
      const guard = GenerationBudgetGuard.getInstance();
      guard.acquireGenerationLock("gen_user_custom");

      // User explicitly configures custom budget
      guard.configure({
        maxRequests: 30,
        maxPromptTokens: 250000,
        maxCompletionTokens: 50000,
      });

      // Subsequent adaptive project scaling must NOT override explicit user configuration
      guard.adaptiveConfigureForProject("fullstack");
      const status = guard.getStatus();
      expect(status.remainingRequests).toBe(30);
      expect(status.remainingPromptTokens).toBe(250000);
      expect(status.remainingCompletionTokens).toBe(50000);
    });

    it("6. Budgets initialize before generation via acquireGenerationLock", () => {
      const guard = GenerationBudgetGuard.getInstance();
      guard.acquireGenerationLock("gen_init_check", {
        explicitBudget: { maxRequests: 50, maxCompletionTokens: 100000 }
      });

      expect(guard.isGenerationActive()).toBe(true);
      expect(guard.getActiveGenerationId()).toBe("gen_init_check");
      expect(guard.getStatus().remainingRequests).toBe(50);
      expect(guard.getStatus().remainingCompletionTokens).toBe(100000);
    });

    it("7. No mid-generation reset occurs across planning, architecture, coding, and repair", () => {
      const guard = GenerationBudgetGuard.getInstance();
      guard.acquireGenerationLock("gen_persistent_1");
      guard.adaptiveConfigureForProject("fullstack");

      // Simulate Stage 1 & 2 calls
      guard.recordRequest();
      guard.recordUsage(2500, 600);

      // Calling adaptiveConfigureForProject mid-generation (e.g. at contract lock) updates limits without resetting usage!
      guard.adaptiveConfigureForProject({
        applicationType: "FULLSTACK_WEB_APPLICATION",
        backend: { framework: "Express" },
        database: { provider: "SQLite" },
      });

      const midStatus = guard.getStatus();
      expect(midStatus.requestCount).toBe(1);
      expect(midStatus.promptTokens).toBe(2500);
      expect(midStatus.completionTokens).toBe(600);

      // Calling resetUsageOnly resets counters; but acquireGenerationLock with SAME generationId is idempotent
      expect(guard.getActiveGenerationId()).toBe("gen_persistent_1");
    });
  });

  // ── 3. Separation of Cumulative Budgets and Per-Request Limits ──────────────
  describe("3. Cumulative Budgets vs Per-Request Limit Decoupling", () => {
    it("8 & 9. Per-model output limits are respected independently of cumulative budget", () => {
      // Case 1: Cumulative budget is 160,000 tokens (fullstack)
      // Gemini Flash model has physical max output of 8,192 tokens.
      // calculatePerRequestBudget must NOT return 160,000; it must clamp to 8,192!
      const flashCalc = TokenBudgetManager.calculatePerRequestBudget(
        "gemini-3.6-flash",
        15000, // estimated prompt tokens
        undefined, // caller did not specify maxTokens
        160000 // remaining cumulative budget
      );
      expect(flashCalc.modelMaxOutput).toBe(8192);
      expect(flashCalc.perRequestCap).toBe(8192);
      expect(flashCalc.effectiveMaxTokens).toBe(8192); // Not 160,000!

      // Case 2: Cerebras model has physical max output of 4,096 tokens
      const cerebrasCalc = TokenBudgetManager.calculatePerRequestBudget(
        "gpt-oss-120b",
        2000, // prompt leaves 6,000 headroom in 8,000 context
        32768, // caller requested 32k
        160000 // remaining cumulative budget
      );
      expect(cerebrasCalc.modelMaxOutput).toBe(4096);
      expect(cerebrasCalc.perRequestCap).toBe(4096);
      expect(cerebrasCalc.effectiveMaxTokens).toBe(4096); // Clamped to model physical cap

      // Case 2b: When prompt is large, context headroom constrains output below modelMaxOutput
      const cerebrasConstrained = TokenBudgetManager.calculatePerRequestBudget(
        "gpt-oss-120b",
        5000, // prompt leaves only 3,000 headroom in 8,000 context
        32768,
        160000
      );
      expect(cerebrasConstrained.contextHeadroom).toBe(3000);
      expect(cerebrasConstrained.perRequestCap).toBe(3000); // Clamped by context headroom!

      // Case 3: Groq has tight context (4,500 prompt tokens)
      const groqCalc = TokenBudgetManager.calculatePerRequestBudget(
        "groq",
        3500, // large prompt on Groq leaves only 1,000 context tokens
        undefined,
        160000
      );
      expect(groqCalc.contextHeadroom).toBe(1000);
      expect(groqCalc.effectiveMaxTokens).toBe(1000); // Clamped to context headroom
    });

    it("8. Clamps requested output to the remaining cumulative budget when remaining is smaller than model cap", () => {
      // Model cap is 8,192, but only 2,500 tokens remain in cumulative budget
      const calc = TokenBudgetManager.calculatePerRequestBudget(
        "gemini-3.6-flash",
        5000,
        undefined,
        2500 // Only 2,500 remaining in cumulative budget
      );
      expect(calc.effectiveMaxTokens).toBe(2500); // Strictly clamped to cumulative remaining
    });

    it("10. Total generation output is reconciled across multiple requests (metered and unmetered)", async () => {
      const guard = GenerationBudgetGuard.getInstance();
      guard.acquireGenerationLock("gen_reconcile_test");
      guard.configure({
        maxRequests: 10,
        maxPromptTokens: 50000,
        maxCompletionTokens: 20000,
      });

      // Request 1: Metered provider reporting usage
      const mockMetered = new DeterministicMockProvider("gemini-3.6-flash");
      mockMetered.promptUsage = 2000;
      mockMetered.completionUsage = 1200;

      const failover = new FailoverProvider([mockMetered]);
      await failover.chat([{ role: "user", content: "Build navigation component" }]);

      expect(guard.getStatus().requestCount).toBe(1);
      expect(guard.getStatus().promptTokens).toBe(2000);
      expect(guard.getStatus().completionTokens).toBe(1200);
      expect(guard.getStatus().remainingCompletionTokens).toBe(18800);

      // Request 2: Unmetered provider (no usage reported in response metadata)
      const mockUnmetered = new DeterministicMockProvider("openrouter");
      mockUnmetered.reportUsage = false; // Simulates provider without metadata
      mockUnmetered.responses = ["// 800 characters of dense code\n".padEnd(800, "x")];

      const failoverUnmetered = new FailoverProvider([mockUnmetered]);
      await failoverUnmetered.chat([{ role: "user", content: "Build card component" }]);

      // Verify unmetered usage was conservatively estimated and recorded into budget
      expect(guard.getStatus().requestCount).toBe(2);
      expect(guard.getStatus().completionTokens).toBeGreaterThan(1200);
      expect(guard.getStatus().remainingCompletionTokens).toBeLessThan(18800);
    });

    it("11. Budget exhaustion stops safely fail-closed with BudgetExceededError", async () => {
      const guard = GenerationBudgetGuard.getInstance();
      guard.acquireGenerationLock("gen_exhaust_test");
      guard.configure({
        maxRequests: 2,
        maxPromptTokens: 20000,
        maxCompletionTokens: 1000,
      });

      const mock = new DeterministicMockProvider("gemini-3.6-flash");
      mock.promptUsage = 1000;
      mock.completionUsage = 800; // Leaves only 200 tokens

      const failover = new FailoverProvider([mock]);
      await failover.chat([{ role: "user", content: "First task" }]);

      mock.completionUsage = 300; // Will breach the remaining 200
      await failover.chat([{ role: "user", content: "Second task" }]);

      // Attempting a third request must fail immediately with BudgetExceededError
      await expect(
        failover.chat([{ role: "user", content: "Third task exceeds" }])
      ).rejects.toThrow(BudgetExceededError);

      expect(guard.getStatus().isHalted).toBe(true);
    });

    it("12. Separate generations do not share budget state (clean isolation)", () => {
      const guard = GenerationBudgetGuard.getInstance();

      // Generation 1: Fullstack run consumes tokens
      guard.acquireGenerationLock("gen_run_alpha");
      guard.adaptiveConfigureForProject("fullstack");
      guard.recordRequest();
      guard.recordUsage(50000, 15000);

      const status1 = guard.getStatus();
      expect(status1.requestCount).toBe(1);
      expect(status1.completionTokens).toBe(15000);
      expect(status1.remainingCompletionTokens).toBe(145000);

      guard.releaseGenerationLock("gen_run_alpha");

      // Generation 2: Separate new run must start with pristine budget counters
      guard.acquireGenerationLock("gen_run_beta");
      guard.adaptiveConfigureForProject("standard");

      const status2 = guard.getStatus();
      expect(status2.requestCount).toBe(0);
      expect(status2.promptTokens).toBe(0);
      expect(status2.completionTokens).toBe(0);
      expect(status2.remainingCompletionTokens).toBe(80000); // Clean 80k for standard
    });
  });

  // ── 4. Complex Multi-Task Project Simulation ───────────────────────────────
  describe("4. Complex Multi-Task Generation Lifecycle Simulation", () => {
    it("executes a 6-task full-stack generation DAG cleanly within adaptive fullstack budget without mid-run exhaustion", async () => {
      const guard = GenerationBudgetGuard.getInstance();
      const genId = guard.acquireGenerationLock("gen_appointment_simulation");

      // 1. Initial Prompt Estimation
      guard.adaptiveConfigureForProject(
        "Create a modern, full-stack appointment booking and scheduling platform with Express REST APIs, Prisma SQLite database, User, Service, Appointment models, and double-booking prevention"
      );

      // Verify that fullstack budget was assigned
      expect(guard.getStatus().remainingRequests).toBe(75);
      expect(guard.getStatus().remainingCompletionTokens).toBe(160000);

      // 2. Stage 2 Contract Locking
      const lockedContractFixture = {
        applicationType: "FULLSTACK_WEB_APPLICATION",
        frontend: { framework: "React-Vite" },
        backend: { framework: "Express" },
        database: { provider: "SQLite", orm: "Prisma" },
        requiredFeatures: [
          "Authentication & Authorization System",
          "Landing Page & Filterable Service Catalog",
          "Interactive Time-Slot Availability Calendar",
          "Multi-Step Booking Wizard with Double-Booking Prevention",
          "Customer Booking History & Cancellation Dashboard",
          "Admin Business Analytics & Performance Dashboard",
          "Admin Service CRUD & Appointment Management"
        ],
        requiredRoutes: ["/", "/services", "/select-slot", "/complete-booking", "/appointments", "/admin-analytics", "/service-crud"],
        requiredModels: ["User", "Service", "Appointment", "Availability", "Analytics"],
      };

      guard.adaptiveConfigureForProject(lockedContractFixture);
      expect(guard.getStatus().remainingCompletionTokens).toBe(160000);

      // 3. Simulate multi-task CoderAgent execution across 6 tiers
      const tasks = [
        { id: 1, title: "App Shell, Navigation & Routing" },
        { id: 2, title: "Landing Page Workspace" },
        { id: 3, title: "Filterable Services Catalog" },
        { id: 4, title: "Interactive Availability Calendar & Booking Wizard" },
        { id: 5, title: "Customer Dashboard & Cancellation" },
        { id: 6, title: "Admin Analytics & Service CRUD" },
      ];

      const mockProvider = new DeterministicMockProvider("gemini-3.6-flash");
      mockProvider.promptUsage = 14000;
      mockProvider.completionUsage = 3800; // ~3.8k tokens per task

      const failover = new FailoverProvider([mockProvider]);

      for (const t of tasks) {
        const resp = await failover.chat([
          { role: "system", content: "Coder Agent System Instructions" },
          { role: "user", content: `Implement Task ${t.id}: ${t.title}` }
        ], { agentType: "coder", complexity: 3 });

        expect(resp).toBeDefined();
      }

      // Check cumulative metrics after 6 substantial tasks
      const endStatus = guard.getStatus();
      expect(endStatus.requestCount).toBe(6);
      expect(endStatus.promptTokens).toBe(14000 * 6); // 84,000 prompt tokens
      expect(endStatus.completionTokens).toBe(3800 * 6); // 22,800 completion tokens
      // In the legacy system, 22,800 tokens breached the 20,000 limit and halted at Task 2!
      // In the adaptive system, 22,800 is safely within the 160,000 budget!
      expect(endStatus.remainingCompletionTokens).toBe(160000 - 22800); // 137,200 tokens remaining
      expect(endStatus.isHalted).toBe(false);

      guard.releaseGenerationLock(genId);
    });
  });

  // ── 5. Preservation of Application Requirements Fixture ───────────────────
  describe("5. Application Requirements Preservation (Pilot Fixture Audit)", () => {
    it("preserves all required appointment-booking domain models, features, APIs, and constraints", async () => {
      const { readFileSync, existsSync } = await import("node:fs");
      const { resolve } = await import("node:path");

      const pathA = resolve(process.cwd(), "projects/appointment-booking-pilot/.aegis/architecture-contract.json");
      const pathB = resolve(process.cwd(), "../../projects/appointment-booking-pilot/.aegis/architecture-contract.json");
      const pilotContractPath = existsSync(pathA) ? pathA : pathB;
      expect(existsSync(pilotContractPath)).toBe(true);

      const contractRaw = readFileSync(pilotContractPath, "utf8");
      const contract = JSON.parse(contractRaw);

      // 1. Fullstack Architecture Classification
      expect(contract.applicationType).toBe("FULLSTACK_WEB_APPLICATION");
      expect(contract.backend.framework).toBe("Express");
      expect(contract.database.provider).toBe("SQLite");
      expect(contract.database.orm).toBe("Prisma");
      expect(contract.authentication).toBe("JWT");

      // 2. Preserved Domain Models
      expect(contract.requiredModels).toEqual([
        "User",
        "Service",
        "Appointment",
        "Availability",
        "Analytics"
      ]);

      // 3. Preserved Domain Routes & Workspaces
      expect(contract.requiredRoutes).toEqual([
        "/",
        "/services",
        "/select-slot",
        "/complete-booking",
        "/appointments",
        "/admin-analytics",
        "/service-crud"
      ]);

      // 4. Preserved Domain Features
      expect(contract.requiredFeatures).toContain("landing");
      expect(contract.requiredFeatures).toContain("catalog");
      expect(contract.requiredFeatures).toContain("calendar");
      expect(contract.requiredFeatures).toContain("booking");
      expect(contract.requiredFeatures).toContain("dashboard");
      expect(contract.requiredFeatures).toContain("admin");

      // 5. Adaptive Budget Guard Integration Check
      const guard = GenerationBudgetGuard.getInstance();
      guard.acquireGenerationLock("fixture_validation_run");
      guard.adaptiveConfigureForProject(contract);

      const status = guard.getStatus();
      expect(status.remainingRequests).toBe(75);
      expect(status.remainingPromptTokens).toBe(750000);
      expect(status.remainingCompletionTokens).toBe(160000);

      guard.releaseGenerationLock("fixture_validation_run");
    });
  });
});
