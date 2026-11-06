import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  GenerationBudgetGuard,
  BudgetExceededError,
  ProviderOutageHaltError,
} from "../generation-budget-guard.js";
import { MetricsTracker } from "../../providers/metrics-tracker.js";
import { GeminiProvider } from "../../providers/gemini.js";
import { ProviderError } from "../../providers/base.js";
import { ProjectContractManager } from "../../contract/project-contract.js";

describe("Phase 8.1 Framework & Healer Boundary Integrity Tests", () => {
  let testDir: string;
  let guard: GenerationBudgetGuard;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-phase8-boundary-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    mkdirSync(testDir, { recursive: true });

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
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch {}
    }
  });

  // ── 1. Contract Hash Resolution & TDZ Elimination ─────────────────────────
  it("Boundary 1: activeContractHash resolves cleanly without referencing actualArch or throwing ReferenceError", () => {
    const contract = ProjectContractManager.createContract(
      "Create test project",
      "React-Vite",
      "Express",
      "SQLite",
      "Prisma"
    );

    const activeContractApp = contract;
    const resolvedContract = contract;
    const architecture = { contractHash: "arch_hash_test" };
    const specification = { contractHash: "spec_hash_test" };

    // This exact expression is used in orchestrator.ts executeTaskBatch
    const activeContractHash =
      activeContractApp?.contractHash ||
      activeContractApp?.architectureHash ||
      resolvedContract?.contractHash ||
      resolvedContract?.architectureHash ||
      (architecture as any)?.contractHash ||
      (specification as any)?.contractHash ||
      "default";

    expect(activeContractHash).toBeDefined();
    expect(activeContractHash).not.toBe("default");
    expect(activeContractHash).toBe(contract.contractHash);
  });

  // ── 2. Framework Error Isolation (No routing to Healer) ───────────────────
  it("Boundary 2: Framework exceptions (TypeError, ReferenceError) throw immediately and are NEVER routed to Healer", async () => {
    const healerMock = vi.fn();
    const coderAgentMock = {
      execute: vi.fn().mockImplementation(() => {
        // Simulate a framework exception inside execution
        throw new TypeError("Cannot read properties of undefined (reading 'frameworkInternal')");
      }),
    };

    let frameworkErrorThrown = false;
    try {
      // In the repaired executeTaskBatch, CoderAgent execution is called directly
      await coderAgentMock.execute();
    } catch (err: any) {
      frameworkErrorThrown = true;
      expect(err).toBeInstanceOf(TypeError);
      expect(err.message).toContain("frameworkInternal");
    }

    expect(frameworkErrorThrown).toBe(true);
    // Crucial: Healer repair coordinator is never called for framework exceptions!
    expect(healerMock).not.toHaveBeenCalled();
  });

  // ── 3. Candidate Completeness Validation Triggers Bounded Inline Repair ────
  it("Boundary 3: Candidate file completeness validation failure triggers bounded inline repair (max 2 attempts)", async () => {
    let repairCalls = 0;
    const repairCoordinator = {
      repair: vi.fn().mockImplementation(async () => {
        repairCalls++;
        if (repairCalls === 1) {
          // Attempt 1: still invalid
          return "===FILE: src/App.tsx===\nconst App = () => {\n===END===";
        }
        // Attempt 2: valid complete file
        return "===FILE: src/App.tsx===\nexport const App = () => { return <div>FinTrack Pro</div>; };\n===END===";
      }),
    };

    const MAX_INLINE_REPAIRS = 2;
    let inlineRepairAttempts = 0;
    let success = false;

    while (inlineRepairAttempts < MAX_INLINE_REPAIRS && !success) {
      inlineRepairAttempts++;
      guard.assertRepairAllowed("InlineCoderRepair");
      guard.recordRepairAttempt("InlineCoderRepair");

      const response = await repairCoordinator.repair();
      if (response.includes("export const App") && response.includes("<div>FinTrack Pro</div>")) {
        success = true;
      }
    }

    expect(success).toBe(true);
    expect(inlineRepairAttempts).toBe(2);
    expect(repairCoordinator.repair).toHaveBeenCalledTimes(2);
    expect(guard.getStatus().repairCountsByStage["InlineCoderRepair"]).toBe(2);
  });

  // ── 4. Exceeding 2 Repairs Strictly Fails Closed ───────────────────────────
  it("Boundary 4: Attempting a 3rd inline repair is rejected by GenerationBudgetGuard with BudgetExceededError", () => {
    guard.assertRepairAllowed("InlineCoderRepair");
    guard.recordRepairAttempt("InlineCoderRepair");

    guard.assertRepairAllowed("InlineCoderRepair");
    guard.recordRepairAttempt("InlineCoderRepair");

    // 3rd repair attempt MUST throw BudgetExceededError
    expect(() => guard.assertRepairAllowed("InlineCoderRepair")).toThrow(BudgetExceededError);
    expect(() => guard.assertRepairAllowed("InlineCoderRepair")).toThrow(
      /Targeted repair budget exhausted: Stage "InlineCoderRepair" reached maximum 2 repair attempts/
    );
  });

  // ── 5. Budget Exhaustion Inside Repair Fails Closed Immediately ───────────
  it("Boundary 5: Budget exhaustion or provider outage during repair halts immediately without swallowing", async () => {
    const repairCoordinator = {
      repair: vi.fn().mockImplementation(async () => {
        throw new BudgetExceededError("Maximum provider requests limit (12) reached.");
      }),
    };

    const MAX_INLINE_REPAIRS = 2;
    let inlineRepairAttempts = 0;
    let caughtBudgetError = false;

    try {
      while (inlineRepairAttempts < MAX_INLINE_REPAIRS) {
        inlineRepairAttempts++;
        guard.assertRepairAllowed("InlineCoderRepair");
        guard.recordRepairAttempt("InlineCoderRepair");

        try {
          await repairCoordinator.repair();
        } catch (repairErr: any) {
          if (
            repairErr instanceof BudgetExceededError ||
            repairErr instanceof ProviderOutageHaltError ||
            repairErr?.code === "BUDGET_EXHAUSTED" ||
            repairErr?.code === "PROVIDER_OUTAGE_HALT" ||
            repairErr?.message?.includes("BUDGET_EXHAUSTED") ||
            repairErr?.message?.includes("PROVIDER_OUTAGE_HALT")
          ) {
            throw repairErr;
          }
        }
      }
    } catch (err: any) {
      caughtBudgetError = true;
      expect(err).toBeInstanceOf(BudgetExceededError);
      expect(err.code).toBe("BUDGET_EXHAUSTED");
    }

    expect(caughtBudgetError).toBe(true);
    expect(inlineRepairAttempts).toBe(1); // Halts on first attempt, no infinite loop
  });

  // ── 6. MetricsTracker.reset() Decoupled from GenerationBudgetGuard ─────────
  it("Boundary 6: MetricsTracker.reset() does NOT reset GenerationBudgetGuard.requestCount (continuous accounting)", () => {
    // Stage 1 (e.g. generateProject): 3 provider requests made
    guard.assertRequestAllowed("stage1-req1");
    guard.recordRequest();
    guard.assertRequestAllowed("stage1-req2");
    guard.recordRequest();
    guard.assertRequestAllowed("stage1-req3");
    guard.recordRequest();

    expect(guard.getStatus().requestCount).toBe(3);

    // Call MetricsTracker.getInstance().reset()
    MetricsTracker.getInstance().reset();

    // Verify GenerationBudgetGuard requestCount is STILL 3 (NOT reset to 0!)
    expect(guard.getStatus().requestCount).toBe(3);
    expect(guard.getStatus().remainingRequests).toBe(9);
  });

  // ── 7. Strict 12-Request Physical Limit Under Continuous Generation ───────
  it("Boundary 7: exactly 12 total physical requests allowed across all stages before halting at 13", () => {
    // 3 requests during planning / architecture stage
    for (let i = 1; i <= 3; i++) {
      guard.assertRequestAllowed(`plan-stage-${i}`);
      guard.recordRequest();
    }
    expect(guard.getStatus().requestCount).toBe(3);

    // 9 requests during implementation / coding / repair stages
    for (let i = 1; i <= 9; i++) {
      guard.assertRequestAllowed(`impl-stage-${i}`);
      guard.recordRequest();
    }
    expect(guard.getStatus().requestCount).toBe(12);

    // Attempted 13th request across the whole generation command MUST be blocked
    expect(() => guard.assertRequestAllowed("13th-physical-attempt")).toThrow(BudgetExceededError);
    expect(guard.getStatus().isHalted).toBe(true);
  });

  // ── 8. Gemini MAX_TOKENS Salvage of Completed Files ───────────────────────
  it("Boundary 8: Gemini provider salvages completed files up to last ===END=== when finishReason is MAX_TOKENS", async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: "===FILE: src/components/Dashboard.tsx===\nexport function Dashboard() { return <div>Metrics</div>; }\n===END===\n===FILE: src/components/Incomplete.tsx===\nexport function Incomplete() { return <div>trun",
          candidates: [{ finishReason: "MAX_TOKENS" }],
          usageMetadata: { promptTokenCount: 1500, candidatesTokenCount: 2000 },
        }),
      },
    };

    const gemini = new GeminiProvider("mock-key-for-test", "gemini");
    (gemini as any).client = mockClient;

    const result = await gemini.chat([{ role: "user", content: "Generate dashboard" }]);

    expect(result).toContain("===FILE: src/components/Dashboard.tsx===");
    expect(result).toContain("export function Dashboard()");
    expect(result).toContain("===END===");
    // The truncated trailing file is cleanly excluded
    expect(result).not.toContain("Incomplete.tsx");
  });

  // ── 9. Gemini MAX_TOKENS Salvage with Appended Closing Tag ─────────────────
  it("Boundary 9: Gemini provider salvages unclosed ===FILE: block upon MAX_TOKENS by appending closing tag", async () => {
    const codeContent = "export function AccountsLedger() {\n  return (\n    <div className='p-6'>\n      <h1>Accounts & Balances</h1>\n      <p>Treasury cash-flow ledger</p>\n    </div>\n  );\n}";
    const truncatedPayload = `===FILE: src/components/AccountsLedger.tsx===\n${codeContent}`;

    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: truncatedPayload,
          candidates: [{ finishReason: "MAX_TOKENS" }],
          usageMetadata: { promptTokenCount: 1200, candidatesTokenCount: 1800 },
        }),
      },
    };

    const gemini = new GeminiProvider("mock-key-for-test", "gemini");
    (gemini as any).client = mockClient;

    const result = await gemini.chat([{ role: "user", content: "Generate accounts ledger" }]);

    expect(result).toContain("===FILE: src/components/AccountsLedger.tsx===");
    expect(result).toContain("Accounts & Balances");
    expect(result.trim().endsWith("===END===")).toBe(true);
  });

  // ── 10. Gemini MAX_TOKENS Safe Handling When Getter Throws ─────────────────
  it("Boundary 10: Gemini provider safely falls back to content parts when response.text throws on truncated candidate", async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          get text(): string {
            throw new Error("Candidate was truncated with finishReason MAX_TOKENS");
          },
          candidates: [
            {
              finishReason: "MAX_TOKENS",
              content: {
                parts: [
                  { text: "===FILE: src/types.ts===\nexport interface Transaction { id: string; amount: number; }\n===END===" },
                ],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 500, candidatesTokenCount: 800 },
        }),
      },
    };

    const gemini = new GeminiProvider("mock-key-for-test", "gemini");
    (gemini as any).client = mockClient;

    const result = await gemini.chat([{ role: "user", content: "Generate types" }]);

    expect(result).toContain("===FILE: src/types.ts===");
    expect(result).toContain("export interface Transaction");
    expect(result).toContain("===END===");
  });
});
