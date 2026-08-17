/**
 * GenerationJob Model
 *
 * Canonical representation of an AEGIS generation/evolution job within the control plane.
 */

export type JobStatus =
  | "QUEUED"
  | "ANALYZING"
  | "CLARIFYING"
  | "WAITING_FOR_AUTHORIZATION"
  | "PLANNING"
  | "CONTRACTING"
  | "GENERATING"
  | "VALIDATING"
  | "BUILDING"
  | "RUNNING"
  | "VERIFYING"
  | "REPAIRING"
  | "REGRESSION_TESTING"
  | "COMPLETED"
  | "FAILED"
  | "BLOCKED"
  | "CANCELLED"
  | "PAUSED"
  | "RESUMING";

export interface JobProgress {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  activeTasks: number;
  percentage: number;
}

export interface JobAuthorizationRequest {
  id: string;
  operation: string;
  category: "DESTRUCTIVE_MIGRATION" | "ARCHITECTURE_MIGRATION" | "BREAKING_API_CHANGE" | "FEATURE_REMOVAL";
  reason: string;
  requestedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  details?: Record<string, any>;
  decidedAt?: string;
  decidedBy?: string;
}

export interface JobTelemetrySnapshot {
  durationMs: number;
  totalLlmCalls: number;
  tokensIn: number;
  tokensOut: number;
  cacheHits: number;
  cacheMisses: number;
  repairAttempts: number;
  rollbackCount: number;
  buildDurationMs: number;
  runtimeDurationMs: number;
  apiChecksCount: number;
  browserChecksCount: number;
}

export interface GenerationJob {
  jobId: string;
  projectId: string;
  projectPath: string;
  generationId: string;
  parentGenerationId?: string;
  requestId: string;
  type: "INITIAL_GENERATION" | "INCREMENTAL_EVOLUTION" | "DRY_RUN";
  prompt: string;
  status: JobStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  currentStage: string;
  currentTask?: string;
  progress: JobProgress;
  pipelineState: Record<string, any>;
  contractHashes: Record<string, string>;
  verificationSummary?: string;
  authorizationState?: JobAuthorizationRequest;
  checkpointId?: string;
  telemetry: JobTelemetrySnapshot;
  finalStatus?: "SUCCESS" | "FAILED" | "BLOCKED" | "INCOMPLETE" | "UNVERIFIED";
  error?: string;
}
