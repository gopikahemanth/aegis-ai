/**
 * Control Plane UI Types & Interfaces
 *
 * Direct mappings of AEGIS Control Plane models (Phases 1-12)
 * for consumption by the Phase 13 Operational UI layer.
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
  currentTaskName?: string;
  percentage: number;
}

export interface JobAuthorizationRequest {
  id: string;
  operation: string;
  category: "DESTRUCTIVE_MIGRATION" | "BREAKING_API_CHANGE" | "ARCHITECTURE_MODIFICATION";
  reason: string;
  targetFiles?: string[];
  requestedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
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

export interface StageEvidence {
  stage: string;
  status: "PASSED" | "FAILED" | "BLOCKED" | "SKIPPED" | "IN_PROGRESS";
  timestamp: string;
  evidenceId: string;
  summary: string;
  details?: any;
}

export interface GenerationJob {
  jobId: string;
  projectId: string;
  projectPath: string;
  generationId: string;
  parentGenerationId?: string;
  requestId: string;
  type: "INITIAL_GENERATION" | "INCREMENTAL_EVOLUTION" | "REPAIR_RETRY";
  prompt: string;
  status: JobStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  currentStage: string;
  progress: JobProgress;
  pipelineState: Record<string, StageEvidence>;
  contractHashes: Record<string, string>;
  authorizationState?: JobAuthorizationRequest;
  telemetry: JobTelemetrySnapshot;
  finalStatus?: "SUCCESS" | "FAILED" | "BLOCKED";
  verificationSummary?: string;
  error?: string;
}

export interface ProgressEvent {
  eventId: string;
  timestamp: string;
  jobId: string;
  projectId: string;
  generationId: string;
  type: string;
  stage: string;
  payload?: any;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  projectId: string;
  generationId?: string;
  action: string;
  category: "SECURITY" | "GOVERNANCE" | "JOB_LIFECYCLE" | "REPAIR" | "SCHEMA_MIGRATION";
  details: Record<string, any>;
  actor: string;
}

export interface SubsystemHealth {
  name: string;
  status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  latencyMs: number;
  lastChecked: string;
  details?: string;
}

export interface SystemHealthReport {
  overall: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  timestamp: string;
  subsystems: Record<string, SubsystemHealth>;
}

export interface ChangePreviewReport {
  changeType: string;
  blastRadius: "LOCAL" | "FEATURE" | "CROSS_FEATURE" | "API" | "DATA" | "ARCHITECTURE" | "GLOBAL";
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

export interface GenerationDiffReport {
  fromGenerationId: string;
  toGenerationId: string;
  filesCreated: string[];
  filesModified: string[];
  filesDeleted: string[];
  filesPreserved: string[];
  contractChanges: Array<{ contract: string; fromHash: string; toHash: string; status: "CHANGED" | "UNCHANGED" }>;
  apiDiff: Array<{ endpoint: string; method: string; change: "ADDED" | "MODIFIED" | "REMOVED" | "PRESERVED" }>;
  databaseDiff: Array<{ model: string; change: "ADDED" | "MODIFIED" | "REMOVED" | "PRESERVED" }>;
}

export interface VerificationDimensionResult {
  dimension: string;
  status: "PASSED" | "FAILED" | "NOT_APPLICABLE" | "RUNNING" | "PENDING";
  evidence: string;
  timestamp: string;
}

export interface ProductSuccessReport {
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  requirementScore: number;
  matrixPassedCount: number;
  matrixTotalCount: number;
  goldenWorkflowPassedRate: number;
  fakeImplementationsCount: number;
  summary: string;
  certificateId?: string;
}

export interface RuntimeProcessInfo {
  name: "frontend" | "backend";
  pid: number;
  port: number;
  status: "RUNNING" | "STOPPED" | "STARTING" | "FAILED";
  uptimeSeconds: number;
  url: string;
}

export interface ApiWorkflowStepResult {
  workflowId: string;
  operationId: string;
  method: string;
  path: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  durationMs: number;
  sideEffectVerified: boolean;
}

export interface BrowserWorkflowStepResult {
  name: string;
  type: string;
  url?: string;
  text?: string;
  passed: boolean;
  durationMs: number;
}
