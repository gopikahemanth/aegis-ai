/**
 * JobOrchestrator
 *
 * Authoritative control-plane operational orchestrator.
 * Manages GenerationJobs, life-cycle transitions, concurrency, authorization,
 * change previews, dry-runs, and bridges to MasterProductPipeline.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { GenerationJob, JobStatus, JobAuthorizationRequest } from "./job.js";
import { JobStateMachine } from "./job-state-machine.js";
import { JobStore } from "./job-store.js";
import { ProgressEventEmitter } from "./progress-events.js";
import { TelemetryTracker } from "./telemetry.js";
import { AuditLog } from "./audit-log.js";
import { MasterProductPipeline, type PipelineExecutionResult } from "../integration/master-pipeline.js";
import { ProductRequirementAnalyzer } from "../product/product-requirement-analyzer.js";
import { RequirementClarificationEngine } from "../product/requirement-clarification-engine.js";
import { ArchitectureResolver } from "../governance/architecture-resolver.js";
import { DomainContractDeriver, DomainContractManager } from "../governance/domain-contract.js";
import { DynamicCanonicalFileGraphBuilder } from "../governance/dynamic-file-graph.js";
import { AuthorizationGate } from "../validation/authorization-gate.js";
import { UserFeedbackEngine } from "../evolution/user-feedback-engine.js";
import type { BlastRadius } from "../evolution/incremental-change-analyzer.js";
import { ProjectStateReconciler } from "../evolution/project-state-reconciler.js";
import { ProjectGenerationLock } from "../evolution/project-generation-lock.js";
import { RuntimeProcessManager } from "../execution/runtime-process-manager.js";

import { IncidentEngine } from "../operations/incident-engine.js";
import { ReleaseLineageTracker } from "../operations/release-lineage.js";
import { ProductionHealthMonitor } from "../operations/production-health-monitor.js";
import { DeploymentOrchestrator } from "../operations/deployment-orchestrator.js";


export interface CreateJobOptions {
  projectId: string;
  projectPath: string;
  prompt: string;
  type?: GenerationJob["type"];
  parentGenerationId?: string;
}

export interface StartJobOptions {
  customExecutor?: (tasks: any[]) => Promise<{ success: boolean; createdFiles: string[]; modifiedFiles: string[]; deletedFiles: string[] }>;
  liveServerUrl?: string;
  apiWorkflowSteps?: any[];
  browserWorkflowActions?: any[];
}

export interface ChangePreviewReport {
  changeType: string;
  blastRadius: BlastRadius;
  affectedContracts: string[];
  filesToCreate: string[];
  filesToModify: string[];
  filesPreserved: string[];
  databaseChanges: string[];
  apiChanges: string[];
  authorizationRequired: boolean;
  risk: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
}


export interface DryRunResult {
  jobId: string;
  status: "DRY_RUN_COMPLETED" | "AWAITING_AUTHORIZATION" | "NEEDS_CLARIFICATION";
  productSpecification: any;
  architectureContract: any;
  domainContract: any;
  fileGraph: any;
  changePreview?: ChangePreviewReport;
  diskMutations: number;
  summary: string;
}


export interface GenerationDiffReport {
  projectId: string;
  fromGenerationId: string;
  toGenerationId: string;
  filesCreated: string[];
  filesModified: string[];
  filesDeleted: string[];
  filesPreserved: string[];
  contractHashChanges: Record<string, { from: string; to: string }>;
  summary: string;
}

export class JobOrchestrator {
  private static activeJobs: Map<string, GenerationJob> = new Map();

  /**
   * Create and register a new generation job.
   */
  public static createJob(options: CreateJobOptions): GenerationJob {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const generationId = `gen_${Date.now()}`;

    const job: GenerationJob = {
      jobId,
      projectId: options.projectId,
      projectPath: options.projectPath,
      generationId,
      parentGenerationId: options.parentGenerationId,
      requestId: `req_${Date.now()}`,
      type: options.type || "INITIAL_GENERATION",
      prompt: options.prompt,
      status: "QUEUED",
      createdAt: new Date().toISOString(),
      currentStage: "QUEUED",
      progress: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        activeTasks: 0,
        percentage: 0,
      },
      pipelineState: {},
      contractHashes: {},
      telemetry: {
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
      },
    };

    this.activeJobs.set(jobId, job);
    JobStore.saveJob(job);

    ProgressEventEmitter.emit(jobId, job.projectId, generationId, "JOB_CREATED", "QUEUED", { prompt: job.prompt });
    AuditLog.record(job.projectPath, job.projectId, "JOB_CREATED", "JOB_LIFECYCLE", { jobId, prompt: job.prompt }, generationId);

    return job;
  }

  /**
   * Run a completely non-mutating Dry Run.
   */
  public static runDryRun(jobId: string): DryRunResult {
    const job = this.getJob(jobId);
    if (!job) throw new Error(`Job "${jobId}" not found.`);

    // 1. Clarification & Authorization Check
    const clarification = RequirementClarificationEngine.evaluate(job.prompt);
    if (clarification.isBlocking) {
      return {
        jobId,
        status: "NEEDS_CLARIFICATION",
        productSpecification: null,
        architectureContract: null,
        domainContract: null,
        fileGraph: null,
        diskMutations: 0,
        summary: clarification.message,
      };
    }

    // 2. Requirement Analysis & Architecture
    const spec = ProductRequirementAnalyzer.analyze(job.prompt);
    const arch = ArchitectureResolver.resolve(job.prompt);
    const domain = DomainContractDeriver.derive(arch, arch.architectureHash!);
    const fileGraph = DynamicCanonicalFileGraphBuilder.build(arch, domain, job.projectPath);

    return {
      jobId,
      status: "DRY_RUN_COMPLETED",
      productSpecification: spec,
      architectureContract: arch,
      domainContract: domain,
      fileGraph,
      diskMutations: 0,
      summary: `Dry run plan generated successfully for ${spec.features.length} features across ${fileGraph.entries.length} planned files. Zero disk changes made.`,
    };

  }

  /**
   * Start executing a GenerationJob.
   */
  public static async startJob(jobId: string, options: StartJobOptions = {}): Promise<GenerationJob> {
    const job = this.getJob(jobId);
    if (!job) throw new Error(`Job "${jobId}" not found.`);

    job.status = JobStateMachine.transition(job.status, "ANALYZING");
    job.startedAt = new Date().toISOString();
    job.currentStage = "ANALYZING";
    JobStore.saveJob(job);

    ProgressEventEmitter.emit(jobId, job.projectId, job.generationId, "JOB_STARTED", "ANALYZING");
    TelemetryTracker.startJob(jobId);

    // Acquire lock
    ProjectGenerationLock.acquireLock(job.projectPath, job.generationId, job.projectId, job.prompt);


    try {
      let pipelineResult: PipelineExecutionResult;

      if (job.type === "INCREMENTAL_EVOLUTION") {
        job.status = JobStateMachine.transition(job.status, "PLANNING");
        job.currentStage = "PLANNING";
        JobStore.saveJob(job);

        pipelineResult = await MasterProductPipeline.evolve({
          projectId: job.projectId,
          projectPath: job.projectPath,
          generationId: job.generationId,
          feedbackPrompt: job.prompt,
          customExecutor: options.customExecutor,
          liveServerUrl: options.liveServerUrl,
        });
      } else {
        job.status = JobStateMachine.transition(job.status, "CONTRACTING");
        job.status = JobStateMachine.transition(job.status, "GENERATING");
        job.currentStage = "GENERATING";
        JobStore.saveJob(job);

        pipelineResult = await MasterProductPipeline.generate({
          projectId: job.projectId,
          projectPath: job.projectPath,
          generationId: job.generationId,
          prompt: job.prompt,
          customExecutor: options.customExecutor,
          liveServerUrl: options.liveServerUrl,
          apiWorkflowSteps: options.apiWorkflowSteps,
          browserWorkflowActions: options.browserWorkflowActions,
        });
      }


      job.telemetry = TelemetryTracker.getSnapshot(jobId);
      job.completedAt = new Date().toISOString();
      job.pipelineState = pipelineResult.stages;

      if (pipelineResult.status === "SUCCESS") {
        job.status = JobStateMachine.transition(job.status, "COMPLETED");
        job.currentStage = "COMPLETED";
        job.finalStatus = "SUCCESS";
        job.verificationSummary = pipelineResult.summary;
        job.progress.percentage = 100;
        ProgressEventEmitter.emit(jobId, job.projectId, job.generationId, "JOB_COMPLETED", "COMPLETED", { summary: pipelineResult.summary });
      } else if (pipelineResult.status === "AWAITING_AUTHORIZATION") {
        job.status = JobStateMachine.transition(job.status, "WAITING_FOR_AUTHORIZATION");
        job.currentStage = "WAITING_FOR_AUTHORIZATION";
        job.finalStatus = "BLOCKED";
        job.authorizationState = {
          id: `auth_${Date.now()}`,
          operation: job.prompt,
          category: "DESTRUCTIVE_MIGRATION",
          reason: pipelineResult.summary,
          requestedAt: new Date().toISOString(),
          status: "PENDING",
        };
        ProgressEventEmitter.emit(jobId, job.projectId, job.generationId, "AUTHORIZATION_REQUIRED", "WAITING_FOR_AUTHORIZATION", { reason: pipelineResult.summary });
      } else if (pipelineResult.status === "NEEDS_CLARIFICATION") {
        job.status = "BLOCKED";
        job.currentStage = "CLARIFYING";
        job.finalStatus = "BLOCKED";
        job.error = pipelineResult.summary;
        ProgressEventEmitter.emit(jobId, job.projectId, job.generationId, "TASK_BLOCKED", "CLARIFYING", { reason: pipelineResult.summary });
      } else {
        job.status = "FAILED";
        job.currentStage = "FAILED";
        job.finalStatus = "FAILED";
        job.error = pipelineResult.summary;
        ProgressEventEmitter.emit(jobId, job.projectId, job.generationId, "JOB_FAILED", "FAILED", { error: pipelineResult.summary });
      }
    } catch (err: any) {
      job.status = "FAILED";
      job.currentStage = "FAILED";
      job.finalStatus = "FAILED";
      job.error = err?.message || String(err);
      ProgressEventEmitter.emit(jobId, job.projectId, job.generationId, "JOB_FAILED", "FAILED", { error: job.error });
    } finally {
      ProjectGenerationLock.releaseLock(job.projectPath, job.generationId);
      JobStore.saveJob(job);
    }

    return job;
  }

  /**
   * Gracefully pause an active job.
   */
  public static pauseJob(jobId: string): GenerationJob {
    const job = this.getJob(jobId);
    if (!job) throw new Error(`Job "${jobId}" not found.`);

    job.status = JobStateMachine.transition(job.status, "PAUSED");
    job.currentStage = "PAUSED";
    ProjectGenerationLock.releaseLock(job.projectPath, job.generationId);
    JobStore.saveJob(job);

    ProgressEventEmitter.emit(jobId, job.projectId, job.generationId, "JOB_PAUSED", "PAUSED");
    AuditLog.record(job.projectPath, job.projectId, "JOB_PAUSED", "JOB_LIFECYCLE", { jobId }, job.generationId);

    return job;
  }

  /**
   * Cancel an active or paused job.
   */
  public static async cancelJob(jobId: string): Promise<GenerationJob> {
    const job = this.getJob(jobId);
    if (!job) throw new Error(`Job "${jobId}" not found.`);

    job.status = JobStateMachine.transition(job.status, "CANCELLED");
    job.currentStage = "CANCELLED";
    job.finalStatus = "BLOCKED";
    ProjectGenerationLock.releaseLock(job.projectPath, job.generationId);
    await RuntimeProcessManager.stopAll();
    JobStore.saveJob(job);


    ProgressEventEmitter.emit(jobId, job.projectId, job.generationId, "JOB_CANCELLED", "CANCELLED");
    AuditLog.record(job.projectPath, job.projectId, "JOB_CANCELLED", "JOB_LIFECYCLE", { jobId }, job.generationId);

    return job;
  }

  /**
   * Resume a paused or recoverable job.
   */
  public static async resumeJob(jobId: string, options: StartJobOptions = {}): Promise<GenerationJob> {
    const job = this.getJob(jobId);
    if (!job) throw new Error(`Job "${jobId}" not found.`);

    job.status = JobStateMachine.transition(job.status, "RESUMING");
    job.currentStage = "RESUMING";
    JobStore.saveJob(job);

    ProgressEventEmitter.emit(jobId, job.projectId, job.generationId, "JOB_RESUMED", "RESUMING");

    return this.startJob(jobId, options);
  }

  /**
   * Approve a pending human authorization request.
   */
  public static async approveAuthorization(jobId: string, actor: string = "user", options: StartJobOptions = {}): Promise<GenerationJob> {
    const job = this.getJob(jobId);
    if (!job || !job.authorizationState) throw new Error(`No pending authorization for job "${jobId}".`);

    job.authorizationState.status = "APPROVED";
    job.authorizationState.decidedAt = new Date().toISOString();
    job.authorizationState.decidedBy = actor;
    job.status = JobStateMachine.transition(job.status, "PLANNING");
    JobStore.saveJob(job);

    ProgressEventEmitter.emit(jobId, job.projectId, job.generationId, "AUTHORIZATION_GRANTED", "PLANNING", { actor });
    AuditLog.record(job.projectPath, job.projectId, "AUTHORIZATION_APPROVED", "AUTHORIZATION", { jobId, actor }, job.generationId, actor);

    return this.startJob(jobId, options);
  }

  /**
   * Reject a pending human authorization request.
   */
  public static rejectAuthorization(jobId: string, reason: string = "Rejected by user", actor: string = "user"): GenerationJob {
    const job = this.getJob(jobId);
    if (!job || !job.authorizationState) throw new Error(`No pending authorization for job "${jobId}".`);

    job.authorizationState.status = "REJECTED";
    job.authorizationState.decidedAt = new Date().toISOString();
    job.authorizationState.decidedBy = actor;
    job.status = "BLOCKED";
    job.finalStatus = "BLOCKED";
    job.error = reason;
    JobStore.saveJob(job);

    ProgressEventEmitter.emit(jobId, job.projectId, job.generationId, "AUTHORIZATION_DENIED", "BLOCKED", { reason, actor });
    AuditLog.record(job.projectPath, job.projectId, "AUTHORIZATION_REJECTED", "AUTHORIZATION", { jobId, reason, actor }, job.generationId, actor);

    return job;
  }

  /**
   * Preview impact and blast radius before executing an evolution prompt.
   */
  public static previewChange(projectPath: string, feedbackPrompt: string): ChangePreviewReport {
    const recon = ProjectStateReconciler.reconcile(projectPath, null, null);
    const existingFiles = Object.keys(recon.reconciledState.diskFileHashes);

    const report = UserFeedbackEngine.processFeedback(feedbackPrompt, existingFiles, []);

    const directlyAffected = report.impact.directlyAffectedFiles || [];
    const filesToCreate = directlyAffected.filter((f) => !existingFiles.includes(f));
    const filesToModify = directlyAffected.filter((f) => existingFiles.includes(f));
    const filesPreserved = report.impact.preservedFiles || existingFiles.filter((f) => !directlyAffected.includes(f));


    return {
      changeType: report.impact.category,
      blastRadius: report.impact.blastRadius,
      affectedContracts: report.impact.requiresApiContractUpdate ? ["api"] : [],
      filesToCreate,
      filesToModify,
      filesPreserved,
      databaseChanges: report.impact.requiresSchemaMigration ? ["ADD_OR_MODIFY_MODELS"] : [],
      apiChanges: report.impact.requiresApiContractUpdate ? ["MODIFY_ROUTES"] : [],
      authorizationRequired: report.impact.category === "FEATURE_REMOVAL" && report.impact.requiresSchemaMigration,
      risk: report.impact.blastRadius === "LOCAL" ? "LOW" : report.impact.blastRadius === "FEATURE" ? "MEDIUM" : "HIGH",
      summary: report.summary,
    };

  }

  /**
   * Calculate diff between two generations.
   */
  public static getGenerationDiff(projectPath: string, fromGenId: string, toGenId: string): GenerationDiffReport {
    const jobs = JobStore.listJobs(projectPath);
    const fromJob = jobs.find((j) => j.generationId === fromGenId);
    const toJob = jobs.find((j) => j.generationId === toGenId);

    const created =
      toJob?.pipelineState?.TASK_EXECUTION?.details?.createdFiles ||
      toJob?.pipelineState?.EVOLUTION_EXECUTION?.details?.createdFiles ||
      [];
    const modified =
      toJob?.pipelineState?.TASK_EXECUTION?.details?.modifiedFiles ||
      toJob?.pipelineState?.EVOLUTION_EXECUTION?.details?.modifiedFiles ||
      [];
    const deleted =
      toJob?.pipelineState?.TASK_EXECUTION?.details?.deletedFiles ||
      toJob?.pipelineState?.EVOLUTION_EXECUTION?.details?.deletedFiles ||
      [];
    const preserved =
      toJob?.pipelineState?.TASK_EXECUTION?.details?.preservedFiles ||
      toJob?.pipelineState?.EVOLUTION_EXECUTION?.details?.preservedFiles ||
      [];

    return {
      projectId: toJob?.projectId || "unknown",
      fromGenerationId: fromGenId,
      toGenerationId: toGenId,
      filesCreated: created,
      filesModified: modified,
      filesDeleted: deleted,
      filesPreserved: preserved,
      contractHashChanges: {},
      summary: `Diff between ${fromGenId} and ${toGenId}: ${created.length} created, ${modified.length} modified, ${deleted.length} deleted.`,
    };

  }

  /**
   * Lookup job in active memory or fallback to JobStore.
   */
  public static getJob(jobId: string, projectPath?: string): GenerationJob | null {
    if (this.activeJobs.has(jobId)) {
      return this.activeJobs.get(jobId)!;
    }
    if (projectPath) {
      const stored = JobStore.getJob(projectPath, jobId);
      if (stored) this.activeJobs.set(jobId, stored);
      return stored;
    }
    return null;
  }

  /**
   * Continuous Operations APIs
   */
  public static async getProductionHealth(
    projectId: string,
    environment: any = "production",
    liveServerUrl?: string
  ) {
    return ProductionHealthMonitor.evaluateHealth(projectId, environment, liveServerUrl);
  }

  public static async executeDeployment(req: any) {
    return DeploymentOrchestrator.executeDeployment(req);
  }

  public static listIncidents(projectId: string) {
    return IncidentEngine.listIncidents(projectId);
  }

  public static getReleaseLineage(projectId: string) {
    return ReleaseLineageTracker.getLineage(projectId);
  }

  public static reset(): void {
    this.activeJobs.clear();
    ProgressEventEmitter.clear();
    TelemetryTracker.reset();
    AuditLog.clear();
  }
}


