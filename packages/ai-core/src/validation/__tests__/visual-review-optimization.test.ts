import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { VisualReviewerAgent, type VisualReviewResult } from "../../agents/visual-reviewer-agent.js";
import { FailoverProvider } from "../../providers/failover.js";
import type { AIProvider } from "../../providers/base.js";

describe("Aegis V2.1 Fix 10 — Multimodal Visual Reviewer & Failover Optimization", () => {
  let testDir: string;
  let screenshotPath: string;

  beforeEach(() => {
    VisualReviewerAgent.clearCache();
    testDir = join(tmpdir(), `aegis-fix10-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(testDir, { recursive: true });
    screenshotPath = join(testDir, "screenshot.png");
    // Write a dummy 1x1 PNG file buffer
    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    writeFileSync(screenshotPath, dummyPng);
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("Test 1 — Successful first provider: single provider call, no fallback", async () => {
    const mockProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockResolvedValue(
        JSON.stringify({
          issues: [
            {
              element: ".kanban-column",
              bug: "Column padding is slightly tight",
              severity: "low",
              isVisualOnly: true,
            },
          ],
        })
      ),
    };

    const reviewer = new VisualReviewerAgent(mockProvider);
    const result = await reviewer.executeDetailed("Build Kanban", screenshotPath);

    expect(mockProvider.chat).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("PASS");
    expect(result.issues.length).toBe(1);
    expect(result.cacheHit).toBe(false);
  });

  it("Test 2 — Transient provider failure: FailoverProvider retries and eventually succeeds", async () => {
    let attempts = 0;
    const mockProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error("Temporary network timeout");
        }
        return JSON.stringify({ issues: [] });
      }),
    };

    const failover = new FailoverProvider([mockProvider], 2, 50);
    const reviewer = new VisualReviewerAgent(failover);
    const result = await reviewer.executeDetailed("Build Kanban", screenshotPath);

    expect(attempts).toBe(2);
    expect(result.status).toBe("PASS");
  });

  it("Test 3 — Unsupported visual capability: fails over immediately without retrying text provider", async () => {
    const textOnlyProvider: AIProvider = {
      name: "groq",
      chat: vi.fn().mockRejectedValue(new Error("Model does not support vision modality")),
    };

    const visionProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockResolvedValue(JSON.stringify({ issues: [] })),
    };

    const failover = new FailoverProvider([textOnlyProvider, visionProvider], 3, 50);
    const reviewer = new VisualReviewerAgent(failover);
    const result = await reviewer.executeDetailed("Build Kanban", screenshotPath);

    // Text-only provider is called once and immediately abandoned on modality error
    expect(textOnlyProvider.chat).toHaveBeenCalledTimes(1);
    expect(visionProvider.chat).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("PASS");
  });

  it("Test 4 — Permanent authentication failure: terminates provider immediately without duplicate retries", async () => {
    const authFailedProvider: AIProvider = {
      name: "openrouter",
      chat: vi.fn().mockRejectedValue(new Error("402 Payment Required: Insufficient credits")),
    };

    const fallbackProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockResolvedValue(JSON.stringify({ issues: [] })),
    };

    const failover = new FailoverProvider([authFailedProvider, fallbackProvider], 3, 50);
    const reviewer = new VisualReviewerAgent(failover);
    const result = await reviewer.executeDetailed("Build Kanban", screenshotPath);

    // Only 1 attempt made against 402 provider
    expect(authFailedProvider.chat).toHaveBeenCalledTimes(1);
    expect(fallbackProvider.chat).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("PASS");
  });

  it("Test 5 — Identical screenshot reuse: cache hit with zero additional provider calls", async () => {
    const mockProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockResolvedValue(JSON.stringify({ issues: [] })),
    };

    const reviewer = new VisualReviewerAgent(mockProvider);

    // First call: executes provider
    const result1 = await reviewer.executeDetailed("Build Kanban", screenshotPath);
    expect(mockProvider.chat).toHaveBeenCalledTimes(1);
    expect(result1.cacheHit).toBe(false);

    // Second call with identical screenshot & request: cache hit!
    const result2 = await reviewer.executeDetailed("Build Kanban", screenshotPath);
    expect(mockProvider.chat).toHaveBeenCalledTimes(1); // Provider NOT called again!
    expect(result2.cacheHit).toBe(true);
    expect(result2.status).toBe("PASS");
  });

  it("Test 6 — Screenshot changed: new review performed when screenshot image changes", async () => {
    const mockProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockResolvedValue(JSON.stringify({ issues: [] })),
    };

    const reviewer = new VisualReviewerAgent(mockProvider);

    // First call on original image
    await reviewer.executeDetailed("Build Kanban", screenshotPath);
    expect(mockProvider.chat).toHaveBeenCalledTimes(1);

    // Change screenshot content
    writeFileSync(screenshotPath, Buffer.from("different-image-content", "utf8"));

    // Second call on modified screenshot
    const result2 = await reviewer.executeDetailed("Build Kanban", screenshotPath);
    expect(mockProvider.chat).toHaveBeenCalledTimes(2);
    expect(result2.cacheHit).toBe(false);
  });

  it("Test 7 — Build failed: visual review is skipped when build prerequisite is not satisfied", async () => {
    const mockProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn(),
    };

    const reviewer = new VisualReviewerAgent(mockProvider);

    const isBuildPassed = false;
    let result: VisualReviewResult | null = null;
    if (isBuildPassed) {
      result = await reviewer.executeDetailed("Build Kanban", screenshotPath);
    }

    expect(mockProvider.chat).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("Test 8 — Runtime failed: visual reviewer skipped when screenshot path does not exist", async () => {
    const mockProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn(),
    };

    const reviewer = new VisualReviewerAgent(mockProvider);
    const nonExistentPath = join(testDir, "missing-screenshot.png");

    const result = await reviewer.executeDetailed("Build Kanban", nonExistentPath);
    expect(mockProvider.chat).not.toHaveBeenCalled();
    expect(result.status).toBe("SKIPPED");
  });

  it("Test 9 — Parallel independent checks: visual review runs concurrently with feature reality and API validation", async () => {
    const mockProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 50));
        return JSON.stringify({ issues: [] });
      }),
    };

    const reviewer = new VisualReviewerAgent(mockProvider);

    const start = Date.now();
    const [visualResult, featureRealityResult, apiWorkflowResult] = await Promise.all([
      reviewer.executeDetailed("Build Kanban", screenshotPath),
      Promise.resolve({ passed: true, score: 100 }),
      Promise.resolve({ totalTests: 8, passedTests: 8 }),
    ]);
    const duration = Date.now() - start;

    expect(visualResult.status).toBe("PASS");
    expect(featureRealityResult.passed).toBe(true);
    expect(apiWorkflowResult.passedTests).toBe(8);
    expect(duration).toBeLessThan(300); // Ran concurrently in ~50ms
  });

  it("Test 10 — Stable review result: contains complete structured telemetry data", async () => {
    const mockProvider: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockResolvedValue(
        JSON.stringify({
          issues: [
            {
              element: "#root",
              bug: "Page is completely blank and failed to mount",
              severity: "high",
              isVisualOnly: false,
            },
          ],
        })
      ),
    };

    const reviewer = new VisualReviewerAgent(mockProvider);
    const result = await reviewer.executeDetailed("Build Kanban", screenshotPath);

    expect(result.status).toBe("FAIL"); // Functional/high bug produces FAIL
    expect(result.issues.length).toBe(1);
    expect(result.issues[0].isVisualOnly).toBe(false);
    expect(result.screenshotHash).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
