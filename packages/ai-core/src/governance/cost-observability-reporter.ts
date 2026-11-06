/**
 * CostObservabilityReporter
 *
 * Provides end-to-end token, cost, and execution telemetry for AEGIS AI.
 * Tracks usage by agent, phase, model, and diagnostic event, while measuring
 * optimization savings from incremental generation, artifact caching, and
 * the deterministic test pyramid.
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
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokensConsumed: number;
  totalEstimatedCostUsd: number;
  totalTokensSaved: number;
  totalEstimatedUsdSaved: number;
  efficiencyRatioPercentage: number;
  callsByAgent: Record<string, { calls: number; tokens: number; costUsd: number }>;
  callsByPhase: Record<string, { calls: number; tokens: number; costUsd: number }>;
  callsByModel: Record<string, { calls: number; tokens: number; costUsd: number }>;
  savingsByCategory: Record<string, { count: number; tokensSaved: number; usdSaved: number }>;
  agentCallCount: number;
  cacheHitCount: number;
  lastUpdated: string;
}

export class CostObservabilityReporter {
  private static instance: CostObservabilityReporter;

  private records: AgentCallRecord[] = [];
  private savings: OptimizationSavingRecord[] = [];
  private projectRoot: string = "";

  public static getInstance(): CostObservabilityReporter {
    if (!this.instance) {
      this.instance = new CostObservabilityReporter();
    }
    return this.instance;
  }

  public setProjectRoot(root: string): void {
    this.projectRoot = root;
  }

  public recordAgentCall(record: Omit<AgentCallRecord, "timestamp" | "totalTokens" | "estimatedCostUsd">): void {
    const totalTokens = record.promptTokens + record.completionTokens;
    // Gemini 2.5/Flash average blended price: $0.075 / 1M input, $0.30 / 1M output
    const cost = (record.promptTokens * 0.075 / 1_000_000) + (record.completionTokens * 0.30 / 1_000_000);

    const fullRecord: AgentCallRecord = {
      ...record,
      timestamp: new Date().toISOString(),
      totalTokens,
      estimatedCostUsd: Number(cost.toFixed(6)),
    };

    this.records.push(fullRecord);

    // Also inform the underlying MetricsTracker
    MetricsTracker.getInstance().logUsage(record.promptTokens, record.completionTokens);
  }

  public recordSaving(saving: Omit<OptimizationSavingRecord, "timestamp" | "estimatedUsdSaved">): void {
    // Blended savings rate: $0.15 / 1M tokens
    const usdSaved = (saving.estimatedTokensSaved * 0.15) / 1_000_000;

    this.savings.push({
      ...saving,
      timestamp: new Date().toISOString(),
      estimatedUsdSaved: Number(usdSaved.toFixed(6)),
    });
  }

  public getSummary(): CostObservabilitySummary {
    let totalPrompt = 0;
    let totalCompletion = 0;
    let totalTokens = 0;
    let totalCostUsd = 0;
    let cacheHitCount = 0;

    const callsByAgent: Record<string, { calls: number; tokens: number; costUsd: number }> = {};
    const callsByPhase: Record<string, { calls: number; tokens: number; costUsd: number }> = {};
    const callsByModel: Record<string, { calls: number; tokens: number; costUsd: number }> = {};

    for (const r of this.records) {
      totalPrompt += r.promptTokens;
      totalCompletion += r.completionTokens;
      totalTokens += r.totalTokens;
      totalCostUsd += r.estimatedCostUsd;
      if (r.cacheHit) cacheHitCount++;

      // By Agent
      if (!callsByAgent[r.agent]) callsByAgent[r.agent] = { calls: 0, tokens: 0, costUsd: 0 };
      callsByAgent[r.agent].calls++;
      callsByAgent[r.agent].tokens += r.totalTokens;
      callsByAgent[r.agent].costUsd = Number((callsByAgent[r.agent].costUsd + r.estimatedCostUsd).toFixed(6));

      // By Phase
      if (!callsByPhase[r.phase]) callsByPhase[r.phase] = { calls: 0, tokens: 0, costUsd: 0 };
      callsByPhase[r.phase].calls++;
      callsByPhase[r.phase].tokens += r.totalTokens;
      callsByPhase[r.phase].costUsd = Number((callsByPhase[r.phase].costUsd + r.estimatedCostUsd).toFixed(6));

      // By Model
      if (!callsByModel[r.model]) callsByModel[r.model] = { calls: 0, tokens: 0, costUsd: 0 };
      callsByModel[r.model].calls++;
      callsByModel[r.model].tokens += r.totalTokens;
      callsByModel[r.model].costUsd = Number((callsByModel[r.model].costUsd + r.estimatedCostUsd).toFixed(6));
    }

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

    const grossTokens = totalTokens + totalTokensSaved;
    const efficiencyRatioPercentage = grossTokens > 0
      ? Number(((totalTokensSaved / grossTokens) * 100).toFixed(2))
      : 0;

    return {
      projectRoot: this.projectRoot,
      totalPromptTokens: totalPrompt,
      totalCompletionTokens: totalCompletion,
      totalTokensConsumed: totalTokens,
      totalEstimatedCostUsd: Number(totalCostUsd.toFixed(6)),
      totalTokensSaved,
      totalEstimatedUsdSaved: Number(totalEstimatedUsdSaved.toFixed(6)),
      efficiencyRatioPercentage,
      callsByAgent,
      callsByPhase,
      callsByModel,
      savingsByCategory,
      agentCallCount: this.records.length,
      cacheHitCount,
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
    rows.push(`| Metric | Value |`);
    rows.push(`| :--- | :--- |`);
    rows.push(`| Total Tokens Consumed | **${s.totalTokensConsumed.toLocaleString()}** |`);
    rows.push(`| Total Estimated Cost | **$${s.totalEstimatedCostUsd.toFixed(4)} USD** |`);
    rows.push(`| Tokens Saved via Framework Optimizations | **${s.totalTokensSaved.toLocaleString()}** |`);
    rows.push(`| Estimated Cost Saved | **$${s.totalEstimatedUsdSaved.toFixed(4)} USD** |`);
    rows.push(`| Token Efficiency Ratio | **${s.efficiencyRatioPercentage}%** |`);
    rows.push(`| Total Agent Calls | **${s.agentCallCount}** |`);
    rows.push(`| Artifact Cache Hits | **${s.cacheHitCount}** |`);
    rows.push(``);

    rows.push(`### Token Consumption by Agent`);
    rows.push(`| Agent | Invocations | Tokens | Est. Cost (USD) |`);
    rows.push(`| :--- | :--- | :--- | :--- |`);
    for (const [agent, data] of Object.entries(s.callsByAgent)) {
      rows.push(`| \`${agent}\` | ${data.calls} | ${data.tokens.toLocaleString()} | $${data.costUsd.toFixed(4)} |`);
    }
    rows.push(``);

    rows.push(`### Optimization Savings Breakdown`);
    rows.push(`| Optimization Category | Events | Tokens Saved | Est. USD Saved |`);
    rows.push(`| :--- | :--- | :--- | :--- |`);
    for (const [cat, data] of Object.entries(s.savingsByCategory)) {
      rows.push(`| \`${cat}\` | ${data.count} | ${data.tokensSaved.toLocaleString()} | $${data.usdSaved.toFixed(4)} |`);
    }

    return rows.join("\n");
  }

  public reset(): void {
    this.records = [];
    this.savings = [];
    this.projectRoot = "";
  }
}
