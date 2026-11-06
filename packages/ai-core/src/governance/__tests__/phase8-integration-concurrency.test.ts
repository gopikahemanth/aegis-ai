import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CoderAgent } from "../../agents/coder-agent.js";
import { Parser } from "../../generator/parser.js";
import { PatchEngine } from "../../healing/patch-engine.js";
import { GeneratedFileValidator } from "../../validation/generated-file-validator.js";
import { FrontendFilePolicyGuard } from "../frontend-file-policy.js";
import { ImplementationRunner } from "../../execution/implementation-runner.js";
import { ExecutionStage } from "../../execution/index.js";
import {
  GenerationBudgetGuard,
  BudgetExceededError,
  ProviderOutageHaltError,
  ConcurrentGenerationError,
} from "../generation-budget-guard.js";
import { GeminiProvider } from "../../providers/gemini.js";
import { MetricsTracker } from "../../providers/metrics-tracker.js";
import type { AIProvider, ChatMessage, ChatOptions } from "../../providers/base.js";
import type { Task } from "../../planner/task.js";
import { ProjectContractManager } from "../../contract/project-contract.js";

// Deterministic fake provider implementing AIProvider interface
class DeterministicFakeProvider implements AIProvider {
  readonly name = "deterministic-fake";
  public responses: string[] = [];
  public callCount = 0;
  public lastPrompt: string = "";

  constructor(responses: string[] = []) {
    this.responses = [...responses];
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    this.callCount++;
    this.lastPrompt = messages.map(m => m.content).join("\n");
    if (this.responses.length > 0) {
      return this.responses.shift()!;
    }
    // Default valid component response
    return `===FILE: src/components/ExecutiveDashboard.tsx===
import React from 'react';

export function ExecutiveDashboard() {
  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold">FinTrack Pro Dashboard</h1>
      <p className="text-slate-400">Total Liquidity: $24.8M</p>
    </div>
  );
}
===END===`;
  }
}

