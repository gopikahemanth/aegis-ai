import type { ExecutionStage } from "../execution/stage.js";

export type TaskDependencyType =
  | "HARD"
  | "SOFT"
  | "DATA"
  | "FILE"
  | "CONTRACT"
  | "RUNTIME";

export type TaskExecutionStatus =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "PASSED"
  | "FAILED"
  | "BLOCKED"
  | "STALE"
  | "CANCELLED"
  | "REPAIRING"
  | "RETRYING"
  | "pending"
  | "running"
  | "completed"
  | "failed";

/**
 * ContractHashes embedded in a task.
 * Allows stale detection: if hashes mismatch, the task must be regenerated.
 */
export interface TaskContractHashes {
  architectureHash?: string;
  domainHash?: string;
  dataHash?: string;
  apiHash?: string;
  fileGraphHash?: string;
  technologyHash?: string;
  dependencyHash?: string;
}

/**
 * AcceptanceCriterion — a verifiable claim that must be true for the task to be "done".
 */
export interface AcceptanceCriterion {
  /** What must be true */
  description: string;
  /** Optional shell command to verify e.g. "pnpm tsc --noEmit" */
  verificationCommand?: string;
}

export interface Task {
  id: number;
  taskId?: string | number;

  title: string;

  description: string;

  completed: boolean;

  stage?: ExecutionStage;

  priority?: number;

  dependencies?: number[];

  dependencyTypes?: Record<string | number, TaskDependencyType>;

  estimatedComplexity?: number;

  estimatedCost?: number;

  estimatedDuration?: number;

  executionTimeMs?: number;

  status?: TaskExecutionStatus;

  // ── Contract-binding fields ──────────────────────────────────────────────

  /** The feature this task implements e.g. "security-scan", "auth" */
  featureId?: string;

  /**
   * Canonical relative file paths this task owns and will create/modify.
   * No CoderAgent may write to a file not in this list without explicit override.
   */
  ownedFiles?: string[];

  /**
   * Canonical relative file paths this task is allowed to READ but not create.
   * Used to build the exact context window for CoderAgent.
   */
  allowedFiles?: string[];

  /**
   * Symbol names this task's files must export.
   * e.g. ["ScanPage", "useScan", "ScanService"]
   */
  requiredExports?: string[];

  /**
   * Symbols this task's files are expected to import from other canonical files.
   * e.g. ["api", "useAuth", "prisma"]
   */
  requiredImports?: string[];

  /**
   * Contract hashes at time of task generation.
   * Used by StaleArtifactDetector to detect stale tasks.
   */
  contractHashes?: TaskContractHashes;

  /**
   * Acceptance criteria that must all pass before the task is "done".
   */
  acceptanceCriteria?: AcceptanceCriterion[];

  /**
   * Explicit shell verification commands to run for targeted verification.
   */
  verificationCommands?: string[];

  // ── Legacy contract fields ───────────────────────────────────────────────

  architectureHash?: string;
  allowedTechnologies?: string[];
  forbiddenTechnologies?: string[];
  allowedPaths?: string[];
  forbiddenPaths?: string[];
}
