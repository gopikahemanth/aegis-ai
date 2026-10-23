/**
 * Aegis AI — Phase 5 Brownfield & AST-Safe Editing Engine Types
 *
 * Strongly-typed definitions for natural-language edit intent,
 * project dependency analysis, change plans, transactional execution,
 * and checkpointed rollback (undo).
 */

export type EditOperationType =
  | "add_feature"
  | "remove_feature"
  | "modify_theme"
  | "modify_feature"
  | "evolve_model"
  | "fix_workflow"
  | "undo";

export interface EditIntentSpecification {
  intentId: string;
  rawRequest: string;
  operationType: EditOperationType;
  primaryTarget: string; // e.g. "wishlist", "blog", "theme", "pricing"
  scopeBoundaries: {
    strictlyTargeted: boolean;
    allowedRoutes: string[];
    allowedFiles: string[];
    forbiddenFiles: string[];
  };
  isDestructive: boolean;
  rollbackStrategy: "atomic_checkpoint" | "git_revert";
  notes?: string;
}

export interface ProjectDependencySummary {
  projectRoot: string;
  framework: string;
  entryPoints: string[];
  routesFile?: string;
  routes: Array<{ path: string; componentName: string; filePath?: string }>;
  navigationFiles: string[];
  featureOwnedFiles: Map<string, string[]>; // featureKey -> relativeFilePaths
  sharedFiles: string[];
  userModifiedFiles: string[];
  schemaPath?: string;
  models: string[];
}

export interface EditFileAction {
  filePath: string;
  action: "create" | "modify" | "delete";
  reason: string;
  isShared: boolean;
}

export interface AegisEditPlanV1 {
  version: "1.0.0";
  planId: string;
  createdAt: string;
  userRequest: string;
  operationType: EditOperationType;
  actions: EditFileAction[];
  affectedRoutes: string[];
  affectedModels: string[];
  requiredTests: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";
  isApplyAllowed: boolean;
  blockedReason?: string;
}

export interface FileSnapshotData {
  relativePath: string;
  existedBefore: boolean;
  contentBefore?: string;
}

export interface EditCheckpointData {
  checkpointId: string;
  createdAt: string;
  userRequest: string;
  operationType: EditOperationType;
  projectRoot: string;
  touchedFiles: string[];
  createdFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
  snapshots: Record<string, FileSnapshotData>;
  featureMatrixSnapshot?: string; // serialized JSON
  themeSnapshot?: string; // serialized JSON
  status: "APPLIED" | "ROLLED_BACK" | "FAILED";
}

export interface EditExecutionResult {
  success: boolean;
  checkpointId?: string;
  operationType: EditOperationType;
  touchedFiles: string[];
  plan?: AegisEditPlanV1;
  error?: string;
  rolledBack?: boolean;
  verificationReport?: {
    buildPassed: boolean;
    testsPassed: boolean;
    importsClean: boolean;
    details: string[];
  };
}
