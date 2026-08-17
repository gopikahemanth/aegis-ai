/**
 * TelemetryTracker
 *
 * Collects and reports structured execution metrics for AEGIS jobs.
 */

import type { JobTelemetrySnapshot } from "./job.js";

export class TelemetryTracker {
  private static metrics: Map<string, JobTelemetrySnapshot> = new Map();
  private static startTimes: Map<string, number> = new Map();

  public static startJob(jobId: string): void {
    this.startTimes.set(jobId, Date.now());
    this.metrics.set(jobId, {
      durationMs: 0,
      totalLlmCalls: 0,
      tokensIn: 0,
      tokensOut: 0,
      cacheHits: 0,
      cacheMisses: 0,
      repairAttempts: 0,
      rollbackCount: 0,
      buildDurationMs: 0,
      runtimeDurationMs: 0,
      apiChecksCount: 0,
      browserChecksCount: 0,
    });
  }

  public static recordLlmCall(jobId: string, tokensIn: number, tokensOut: number): void {
    const m = this.getSnapshot(jobId);
    m.totalLlmCalls += 1;
    m.tokensIn += tokensIn;
    m.tokensOut += tokensOut;
  }

  public static recordCacheHit(jobId: string): void {
    this.getSnapshot(jobId).cacheHits += 1;
  }

  public static recordCacheMiss(jobId: string): void {
    this.getSnapshot(jobId).cacheMisses += 1;
  }

  public static recordRepair(jobId: string): void {
    this.getSnapshot(jobId).repairAttempts += 1;
  }

  public static recordRollback(jobId: string): void {
    this.getSnapshot(jobId).rollbackCount += 1;
  }

  public static recordBuildTime(jobId: string, durationMs: number): void {
    this.getSnapshot(jobId).buildDurationMs += durationMs;
  }

  public static recordApiCheck(jobId: string): void {
    this.getSnapshot(jobId).apiChecksCount += 1;
  }

  public static recordBrowserCheck(jobId: string): void {
    this.getSnapshot(jobId).browserChecksCount += 1;
  }

  public static getSnapshot(jobId: string): JobTelemetrySnapshot {
    if (!this.metrics.has(jobId)) {
      this.startJob(jobId);
    }
    const m = this.metrics.get(jobId)!;
    const start = this.startTimes.get(jobId) || Date.now();
    m.durationMs = Date.now() - start;
    return m;
  }

  public static reset(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
}
