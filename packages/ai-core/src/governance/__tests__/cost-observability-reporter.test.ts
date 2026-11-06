import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CostObservabilityReporter } from "../cost-observability-reporter.js";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("CostObservabilityReporter — Telemetry and Savings Measurement", () => {
  const testDir = join(process.cwd(), "temp-test-cost");

  beforeEach(() => {
    CostObservabilityReporter.getInstance().reset();
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("Records agent calls, calculates tokens and estimated USD costs", () => {
    const reporter = CostObservabilityReporter.getInstance();
    reporter.recordAgentCall({
      agent: "ArchitectAgent",
      phase: "Architecture Selection",
      model: "gemini-2.5-flash",
      promptTokens: 2000,
      completionTokens: 500,
      durationMs: 850,
    });

    const summary = reporter.getSummary();
    expect(summary.totalPromptTokens).toBe(2000);
    expect(summary.totalCompletionTokens).toBe(500);
    expect(summary.totalTokensConsumed).toBe(2500);
    expect(summary.agentCallCount).toBe(1);
    expect(summary.callsByAgent["ArchitectAgent"].calls).toBe(1);
  });

  it("Records optimization savings and computes efficiency ratio", () => {
    const reporter = CostObservabilityReporter.getInstance();
    reporter.recordAgentCall({
      agent: "CoderAgent",
      phase: "Frontend",
      model: "gemini-2.5-flash",
      promptTokens: 4000,
      completionTokens: 1000,
      durationMs: 2200,
    });

    reporter.recordSaving({
      category: "TASK_SATISFACTION_REUSE",
      description: "Reused existing Hero component",
      estimatedTokensSaved: 10000,
    });

    const summary = reporter.getSummary();
    expect(summary.totalTokensConsumed).toBe(5000);
    expect(summary.totalTokensSaved).toBe(10000);
    // Efficiency: 10000 / (5000 + 10000) = 66.67%
    expect(summary.efficiencyRatioPercentage).toBeCloseTo(66.67, 1);
  });

  it("Persists summary to .aegis/cost-observability.json", () => {
    const reporter = CostObservabilityReporter.getInstance();
    reporter.setProjectRoot(testDir);
    reporter.recordAgentCall({
      agent: "CoderAgent",
      phase: "Backend",
      model: "gemini-2.5-flash",
      promptTokens: 1500,
      completionTokens: 300,
      durationMs: 900,
    });

    const filePath = reporter.persistToProject(testDir);
    expect(filePath).not.toBeNull();
    expect(existsSync(filePath!)).toBe(true);

    const fileContent = JSON.parse(readFileSync(filePath!, "utf8"));
    expect(fileContent.totalTokensConsumed).toBe(1800);
    expect(fileContent.agentCallCount).toBe(1);
  });

  it("Renders markdown summary table", () => {
    const reporter = CostObservabilityReporter.getInstance();
    reporter.recordAgentCall({
      agent: "PlannerAgent",
      phase: "Planning",
      model: "gemini-2.5-flash",
      promptTokens: 1000,
      completionTokens: 200,
      durationMs: 500,
    });

    const markdown = reporter.renderMarkdownSummary();
    expect(markdown).toContain("## Aegis AI Cost & Token Observability Report");
    expect(markdown).toContain("PlannerAgent");
  });
});
