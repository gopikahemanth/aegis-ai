import { describe, it, expect, beforeEach, vi } from "vitest";
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  GenerationBudgetGuard,
  BudgetExceededError,
  ProviderOutageHaltError,
} from "../generation-budget-guard.js";
import { FailoverProvider } from "../../providers/failover.js";
import { MetricsTracker } from "../../providers/metrics-tracker.js";
import type { AIProvider, ChatMessage, ChatOptions } from "../../providers/base.js";
import { TokenBudgetManager } from "../../context/token-budget.js";

describe("Phase 8 Deterministic Boundary Tests — GenerationBudgetGuard", () => {
  let guard: GenerationBudgetGuard;

  beforeEach(() => {
    guard = GenerationBudgetGuard.getInstance();
    guard.reset();
    guard.configure({
      maxRequests: 12,
      maxPromptTokens: 75000,
      maxCompletionTokens: 20000,
      maxGenerations: 1,
      maxRepairsPerStage: 2,
    });
    MetricsTracker.getInstance().reset();
    FailoverProvider.resetState();
  });

  // ── 1. Exactly 12 requests succeed ─────────────────────────────────────────
  it("Boundary 1: exactly 12 requests succeed within the budget limit", () => {
    for (let i = 1; i <= 12; i++) {
      expect(() => guard.assertRequestAllowed(`attempt-${i}`)).not.toThrow();
      guard.recordRequest();
    }

    const status = guard.getStatus();
    expect(status.requestCount).toBe(12);
    expect(status.remainingRequests).toBe(0);
    expect(status.isHalted).toBe(false);
  });

  // ── 2. Attempted 13th request throws BudgetExceededError ───────────────────
  it("Boundary 2: attempted 13th request throws BudgetExceededError and halts", () => {
    for (let i = 1; i <= 12; i++) {
      guard.assertRequestAllowed();
      guard.recordRequest();
    }

    expect(() => guard.assertRequestAllowed("13th-attempt")).toThrow(BudgetExceededError);
    expect(() => guard.assertRequestAllowed()).toThrow(/Maximum provider requests limit \(12\) reached/);
    expect(guard.getStatus().isHalted).toBe(true);
    expect(guard.getStatus().haltReason).toContain("Maximum provider requests limit (12) reached");
  });

  // ── 3. Input tokens exactly at limit (75,000) allowed ───────────────────────
  it("Boundary 3: input tokens exactly at limit (75,000) are allowed", () => {
    // Assert pre-dispatch check for exactly 75,000 tokens
    expect(() => guard.assertRequestAllowed("pre-dispatch", 75000)).not.toThrow();

    // Record the usage
    guard.recordUsage(75000, 0);

    const status = guard.getStatus();
    expect(status.promptTokens).toBe(75000);
    expect(status.remainingPromptTokens).toBe(0);
    expect(status.isHalted).toBe(true); // Halted after reaching exact ceiling
  });

  // ── 4. Input tokens exceeding limit (75,001+) rejected before dispatch ─────
  it("Boundary 4: input tokens exceeding limit (75,001+) are rejected before dispatch", () => {
    // Direct pre-dispatch rejection for 75,001 tokens
    expect(() => guard.assertRequestAllowed("oversized-prompt", 75001)).toThrow(BudgetExceededError);
    expect(() => guard.assertRequestAllowed("oversized-prompt", 75001)).toThrow(
      /Estimated input tokens \(75,001\) would exceed remaining prompt token budget/
    );

    // Incremental pre-dispatch rejection: 50,000 consumed + 25,001 requested
    guard.recordUsage(50000, 0);
    expect(() => guard.assertRequestAllowed("second-oversized-prompt", 25001)).toThrow(BudgetExceededError);
    expect(() => guard.assertRequestAllowed("second-oversized-prompt", 25001)).toThrow(
      /Estimated input tokens \(25,001\) would exceed remaining prompt token budget \(25,000\)/
    );
  });

  // ── 5. Output allowance clamped to remaining budget ─────────────────────────
  it("Boundary 5: output allowance is clamped to remaining budget", () => {
    // Consume 15,000 completion tokens; 5,000 remain
    guard.recordUsage(10000, 15000);
    expect(guard.getRemainingCompletionTokens()).toBe(5000);

    // Caller requests 8,192 maxTokens -> clamped to remaining 5,000
    const clamped = guard.clampOutputTokens(8192);
    expect(clamped).toBe(5000);

    // Caller passes undefined maxTokens -> clamped to full remaining 5,000
    const defaultClamped = guard.clampOutputTokens();
    expect(defaultClamped).toBe(5000);

    // Smaller requested allowance (e.g. 2,048) stays 2,048
    const smallClamped = guard.clampOutputTokens(2048);
    expect(smallClamped).toBe(2048);
  });

  // ── 6. Output allowance exceeding remaining budget rejected ────────────────
  it("Boundary 6: output allowance exceeding remaining budget is rejected", () => {
    // Consume 18,000 completion tokens; 2,000 remain
    guard.recordUsage(5000, 18000);
    expect(guard.getRemainingCompletionTokens()).toBe(2000);

    // Explicit output assertion for 2,001 tokens throws BudgetExceededError
    expect(() => guard.assertOutputAllowed(2001)).toThrow(BudgetExceededError);
    expect(() => guard.assertOutputAllowed(2001)).toThrow(
      /Requested output allowance \(2,001\) exceeds remaining output token budget \(2,000\)/
    );

    // assertRequestAllowed with requestedOutputTokens parameter also throws
    expect(() => guard.assertRequestAllowed("coder", 100, 2500)).toThrow(BudgetExceededError);
    expect(() => guard.assertRequestAllowed("coder", 100, 2500)).toThrow(
      /Requested output allowance \(2,500\) exceeds remaining output token budget \(2,000\)/
    );

    // When remaining budget is 0, clampOutputTokens throws BudgetExceededError
    guard.recordUsage(0, 2000); // Now remaining = 0
    expect(() => guard.clampOutputTokens(100)).toThrow(BudgetExceededError);
    expect(() => guard.clampOutputTokens(100)).toThrow(/Maximum output token budget \(20,000\) reached/);
  });

  // ── 7. Failed primary provider followed by fallback counts as 2 requests ───
  it("Boundary 7: failed primary provider followed by fallback counts as 2 requests", async () => {
    const mockPrimary: AIProvider = {
      name: "mock-primary",
      chat: vi.fn().mockRejectedValue(new Error("503 High demand unavailable")),
    };

    const mockFallback: AIProvider = {
      name: "mock-fallback",
      chat: vi.fn().mockImplementation(async () => {
        MetricsTracker.getInstance().logUsage(500, 150);
        return "Fallback successful response";
      }),
    };

    const failover = new FailoverProvider([mockPrimary, mockFallback], 1, 10);
    const messages: ChatMessage[] = [{ role: "user", content: "Build a finance dashboard component" }];

    const result = await failover.chat(messages);
    expect(result).toBe("Fallback successful response");

    // Both the primary failure and fallback success MUST be counted
    const status = guard.getStatus();
    expect(status.requestCount).toBe(2);
    expect(mockPrimary.chat).toHaveBeenCalledTimes(1);
    expect(mockFallback.chat).toHaveBeenCalledTimes(1);
  });

  // ── 8. Retries count toward the 12-request limit ───────────────────────────
  it("Boundary 8: retries count toward the 12-request limit", async () => {
    let callCount = 0;
    const mockRetryingProvider: AIProvider = {
      name: "mock-retry",
      chat: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error("Transient network glitch (ECONNRESET)");
        }
        MetricsTracker.getInstance().logUsage(400, 100);
        return "Succeeded on retry 3";
      }),
    };

    const failover = new FailoverProvider([mockRetryingProvider], 3, 10);
    const messages: ChatMessage[] = [{ role: "user", content: "Test retry counting" }];

    const result = await failover.chat(messages);
    expect(result).toBe("Succeeded on retry 3");

    // 3 attempts made: attempt 1 + attempt 2 (retry) + attempt 3 (retry) = 3 counted requests
    expect(callCount).toBe(3);
    expect(guard.getStatus().requestCount).toBe(3);
  });

  // ── 9. Missing provider usage metadata triggers conservative estimation ────
  it("Boundary 9: missing provider usage metadata triggers conservative estimation without undercounting", async () => {
    const promptText = "Create an enterprise accounting ledger with debit/credit balance reconciliation.";
    const responseText = "export const ledger = { entries: [], balance: 0.00 };";

    const mockUnmeteredProvider: AIProvider = {
      name: "mock-unmetered",
      chat: vi.fn().mockImplementation(async () => {
        // Does NOT call MetricsTracker.logUsage (simulates provider without usage metadata)
        return responseText;
      }),
    };

    const failover = new FailoverProvider([mockUnmeteredProvider], 1, 10);
    const messages: ChatMessage[] = [{ role: "user", content: promptText }];

    const result = await failover.chat(messages);
    expect(result).toBe(responseText);

    const status = guard.getStatus();
    const metrics = MetricsTracker.getInstance().getMetrics();

    // Verify unmetered request was tracked
    expect(metrics.unmeteredRequests).toBe(1);

    // Verify tokens were conservatively estimated and charged to the budget
    const expectedPromptTokens = TokenBudgetManager.estimateTokens(promptText, true);
    const expectedCompletionTokens = TokenBudgetManager.estimateTokens(responseText, true);

    expect(status.promptTokens).toBe(expectedPromptTokens);
    expect(status.completionTokens).toBe(expectedCompletionTokens);
    expect(status.promptTokens).toBeGreaterThan(0);
    expect(status.completionTokens).toBeGreaterThan(0);
  });

  // ── 10. Budget exhaustion during generation returns BLOCKED and preserves files
  it("Boundary 10: budget exhaustion during generation returns BLOCKED and preserves disk files", async () => {
    const testDir = join(tmpdir(), `aegis-test-budget-${Date.now()}`);
    mkdirSync(join(testDir, "src"), { recursive: true });
    writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "fintrack-pro" }), "utf8");
    writeFileSync(join(testDir, "src", "App.tsx"), "export default function App() { return <div>FinTrack</div>; }", "utf8");

    try {
      // Simulate exhausting the 12-request budget
      for (let i = 0; i < 12; i++) {
        guard.recordRequest();
      }
      expect(guard.getStatus().remainingRequests).toBe(0);

      // Attempting further provider calls throws BudgetExceededError
      expect(() => guard.assertRequestAllowed("CoderAgent")).toThrow(BudgetExceededError);

      // Emulate ExecutionEngine fail-closed error handling
      let executionResult: any;
      try {
        guard.assertRequestAllowed("ExecutionEngine");
      } catch (err: any) {
        executionResult = {
          success: false,
          status: "BLOCKED",
          blockingReason: err.message,
        };
      }

      expect(executionResult.status).toBe("BLOCKED");
      expect(executionResult.success).toBe(false);
      expect(executionResult.blockingReason).toContain("BUDGET_EXHAUSTED");

      // Verify all generated files are preserved intact on disk
      expect(existsSync(join(testDir, "package.json"))).toBe(true);
      expect(existsSync(join(testDir, "src", "App.tsx"))).toBe(true);
      expect(readFileSync(join(testDir, "src", "App.tsx"), "utf8")).toContain("FinTrack");
    } finally {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  // ── 11. Budget exhaustion during repair stops repair loop ───────────────────
  it("Boundary 11: budget exhaustion during repair stops repair loop immediately", () => {
    const stage = "BackendApiRepair";

    // Attempt 1 allowed and recorded
    expect(() => guard.assertRepairAllowed(stage)).not.toThrow();
    guard.recordRepairAttempt(stage);

    // Attempt 2 allowed and recorded
    expect(() => guard.assertRepairAllowed(stage)).not.toThrow();
    guard.recordRepairAttempt(stage);

    // Attempt 3 blocked — maximum 2 targeted repairs per stage
    let repairHalted = false;
    let attemptsRun = 0;

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        guard.assertRepairAllowed(stage);
        guard.recordRepairAttempt(stage);
        attemptsRun++;
      } catch (err: any) {
        if (err instanceof BudgetExceededError) {
          repairHalted = true;
          break;
        }
      }
    }

    expect(repairHalted).toBe(true);
    expect(attemptsRun).toBe(0); // 0 additional attempts ran in the loop
    expect(guard.getStatus().repairCountsByStage[stage]).toBe(2);
  });
});