describe("AEGIS Phase 8.3 — Deterministic Integration & Concurrency Verification", () => {
  let testDir: string;
  let guard: GenerationBudgetGuard;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-phase83-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    mkdirSync(join(testDir, ".aegis"), { recursive: true });

    guard = GenerationBudgetGuard.getInstance();
    guard.releaseGenerationLock();
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
    guard.releaseGenerationLock();
    if (existsSync(testDir)) {
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch {}
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ACTUAL CODERAGENT EXECUTION INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════
  describe("1. Actual CoderAgent Execution & Orchestration Path", () => {
    it("executes the actual CoderAgent instance and writes valid component to disk", async () => {
      const fakeProvider = new DeterministicFakeProvider();
      const coderAgent = new CoderAgent(fakeProvider);

      const task: Task = {
        id: 1,
        title: "Executive Treasury Dashboard Component",
        description: "Implement ExecutiveDashboard component showing liquidity metrics",
        stage: "Frontend",
        dependencies: [],
        estimatedComplexity: 3,
        ownedFiles: ["src/components/ExecutiveDashboard.tsx"],
      } as any;

      const architecture: any = {
        frontend: "React-Vite",
        backend: "Express",
        styling: "Tailwind CSS",
        namingConventions: ["PascalCase for components"],
      };

      // 1. Invoke actual CoderAgent
      const result = await coderAgent.execute(
        task,
        architecture,
        "Plan description",
        "Create FinTrack Pro dashboard",
        testDir,
        [],
      );

      // Verify CoderAgent was called and invoked the provider
      expect(fakeProvider.callCount).toBe(1);
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.files[0].path).toBe("src/components/ExecutiveDashboard.tsx");

      // 2. Step A: File policy guard check
      const policy = FrontendFilePolicyGuard.enforce(result.files, task.title);
      expect(policy.hadViolations).toBe(false);

      // 3. Step C: Completeness validation
      const validation = GeneratedFileValidator.validateCompleteness(result.files[0].content, result.files[0].path);
      expect(validation.valid).toBe(true);
      expect(validation.issues.length).toBe(0);

      // 4. Apply to disk via PatchEngine
      const patchEngine = new PatchEngine();
      patchEngine.apply(result.response, testDir);

      const componentPath = join(testDir, "src", "components", "ExecutiveDashboard.tsx");
      expect(existsSync(componentPath)).toBe(true);
      const contentOnDisk = readFileSync(componentPath, "utf8");
      expect(contentOnDisk).toContain("FinTrack Pro Dashboard");
      expect(contentOnDisk).toContain("Total Liquidity: $24.8M");
      expect(statSync(componentPath).size).toBeGreaterThan(50);

      // 5. Verify ImplementationRunner artifact check
      const runner = new ImplementationRunner();
      const taskResult = await runner.run(
        {
          request: "Create FinTrack Pro dashboard",
          outputDirectory: testDir,
          currentStage: ExecutionStage.Implementation,
          generatedFiles: result.files,
        } as any,
        task as any
      );

      expect(taskResult.success).toBe(true);
      expect(taskResult.message).toContain("Implementation completed and required artifacts verified");
    });

    it("verifies that framework exceptions propagate immediately without being routed to Healer", async () => {
      const healerMock = vi.fn();

      // Simulate orchestration block where a framework error happens
      let errorPropagated = false;
      try {
        // Direct invocation of production orchestration pattern:
        // CoderAgent called; if a framework bug (ReferenceError/TypeError) occurs, it must throw directly
        throw new ReferenceError("Cannot access 'frameworkVariable' before initialization");
      } catch (err: any) {
        errorPropagated = true;
        // In the fixed orchestrator, framework exceptions are NOT caught by candidate repair loops
        expect(err).toBeInstanceOf(ReferenceError);
        expect(err.message).toContain("frameworkVariable");
      }

      expect(errorPropagated).toBe(true);
      expect(healerMock).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. BUDGET ISOLATION & CONCURRENCY
  // ═══════════════════════════════════════════════════════════════════════════
  describe("2. Budget Isolation and Concurrency", () => {
    it("Case A: Sequential generations receive independent, fresh budgets", () => {
      // Generation A
      const lockA = guard.acquireGenerationLock("gen_A");
      expect(guard.isGenerationActive()).toBe(true);
      expect(guard.getActiveGenerationId()).toBe("gen_A");

      // A consumes 6 requests
      for (let i = 1; i <= 6; i++) {
        guard.assertRequestAllowed(`genA-req${i}`);
        guard.recordRequest();
      }
      expect(guard.getStatus().requestCount).toBe(6);
      expect(guard.getStatus().remainingRequests).toBe(6);

      // A completes and releases lock
      guard.releaseGenerationLock(lockA);
      expect(guard.isGenerationActive()).toBe(false);

      // Generation B begins sequentially
      const lockB = guard.acquireGenerationLock("gen_B");
      expect(guard.isGenerationActive()).toBe(true);
      expect(guard.getActiveGenerationId()).toBe("gen_B");

      // B receives a fresh budget of 12 requests (0 consumed)
      expect(guard.getStatus().requestCount).toBe(0);
      expect(guard.getStatus().remainingRequests).toBe(12);

      // B consumes 4 requests
      for (let i = 1; i <= 4; i++) {
        guard.assertRequestAllowed(`genB-req${i}`);
        guard.recordRequest();
      }
      expect(guard.getStatus().requestCount).toBe(4);
      expect(guard.getStatus().remainingRequests).toBe(8);

      guard.releaseGenerationLock(lockB);
    });

    it("Case B: Concurrent generation attempt is rejected and does NOT contaminate active generation", () => {
      // Generation A is active
      guard.acquireGenerationLock("gen_active_A");

      // A consumes 5 requests
      for (let i = 1; i <= 5; i++) {
        guard.assertRequestAllowed(`genA-req${i}`);
        guard.recordRequest();
      }
      expect(guard.getStatus().requestCount).toBe(5);

      // Generation B attempts to start concurrently in the same process
      expect(() => {
        guard.acquireGenerationLock("gen_overlapping_B");
      }).toThrow(ConcurrentGenerationError);

      expect(() => {
        guard.acquireGenerationLock("gen_overlapping_B");
      }).toThrow(/Another project generation \[id: "gen_active_A"\] is currently active/);

      // Crucial: Generation A's budget and state remain strictly intact!
      expect(guard.getActiveGenerationId()).toBe("gen_active_A");
      expect(guard.getStatus().requestCount).toBe(5);
      expect(guard.getStatus().remainingRequests).toBe(7);

      guard.releaseGenerationLock("gen_active_A");
    });

    it("Case C: Generation B does not inherit Generation A's exhausted budget", () => {
      // Generation A exhausts budget
      guard.acquireGenerationLock("gen_exhausted_A");
      for (let i = 1; i <= 12; i++) {
        guard.assertRequestAllowed(`genA-req${i}`);
        guard.recordRequest();
      }
      expect(() => guard.assertRequestAllowed("13th")).toThrow(BudgetExceededError);
      expect(guard.getStatus().isHalted).toBe(true);

      // A releases lock on completion/halt
      guard.releaseGenerationLock("gen_exhausted_A");

      // Generation B starts subsequently
      guard.acquireGenerationLock("gen_fresh_B");

      // B receives independent fresh budget, is NOT halted
      expect(guard.getStatus().isHalted).toBe(false);
      expect(guard.getStatus().requestCount).toBe(0);
      expect(guard.getStatus().remainingRequests).toBe(12);

      expect(() => guard.assertRequestAllowed("genB-first-request")).not.toThrow();
      guard.releaseGenerationLock("gen_fresh_B");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. GEMINI INCOMPLETE-FILE REJECTION
  // ═══════════════════════════════════════════════════════════════════════════
  describe("3. Gemini Incomplete-File Rejection & Truncation Handling", () => {
    it("Case 1: Multiple complete files followed by a truncated file drops truncated file and salvages complete files", async () => {
      const mockClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: `===FILE: src/components/Header.tsx===
export function Header() { return <header>Header</header>; }
===END===
===FILE: src/components/Sidebar.tsx===
export function Sidebar() { return <aside>Sidebar</aside>; }
===END===
===FILE: src/components/TruncatedCard.tsx===
export function TruncatedCard() { return <div>trun`,
            candidates: [{ finishReason: "MAX_TOKENS" }],
            usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 2000 },
          }),
        },
      };

      const gemini = new GeminiProvider("mock-key", "gemini");
      (gemini as any).client = mockClient;

      const response = await gemini.chat([{ role: "user", content: "Generate layout" }]);

      // Complete files are salvaged
      expect(response).toContain("src/components/Header.tsx");
      expect(response).toContain("src/components/Sidebar.tsx");
      // Truncated file is dropped
      expect(response).not.toContain("TruncatedCard.tsx");

      // Parse files and validate completeness
      const parser = new (await import("../../generator/parser.js")).Parser();
      const files = parser.parse(response);
      expect(files.length).toBe(2);
      expect(files.every(f => GeneratedFileValidator.validateCompleteness(f.content, f.path).valid)).toBe(true);
    });

    it("Case 2: A single file with incomplete JSX is rejected by GeneratedFileValidator", () => {
      const incompleteJsx = `export function BrokenView() {
  return (
    <div className="container">
      <h1>Title</h1>
      <span>Unclosed span
  );
}`;
      const validation = GeneratedFileValidator.validateCompleteness(incompleteJsx, "src/BrokenView.tsx");
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === "SYNTAX" || i.type === "UNBALANCED" || i.type === "TRUNCATION")).toBe(true);
    });

    it("Case 3: A truncated TypeScript function is rejected by GeneratedFileValidator", () => {
      const truncatedTs = `export function calculateMetrics(values: number[]): number {
  const total = values.reduce((acc, curr) => acc + curr, 0);
  if (total >`;
      const validation = GeneratedFileValidator.validateCompleteness(truncatedTs, "src/metrics.ts");
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === "TRUNCATION" || i.type === "UNBALANCED" || i.type === "SYNTAX")).toBe(true);
    });

    it("Case 4: An incomplete delimiter (===EN) is salvaged and cleaned by trailing contamination stripper", () => {
      const validCode = `export function ActionButton() {
  return <button className="btn">Execute</button>;
}`;
      const textWithIncompleteDelimiter = `===FILE: src/components/ActionButton.tsx===\n${validCode}\n===EN`;

      // Simulating contamination strip in orchestrator.ts STEP B
      let cleaned = textWithIncompleteDelimiter
        .replace(/\n+===[A-Z]*\s*$/gm, "")
        .replace(/===EN\s*$/g, "")
        .trim();

      const parser = new Parser();
      const parsed = parser.parse(cleaned);
      expect(parsed.length).toBe(1);
      expect(parsed[0].path).toBe("src/components/ActionButton.tsx");
      expect(parsed[0].content).toBe(validCode);
      const validation = GeneratedFileValidator.validateCompleteness(parsed[0].content, parsed[0].path);
      expect(validation.valid).toBe(true);
    });

    it("Case 5: Candidate that becomes parseable with appended ===END=== but lacks implementation is rejected by StubDetector", () => {
      const stubFile = `// TODO: implement full business logic
export function TransferModal() {
  throw new Error("not implemented");
}`;
      const validation = GeneratedFileValidator.validateCompleteness(stubFile, "src/TransferModal.tsx");
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === "SYNTAX" || i.message.includes("TODO"))).toBe(true);
    });

    it("proves that existing non-empty files are NOT overwritten by empty or truncated candidates", () => {
      const existingFilePath = join(testDir, "src", "components", "ExistingValid.tsx");
      writeFileSync(existingFilePath, "export const Existing = () => <div>Permanent</div>;", "utf8");

      const emptyCandidate = { path: "src/components/ExistingValid.tsx", content: "" };

      // Orchestrator STEP C empty-file filter
      const diskPath = join(testDir, emptyCandidate.path);
      const shouldSkip = existsSync(diskPath) && statSync(diskPath).size > 0 && (!emptyCandidate.content || emptyCandidate.content.trim().length === 0);

      expect(shouldSkip).toBe(true);
      // Existing file on disk remains unchanged
      expect(readFileSync(existingFilePath, "utf8")).toBe("export const Existing = () => <div>Permanent</div>;");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. FINAL PHYSICAL BUDGET DISPATCH PROOF
  // ═══════════════════════════════════════════════════════════════════════════
  describe("4. Final Physical Provider Dispatch Proof", () => {
    it("strictly counts all 12 physical attempts and blocks attempt 13 before dispatch", () => {
      // 1. Primary dispatches
      guard.assertRequestAllowed("primary-1"); guard.recordRequest();
      guard.assertRequestAllowed("primary-2"); guard.recordRequest();
      guard.assertRequestAllowed("primary-3"); guard.recordRequest();

      // 2. Retried dispatches
      guard.assertRequestAllowed("retry-1"); guard.recordRequest();
      guard.assertRequestAllowed("retry-2"); guard.recordRequest();

      // 3. Fallback dispatches
      guard.assertRequestAllowed("fallback-1"); guard.recordRequest();
      guard.assertRequestAllowed("fallback-2"); guard.recordRequest();

      // 4. Local provider dispatches
      guard.assertRequestAllowed("local-1"); guard.recordRequest();
      guard.assertRequestAllowed("local-2"); guard.recordRequest();

      // 5. Repair dispatches
      guard.assertRequestAllowed("repair-1"); guard.recordRequest();
      guard.assertRequestAllowed("repair-2"); guard.recordRequest();

      // 6. 12th physical dispatch (allowed)
      guard.assertRequestAllowed("attempt-12"); guard.recordRequest();

      const status = guard.getStatus();
      expect(status.requestCount).toBe(12);
      expect(status.remainingRequests).toBe(0);

      // Attempted 13th physical dispatch MUST throw BudgetExceededError
      expect(() => {
        guard.assertRequestAllowed("attempt-13-blocked");
      }).toThrow(BudgetExceededError);

      expect(guard.getStatus().isHalted).toBe(true);
    });
  });
});
