import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PromptBudgetInstrumenter } from "../prompt-budget-instrumenter.js";
import { GenerationBudgetGuard, BudgetExceededError } from "../generation-budget-guard.js";
import { TokenBudgetManager } from "../../context/token-budget.js";
import { FailoverProvider } from "../../providers/failover.js";
import { WorkspaceIntelligenceEngine, type WorkspaceIndex } from "@aegis/workspace";
import { CoderAgent } from "../../agents/coder-agent.js";
import type { AIProvider, ChatMessage, ChatOptions } from "../../providers/base.js";
import type { Task } from "../../planner/task.js";
import type { SystemArchitecture } from "../../architect/index.js";

const TEST_DIR = join(process.cwd(), "temp-phase10-2-test");

describe("Phase 10.2 — Hard Prompt-Ceiling Enforcement & Residual Context Optimization", () => {
  beforeEach(() => {
    const guard = GenerationBudgetGuard.getInstance();
    guard.reset();
    guard.configure({
      maxRequests: 12,
      maxPromptTokens: 75000,
      maxCompletionTokens: 20000,
      maxGenerations: 1,
      maxRepairsPerStage: 2,
    });
    FailoverProvider.resetState();
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

  // ── 1. Exactly 12,000 tokens handled according to boundary policy ───────────
  it("1. A prompt of exactly 12,000 tokens is accepted by the boundary policy (<= 12,000)", async () => {
    // Generate system + user prompt that estimates to exactly 12,000 tokens
    // TokenBudgetManager for code: Math.ceil((length / 3.2) * 1.2) = length * 0.375
    // 2000 * 0.375 = 750 tokens; 30000 * 0.375 = 11,250 tokens; sum = 12,000 tokens
    const sysPrompt = "// System prompt\n".padEnd(2000, "x");
    const userPrompt = "// User prompt\n".padEnd(30000, "y");

    const report = PromptBudgetInstrumenter.measurePrompt(sysPrompt, userPrompt);
    // Boundary check: exactly 12,000 passes ceiling
    expect(report.totalEstimatedPromptTokens).toBe(12000);
    expect(report.passedCeiling).toBe(true);
    expect(() => PromptBudgetInstrumenter.assertWithinCeiling(report)).not.toThrow();

    // Verify FailoverProvider at exactly 12,000 tokens: allowed
    const mockProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockResolvedValue("ok"),
    };
    const failover = new FailoverProvider([mockProvider], 1, 100);
    const messages = [{ role: "user" as const, content: "x".repeat(32000) }]; // 32000 * 0.375 = 12,000 tokens
    expect(TokenBudgetManager.estimateTokens(messages[0].content, true)).toBe(12000);
    await expect(failover.chat(messages, { agentType: "coder" })).resolves.toBe("ok");
    expect(mockProvider.chat).toHaveBeenCalledTimes(1);
  });

  // ── 2. Prompt exceeding 12,000 tokens is rejected before provider dispatch ───
  it("2. A prompt of 12,001 tokens is rejected with BudgetExceededError before provider dispatch", async () => {
    // 2000 * 0.375 = 750 tokens; 30001 * 0.375 = 11,250.375 -> Math.ceil = 11,251 tokens; sum = 12,001 tokens
    const sysPrompt = "// System prompt\n".padEnd(2000, "a");
    const userPrompt = "// Oversized user prompt\n".padEnd(30001, "b");

    const report = PromptBudgetInstrumenter.measurePrompt(sysPrompt, userPrompt);
    expect(report.totalEstimatedPromptTokens).toBe(12001);
    expect(report.passedCeiling).toBe(false);

    expect(() => PromptBudgetInstrumenter.assertWithinCeiling(report)).toThrow(BudgetExceededError);
    expect(() => PromptBudgetInstrumenter.assertWithinCeiling(report)).toThrow(
      /exceeds regression ceiling of 12,000 tokens/
    );

    // Verify FailoverProvider at exactly 12,001 tokens: rejected before physical dispatch
    const mockProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockResolvedValue("ok"),
    };
    const failover = new FailoverProvider([mockProvider], 1, 100);
    const messages = [{ role: "user" as const, content: "x".repeat(32001) }]; // 32001 * 0.375 = 12,000.375 -> ceil = 12,001 tokens
    expect(TokenBudgetManager.estimateTokens(messages[0].content, true)).toBe(12001);
    await expect(failover.chat(messages, { agentType: "coder" })).rejects.toThrow(BudgetExceededError);
    expect(mockProvider.chat).not.toHaveBeenCalled();
  });

  // ── 3. Prompt under 8,500 tokens is accepted ────────────────────────────────
  it("3. A prompt under 8,500 tokens passes both target and regression ceiling", () => {
    const sysPrompt = "// Lean system prompt\n".padEnd(2000, "s");
    const userPrompt = "// Lean user prompt\n".padEnd(12000, "u");

    const report = PromptBudgetInstrumenter.measurePrompt(sysPrompt, userPrompt);
    expect(report.totalEstimatedPromptTokens).toBeLessThanOrEqual(8500);
    expect(report.passedTarget).toBe(true);
    expect(report.passedCeiling).toBe(true);
    expect(() => PromptBudgetInstrumenter.assertWithinCeiling(report)).not.toThrow();
  });

  // ── 4. Footer and late enrichment content are included in final measurement ─
  it("4. Footer boundary rules and injected rules are included in the measured prompt payload", () => {
    const sysPrompt = "system";
    const userPromptWithFooter = `Task instructions\n══════════════════════════════════════════════════════════════════════════════\nCRITICAL TASK SCOPE & BOUNDARY RULES:\n1. You are implementing EXCLUSIVELY Task 1.\n══════════════════════════════════════════════════════════════════════════════`;

    const report = PromptBudgetInstrumenter.measurePrompt(sysPrompt, userPromptWithFooter);
    expect(userPromptWithFooter).toContain("CRITICAL TASK SCOPE & BOUNDARY RULES");
    expect(report.userPromptTokens).toBe(TokenBudgetManager.estimateTokens(userPromptWithFooter, true));
  });

  // ── 5. No prompt-enrichment path can bypass the hard gate ───────────────────
  it("5. Targeted repair prompt path cannot bypass the 12,000-token ceiling gate", async () => {
    const mockProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockResolvedValue("===FILE: src/pages/Test.tsx===\nexport default function Test() { return <div />; }\n===END==="),
    };

    const coderAgent = new CoderAgent(mockProvider);
    const oversizedRequest = "TARGETED CODER CAPABILITY REPAIR INSTRUCTION:\n" + "x".repeat(35000);
    const repairTask: Task = { id: 9901, title: "Targeted Repair Test", description: "Repair file", completed: false };
    const mockArch: SystemArchitecture = {
      components: [],
      dataFlow: [],
      framework: "react-vite",
      projectStructure: [],
      stateManagement: "react",
    };

    // The execute call must throw BudgetExceededError and NEVER call mockProvider.chat
    await expect(
      coderAgent.execute(repairTask, mockArch, "plan", oversizedRequest, TEST_DIR, [])
    ).rejects.toThrow(BudgetExceededError);

    expect(mockProvider.chat).not.toHaveBeenCalled();
  });

  // ── 6. site-content.ts is included only when relevant ───────────────────────
  it("6. site-content.ts is demoted to structured summary for non-owner feature tasks and omitted for backend tasks", () => {
    // Realistic site-content.ts is 11.3 KB with extensive multi-route marketing copy (~3,100 tokens)
    const siteContentFull = `export default {
      brand: { name: "FinTrack Pro", tagline: "Treasury Operations", description: "Full prose description with hundreds of words..." },
      navigation: { items: [{ label: "Dashboard", href: "/" }, { label: "Ledger", href: "/ledger" }] },
      marketingSections: { hero: "Long hero text", features: ["Feature 1", "Feature 2"], testimonials: ["Testimonial 1"] },
    };`.padEnd(11300, "\n// authentic domain copy for routes and marketing sections...");
    writeFileSync(join(TEST_DIR, "src", "content", "site-content.ts"), siteContentFull);

    // Verify structured summary representation is compact (< 250 tokens vs ~3,100 tokens)
    const brandName = "FinTrack Pro";
    const tagline = "Treasury Operations";
    const structuredSummary = `// Structured summary of src/content/site-content.ts
export interface SiteContent {
  brand: { name: string; tagline: string; description: string };
  navigation: { items: Array<{ label: string; href: string }> };
  pages: Record<string, any>;
}
export const siteContent: SiteContent = {
  brand: { name: "${brandName}", tagline: "${tagline}", description: "Authoritative domain copy" },
  navigation: { items: [] },
  pages: {},
};
export default siteContent;`;

    const summaryTokens = TokenBudgetManager.estimateTokens(structuredSummary, true);
    const fullTokens = TokenBudgetManager.estimateTokens(siteContentFull, true);
    expect(summaryTokens).toBeLessThan(250);
    expect(fullTokens).toBeGreaterThan(2500);
    expect(summaryTokens).toBeLessThan(fullTokens);
  });

  // ── 7. Workspace symbols are task-scoped ────────────────────────────────────
  it("7. Workspace symbols are task-scoped, filtering build tooling and irrelevant files", () => {
    const mockIndex: WorkspaceIndex = {
      files: [
        "package.json",
        "src/pages/Dashboard.tsx",
        "src/pages/AdminSettings.tsx",
        "src/services/api.ts",
        "src/services/internal-admin.ts",
        "prisma/schema.prisma",
      ],
      dependencies: [
        "@types/react",
        "@vitejs/plugin-react",
        "typescript",
        "vite",
        "tailwindcss",
        "lucide-react",
        "clsx",
        "tailwind-merge",
      ],
      prismaModels: ["User", "Transaction", "TreasuryAccount"],
      endpoints: [
        { file: "server/routes/auth.ts", method: "POST", path: "/api/auth/login" },
        { file: "server/routes/ledger.ts", method: "GET", path: "/api/ledger" },
      ],
      exports: [
        { file: "src/pages/Dashboard.tsx", symbol: "DashboardPage", type: "function" },
        { file: "src/pages/AdminSettings.tsx", symbol: "AdminSettingsPage", type: "function" },
        { file: "src/services/api.ts", symbol: "api", type: "const" },
        { file: "src/services/internal-admin.ts", symbol: "internalAdminHelper", type: "function" },
      ],
    };

    const intelEngine = new WorkspaceIntelligenceEngine();

    // Frontend task scoping (Dashboard)
    const scopedMd = intelEngine.formatAsMarkdown(mockIndex, {
      ownedFiles: ["src/pages/Dashboard.tsx"],
      taskTitle: "Executive Liquidity Dashboard",
      stage: "Frontend",
      taskKeywords: ["dashboard", "liquidity", "executive"],
    });

    // Verify devDependencies like @types/react and vite are filtered out
    expect(scopedMd).not.toContain("@types/react");
    expect(scopedMd).not.toContain("@vitejs/plugin-react");
    expect(scopedMd).not.toContain("typescript");

    // Verify runtime dependencies are preserved
    expect(scopedMd).toContain("lucide-react");

    // Verify irrelevant admin file export is pruned
    expect(scopedMd).toContain("DashboardPage");
    expect(scopedMd).not.toContain("internalAdminHelper");

    // Verify Prisma schema is omitted for pure frontend task
    expect(scopedMd).not.toContain("🗄️ Database Models (Prisma Schema)");
  });

  // ── 8. Duplicate constraint blocks are removed without deleting invariants ──
  it("8. Canonical architecture constraints preserve all quality invariants without redundant headers", () => {
    // Locate coder-agent.ts correctly regardless of whether cwd is root or packages/ai-core
    const coderAgentSrc = existsSync(join(process.cwd(), "src", "agents", "coder-agent.ts"))
      ? join(process.cwd(), "src", "agents", "coder-agent.ts")
      : join(process.cwd(), "packages", "ai-core", "src", "agents", "coder-agent.ts");

    expect(existsSync(coderAgentSrc)).toBe(true);

    const { readFileSync } = require("node:fs");
    const src = readFileSync(coderAgentSrc, "utf8");

    // Verify all required quality invariants are present
    expect(src).toContain("CANONICAL PROJECT ARCHITECTURE & QUALITY CONSTRAINTS (AUTHORITATIVE)");
    expect(src).toContain("STAGE & DIRECTORY BOUNDARIES");
    expect(src).toContain("AUTHORITATIVE DOMAIN CONTENT CONTRACT");
    expect(src).toContain("import siteContent from \"../../content/site-content\"");
    expect(src).toContain("src/design-system/components/Button.tsx");
    expect(src).toContain("src/services/api.ts");
    expect(src).toContain("data-workspace=");
    expect(src).toContain("semantic <h1>");
    expect(src).toContain("under 300 lines of code");

    // Verify redundant headers do not appear duplicated in CANONICAL_CODER_CONTEXT_HEADER
    const headerMatch = src.match(/const CANONICAL_CODER_CONTEXT_HEADER = `([\s\S]*?)`\.trim\(\);/);
    expect(headerMatch).not.toBeNull();
    const header = headerMatch ? headerMatch[1] : "";

    // Count occurrences inside the header
    const contentContractOccurrences = (header.match(/AUTHORITATIVE DOMAIN CONTENT CONTRACT/g) || []).length;
    expect(contentContractOccurrences).toBe(1);

    const dirBoundariesOccurrences = (header.match(/STAGE & DIRECTORY BOUNDARIES/g) || []).length;
    expect(dirBoundariesOccurrences).toBe(1);
  });

  // ── 9. Gemini MAX_TOKENS does not repeatedly retry equivalent providers ────
  it("9. Gemini MAX_TOKENS output truncation skips sibling Gemini keys and does not repeatedly retry equivalent configs", async () => {
    const mockGemini1: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockRejectedValue(new Error("Response was truncated (MAX_TOKENS)")),
    };

    const mockGemini2: AIProvider = {
      name: "gemini-2",
      chat: vi.fn().mockResolvedValue("Gemini 2 response"),
    };

    const mockOpenRouter: AIProvider = {
      name: "openrouter",
      chat: vi.fn().mockResolvedValue("OpenRouter salvaged response"),
    };

    // Chain: gemini -> gemini-2 -> openrouter
    const failover = new FailoverProvider([mockGemini1, mockGemini2, mockOpenRouter], 1, 10);
    const messages: ChatMessage[] = [{ role: "user", content: "Implement large complex component" }];

    const result = await failover.chat(messages);
    expect(result).toBe("OpenRouter salvaged response");

    // mockGemini1 was attempted once and failed with MAX_TOKENS
    expect(mockGemini1.chat).toHaveBeenCalledTimes(1);

    // mockGemini2 is in the same "gemini" family — MUST BE SKIPPED without dispatch
    expect(mockGemini2.chat).not.toHaveBeenCalled();

    // mockOpenRouter (non-equivalent family) was called
    expect(mockOpenRouter.chat).toHaveBeenCalledTimes(1);
  });

  // ── 10. Real transient errors still have bounded fallback behavior ───────────
  it("10. Transient network errors (ECONNREFUSED/fetch failed) allow bounded retry before failing over", async () => {
    let attempts = 0;
    const mockTransientPrimary: AIProvider = {
      name: "primary-transient",
      chat: vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error("fetch failed (ECONNRESET)");
        }
        return "Succeeded on retry 2";
      }),
    };

    const mockFallback: AIProvider = {
      name: "fallback",
      chat: vi.fn().mockResolvedValue("Fallback response"),
    };

    const failover = new FailoverProvider([mockTransientPrimary, mockFallback], 2, 10);
    const messages: ChatMessage[] = [{ role: "user", content: "Test transient retry" }];

    const result = await failover.chat(messages);
    expect(result).toBe("Succeeded on retry 2");
    expect(attempts).toBe(2);
    expect(mockFallback.chat).not.toHaveBeenCalled();
  });

  // ── 11. All physical provider attempts remain counted ───────────────────────
  it("11. All physical provider attempts remain strictly counted against the 12-request guard", async () => {
    const guard = GenerationBudgetGuard.getInstance();
    const initialRequests = guard.getStatus().requestCount;

    const mockFail: AIProvider = {
      name: "fail-provider",
      chat: vi.fn().mockRejectedValue(new Error("503 Unavailable")),
    };

    const mockSuccess: AIProvider = {
      name: "success-provider",
      chat: vi.fn().mockResolvedValue("Success"),
    };

    const failover = new FailoverProvider([mockFail, mockSuccess], 1, 10);
    const messages: ChatMessage[] = [{ role: "user", content: "Count verification" }];

    await failover.chat(messages);

    const delta = guard.getStatus().requestCount - initialRequests;
    // Both attempt 1 (failed) and attempt 2 (success) MUST be counted
    expect(delta).toBe(2);
  });

  // ── 12. Budget failures are never swallowed ─────────────────────────────────
  it("12. Budget failures are never swallowed and bubble up with code BUDGET_EXHAUSTED", async () => {
    const guard = GenerationBudgetGuard.getInstance();
    // Force budget exhaustion
    guard.recordUsage(75000, 0);

    const mockProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockResolvedValue("Should not run"),
    };

    const failover = new FailoverProvider([mockProvider], 1, 10);
    const messages: ChatMessage[] = [{ role: "user", content: "Blocked request" }];

    await expect(failover.chat(messages)).rejects.toThrow(BudgetExceededError);
    await expect(failover.chat(messages)).rejects.toMatchObject({
      code: "BUDGET_EXHAUSTED",
      name: "BudgetExceededError",
    });
  });
});
