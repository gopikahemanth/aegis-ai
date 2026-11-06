/**
 * CostObservabilityReporter
 *
 * Provides end-to-end token, cost, and execution telemetry for AEGIS AI.
 * Distinguishes between:
 * 1. ACTUAL MEASURED PROVIDER USAGE: Raw prompt & completion tokens tracked from providers.
 * 2. ESTIMATED COUNTERFACTUAL SAVINGS: Theoretical tokens avoided via caching, task satisfaction reuse, and repair pruning.
 *
 * Emits `.aegis/cost-observability.json` in the generated project.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MetricsTracker } from "../providers/metrics-tracker.js";

export interface AgentCallRecord {
  timestamp: string;
  agent: string;
  phase: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  durationMs: number;
  cacheHit?: boolean;
}

export interface OptimizationSavingRecord {
  timestamp: string;
  category: "TASK_SATISFACTION_REUSE" | "ARTIFACT_CACHE_HIT" | "TARGETED_REPAIR_PRUNING" | "TEST_PYRAMID_SHORT_CIRCUIT";
  description: string;
  estimatedTokensSaved: number;
  estimatedUsdSaved: number;
}

export interface CostObservabilitySummary {
  projectRoot: string;
  telemetryType: "EMPIRICAL_MEASUREMENT_AND_COUNTERFACTUAL_ESTIMATE";

  // Flat backwards-compatible fields
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokensConsumed: number;
  totalEstimatedCostUsd: number;
  totalTokensSaved: number;
  totalEstimatedUsdSaved: number;
  efficiencyRatioPercentage: number;
  agentCallCount: number;
  cacheHitCount: number;

  // ── Actual Measured Provider Telemetry ─────────────────────────────────────
  actualMeasuredUsage: {
    llmRequestCount: number;
    measuredPromptTokens: number;
    measuredCompletionTokens: number;
    measuredTotalTokens: number;
    measuredCostUsd: number;
    providerErrorsCount: number;
    providerRetriesCount: number;
  };

  // ── Execution Counts ───────────────────────────────────────────────────────
  executionCounts: {
    reusedFilesCount: number;
    regeneratedFilesCount: number;
    repairCallsCount: number;
    cacheHitsCount: number;
    cacheMissesCount: number;
    timePerStageMs: Record<string, number>;
  };

  // ── Counterfactual Optimization Estimates ─────────────────────────────────
  counterfactualEstimates: {
    totalEstimatedTokensSaved: number;
    totalEstimatedUsdSaved: number;
    efficiencyRatioPercentage: number;
    savingsByCategory: Record<string, { count: number; tokensSaved: number; usdSaved: number }>;
  };

  callsByAgent: Record<string, { calls: number; tokens: number; costUsd: number }>;
  callsByPhase: Record<string, { calls: number; tokens: number; costUsd: number }>;
  callsByModel: Record<string, { calls: number; tokens: number; costUsd: number }>;
  lastUpdated: string;
}

export class CostObservabilityReporter {
  private static instance: CostObservabilityReporter;

  private records: AgentCallRecord[] = [];
  private savings: OptimizationSavingRecord[] = [];
  private projectRoot: string = "";

  private reusedFilesCount = 0;
  private regeneratedFilesCount = 0;
  private repairCallsCount = 0;
  private cacheHitsCount = 0;
  private cacheMissesCount = 0;
  private providerErrorsCount = 0;
  private providerRetriesCount = 0;
  private timePerStage: Record<string, number> = {};

  public static getInstance(): CostObservabilityReporter {
    if (!this.instance) {
      this.instance = new CostObservabilityReporter();
    }
    return this.instance;
  }

  public setProjectRoot(root: string): void {
    this.projectRoot = root;
  }

  public incrementReusedFiles(count: number = 1): void {
    this.reusedFilesCount += count;
  }

  public incrementRegeneratedFiles(count: number = 1): void {
    this.regeneratedFilesCount += count;
  }

  public incrementRepairCalls(count: number = 1): void {
    this.repairCallsCount += count;
  }

  public incrementCacheHits(count: number = 1): void {
    this.cacheHitsCount += count;
  }

  public incrementCacheMisses(count: number = 1): void {
    this.cacheMissesCount += count;
  }

  public incrementProviderErrors(count: number = 1): void {
    this.providerErrorsCount += count;
  }

  public incrementProviderRetries(count: number = 1): void {
    this.providerRetriesCount += count;
  }

  public recordStageDuration(stage: string, durationMs: number): void {
    this.timePerStage[stage] = (this.timePerStage[stage] || 0) + durationMs;
  }

  public recordAgentCall(record: Omit<AgentCallRecord, "timestamp" | "totalTokens" | "estimatedCostUsd">): void {
    const totalTokens = record.promptTokens + record.completionTokens;
    const cost = (record.promptTokens * 0.075 / 1_000_000) + (record.completionTokens * 0.30 / 1_000_000);

    const fullRecord: AgentCallRecord = {
      ...record,
      timestamp: new Date().toISOString(),
      totalTokens,
      estimatedCostUsd: Number(cost.toFixed(6)),
    };

    this.records.push(fullRecord);
    MetricsTracker.getInstance().logUsage(record.promptTokens, record.completionTokens);
  }

  public recordSaving(saving: Omit<OptimizationSavingRecord, "timestamp" | "estimatedUsdSaved">): void {
    const usdSaved = (saving.estimatedTokensSaved * 0.15) / 1_000_000;

    this.savings.push({
      ...saving,
      timestamp: new Date().toISOString(),
      estimatedUsdSaved: Number(usdSaved.toFixed(6)),
    });
  }

  public getSummary(): CostObservabilitySummary {
    let callPromptTokens = 0;
    let callCompletionTokens = 0;
    let callTotalTokens = 0;
    let callCostUsd = 0;
    let callCacheHits = 0;

    const callsByAgent: Record<string, { calls: number; tokens: number; costUsd: number }> = {};
    const callsByPhase: Record<string, { calls: number; tokens: number; costUsd: number }> = {};
    const callsByModel: Record<string, { calls: number; tokens: number; costUsd: number }> = {};

    for (const r of this.records) {
      callPromptTokens += r.promptTokens;
      callCompletionTokens += r.completionTokens;
      callTotalTokens += r.totalTokens;
      callCostUsd += r.estimatedCostUsd;
      if (r.cacheHit) callCacheHits++;

      if (!callsByAgent[r.agent]) callsByAgent[r.agent] = { calls: 0, tokens: 0, costUsd: 0 };
      callsByAgent[r.agent].calls++;
      callsByAgent[r.agent].tokens += r.totalTokens;
      callsByAgent[r.agent].costUsd = Number((callsByAgent[r.agent].costUsd + r.estimatedCostUsd).toFixed(6));

      if (!callsByPhase[r.phase]) callsByPhase[r.phase] = { calls: 0, tokens: 0, costUsd: 0 };
      callsByPhase[r.phase].calls++;
      callsByPhase[r.phase].tokens += r.totalTokens;
      callsByPhase[r.phase].costUsd = Number((callsByPhase[r.phase].costUsd + r.estimatedCostUsd).toFixed(6));

      if (!callsByModel[r.model]) callsByModel[r.model] = { calls: 0, tokens: 0, costUsd: 0 };
      callsByModel[r.model].calls++;
      callsByModel[r.model].tokens += r.totalTokens;
      callsByModel[r.model].costUsd = Number((callsByModel[r.model].costUsd + r.estimatedCostUsd).toFixed(6));
    }

    // Sync from provider MetricsTracker
    const trackedMetrics = MetricsTracker.getInstance().getMetrics();
    const measuredPrompt = trackedMetrics.promptTokens || callPromptTokens;
    const measuredCompletion = trackedMetrics.completionTokens || callCompletionTokens;
    const measuredTotal = trackedMetrics.totalTokens || callTotalTokens;
    const measuredCostUsd = trackedMetrics.estimatedCostUsd || Number(callCostUsd.toFixed(6));

    let totalTokensSaved = 0;
    let totalEstimatedUsdSaved = 0;
    const savingsByCategory: Record<string, { count: number; tokensSaved: number; usdSaved: number }> = {};

    for (const s of this.savings) {
      totalTokensSaved += s.estimatedTokensSaved;
      totalEstimatedUsdSaved += s.estimatedUsdSaved;

      if (!savingsByCategory[s.category]) {
        savingsByCategory[s.category] = { count: 0, tokensSaved: 0, usdSaved: 0 };
      }
      savingsByCategory[s.category].count++;
      savingsByCategory[s.category].tokensSaved += s.estimatedTokensSaved;
      savingsByCategory[s.category].usdSaved = Number(
        (savingsByCategory[s.category].usdSaved + s.estimatedUsdSaved).toFixed(6)
      );
    }

    const grossTokens = measuredTotal + totalTokensSaved;
    const efficiencyRatioPercentage = grossTokens > 0
      ? Number(((totalTokensSaved / grossTokens) * 100).toFixed(2))
      : 0;

    return {
      projectRoot: this.projectRoot,
      telemetryType: "EMPIRICAL_MEASUREMENT_AND_COUNTERFACTUAL_ESTIMATE",

      // Flat fields for backwards compatibility
      totalPromptTokens: measuredPrompt,
      totalCompletionTokens: measuredCompletion,
      totalTokensConsumed: measuredTotal,
      totalEstimatedCostUsd: measuredCostUsd,
      totalTokensSaved,
      totalEstimatedUsdSaved: Number(totalEstimatedUsdSaved.toFixed(6)),
      efficiencyRatioPercentage,
      agentCallCount: this.records.length,
      cacheHitCount: this.cacheHitsCount || callCacheHits,

      actualMeasuredUsage: {
        llmRequestCount: this.records.length,
        measuredPromptTokens: measuredPrompt,
        measuredCompletionTokens: measuredCompletion,
        measuredTotalTokens: measuredTotal,
        measuredCostUsd,
        providerErrorsCount: this.providerErrorsCount,
        providerRetriesCount: this.providerRetriesCount,
      },
      executionCounts: {
        reusedFilesCount: this.reusedFilesCount,
        regeneratedFilesCount: this.regeneratedFilesCount,
        repairCallsCount: this.repairCallsCount,
        cacheHitsCount: this.cacheHitsCount || callCacheHits,
        cacheMissesCount: this.cacheMissesCount,
        timePerStageMs: { ...this.timePerStage },
      },
      counterfactualEstimates: {
        totalEstimatedTokensSaved: totalTokensSaved,
        totalEstimatedUsdSaved: Number(totalEstimatedUsdSaved.toFixed(6)),
        efficiencyRatioPercentage,
        savingsByCategory,
      },
      callsByAgent,
      callsByPhase,
      callsByModel,
      lastUpdated: new Date().toISOString(),
    };
  }

  public persistToProject(targetDir?: string): string | null {
    const dir = targetDir || this.projectRoot;
    if (!dir) return null;

    try {
      const aegisDir = join(dir, ".aegis");
      if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

      const summary = this.getSummary();
      const outputPath = join(aegisDir, "cost-observability.json");
      writeFileSync(outputPath, JSON.stringify(summary, null, 2), "utf8");
      return outputPath;
    } catch (e: any) {
      console.warn(`[CostObservabilityReporter] Failed to persist report: ${e.message}`);
      return null;
    }
  }

  public renderMarkdownSummary(): string {
    const s = this.getSummary();
    const rows: string[] = [];

    rows.push(`## Aegis AI Cost & Token Observability Report`);
    rows.push(``);
    rows.push(`### Empirical Measured Usage (From Active Providers)`);
    rows.push(`| Metric | Measured Value |`);
    rows.push(`| :--- | :--- |`);
    rows.push(`| Total Measured Input Tokens | **${s.actualMeasuredUsage.measuredPromptTokens.toLocaleString()}** |`);
    rows.push(`| Total Measured Output Tokens | **${s.actualMeasuredUsage.measuredCompletionTokens.toLocaleString()}** |`);
    rows.push(`| Total Measured Tokens Consumed | **${s.actualMeasuredUsage.measuredTotalTokens.toLocaleString()}** |`);
    rows.push(`| Total Measured Cost (USD) | **$${s.actualMeasuredUsage.measuredCostUsd.toFixed(4)}** |`);
    rows.push(`| Provider Error Count | **${s.actualMeasuredUsage.providerErrorsCount}** |`);
    rows.push(`| Provider Retry Count | **${s.actualMeasuredUsage.providerRetriesCount}** |`);
    rows.push(``);

    rows.push(`### Execution Telemetry`);
    rows.push(`| Metric | Count |`);
    rows.push(`| :--- | :--- |`);
    rows.push(`| Files Reused via Satisfaction Checks | **${s.executionCounts.reusedFilesCount}** |`);
    rows.push(`| Files Generated / Regenerated | **${s.executionCounts.regeneratedFilesCount}** |`);
    rows.push(`| Targeted Repair Calls Executed | **${s.executionCounts.repairCallsCount}** |`);
    rows.push(`| Artifact Cache Hits | **${s.executionCounts.cacheHitsCount}** |`);
    rows.push(`| Artifact Cache Misses | **${s.executionCounts.cacheMissesCount}** |`);
    rows.push(``);

    rows.push(`### Token Consumption by Agent`);
    rows.push(`| Agent | Invocations | Tokens | Est. Cost (USD) |`);
    rows.push(`| :--- | :--- | :--- | :--- |`);
    for (const [agent, data] of Object.entries(s.callsByAgent)) {
      rows.push(`| \`${agent}\` | ${data.calls} | ${data.tokens.toLocaleString()} | $${data.costUsd.toFixed(4)} |`);
    }
    rows.push(``);

    rows.push(`### Counterfactual Optimization Estimates`);
    rows.push(`| Metric | Estimated Value |`);
    rows.push(`| :--- | :--- |`);
    rows.push(`| Estimated Tokens Avoided | **${s.counterfactualEstimates.totalEstimatedTokensSaved.toLocaleString()}** |`);
    rows.push(`| Estimated USD Avoided | **$${s.counterfactualEstimates.totalEstimatedUsdSaved.toFixed(4)}** |`);
    rows.push(`| Efficiency Ratio | **${s.counterfactualEstimates.efficiencyRatioPercentage}%** |`);

    return rows.join("\n");
  }

  public reset(): void {
    this.records = [];
    this.savings = [];
    this.projectRoot = "";
    this.reusedFilesCount = 0;
    this.regeneratedFilesCount = 0;
    this.repairCallsCount = 0;
    this.cacheHitsCount = 0;
    this.cacheMissesCount = 0;
    this.providerErrorsCount = 0;
    this.providerRetriesCount = 0;
    this.timePerStage = {};
    MetricsTracker.getInstance().reset();
  }
}
