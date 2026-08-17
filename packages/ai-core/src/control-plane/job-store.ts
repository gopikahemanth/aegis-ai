/**
 * JobStore
 *
 * Atomic, persistent, disk-backed job storage with secret redaction and crash recovery.
 * Stored under <projectRoot>/.aegis/jobs/<jobId>.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { GenerationJob } from "./job.js";

export class JobStore {
  private static readonly SECRET_PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
    { regex: /DATABASE_URL=[^\s"'\\]+/gi, replacement: "DATABASE_URL=[REDACTED]" },
    { regex: /JWT_SECRET=[^\s"'\\]+/gi, replacement: "JWT_SECRET=[REDACTED]" },
    { regex: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, replacement: "Bearer [REDACTED]" },
    { regex: /sk-[A-Za-z0-9]{20,}/gi, replacement: "[REDACTED_API_KEY]" },
  ];

  /**
   * Redact sensitive tokens and secrets from strings.
   */
  public static sanitize(text: string): string {
    if (!text || typeof text !== "string") return text;
    let sanitized = text;
    for (const { regex, replacement } of this.SECRET_PATTERNS) {
      sanitized = sanitized.replace(regex, replacement);
    }
    return sanitized;
  }

  public static sanitizeObject<T>(obj: T): T {
    if (!obj) return obj;
    try {
      const jsonStr = JSON.stringify(obj);
      const sanitizedStr = this.sanitize(jsonStr);
      return JSON.parse(sanitizedStr);
    } catch {
      return obj;
    }
  }


  private static getJobsDir(projectPath: string): string {
    return join(projectPath, ".aegis", "jobs");
  }

  /**
   * Atomically save job to disk.
   */
  public static saveJob(job: GenerationJob): void {
    const jobsDir = this.getJobsDir(job.projectPath);
    if (!existsSync(jobsDir)) mkdirSync(jobsDir, { recursive: true });

    const sanitizedJob = this.sanitizeObject(job);
    const jobFile = join(jobsDir, `${job.jobId}.json`);
    const tempFile = join(jobsDir, `${job.jobId}.tmp_${Date.now()}`);

    try {
      writeFileSync(tempFile, JSON.stringify(sanitizedJob, null, 2), "utf8");
      writeFileSync(jobFile, readFileSync(tempFile, "utf8"), "utf8");
      if (existsSync(tempFile)) rmSync(tempFile, { force: true });
    } catch (err) {
      console.error(`[JobStore] ❌ Failed to persist job "${job.jobId}":`, err);
    }
  }

  /**
   * Load job from disk.
   */
  public static getJob(projectPath: string, jobId: string): GenerationJob | null {
    const jobFile = join(this.getJobsDir(projectPath), `${jobId}.json`);
    if (!existsSync(jobFile)) return null;

    try {
      const raw = readFileSync(jobFile, "utf8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * List all stored jobs for a project.
   */
  public static listJobs(projectPath: string): GenerationJob[] {
    const jobsDir = this.getJobsDir(projectPath);
    if (!existsSync(jobsDir)) return [];

    const jobs: GenerationJob[] = [];
    try {
      const files = readdirSync(jobsDir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        try {
          const raw = readFileSync(join(jobsDir, file), "utf8");
          jobs.push(JSON.parse(raw));
        } catch {}
      }
    } catch {}

    return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Reconcile and recover active jobs after process restart.
   */
  public static recoverActiveJobs(projectPath: string): GenerationJob[] {
    const allJobs = this.listJobs(projectPath);
    const activeStates = ["ANALYZING", "PLANNING", "CONTRACTING", "GENERATING", "VALIDATING", "BUILDING", "RUNNING", "VERIFYING", "REPAIRING"];
    
    return allJobs.filter((job) => activeStates.includes(job.status));
  }
}
