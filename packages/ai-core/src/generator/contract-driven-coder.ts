/**
 * ContractDrivenCoder
 *
 * The single-task execution worker for AEGIS.
 * Executes an authorized task under strict governance, import/export validation,
 * transactional rollback, and semantic duplicate prevention.
 */

import { existsSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Task } from "../planner/task.js";
import { TaskFileLockManager } from "../governance/file-ownership-registry.js";
import { TargetedContextMinimizer } from "../context/targeted-context-minimizer.js";
import { PromptComposer } from "../prompts/prompt-composer.js";
import { OutputContractValidator, type CodeChangeResult } from "../prompts/output-contract-validator.js";
import { PathValidator } from "../healing/path-validator.js";
import { SemanticDuplicateDetector } from "../governance/semantic-duplicate-detector.js";
import { ImportExportValidator } from "../governance/import-export-validator.js";
import { StubDetector } from "./stub-detector.js";
import { ArchitectureDriftValidator } from "../governance/architecture-drift-validator.js";
import { TransactionalRepairSystem } from "../healing/transactional-repair.js";
import { SelfHealer } from "../healing/self-healer.js";
import { FeatureCompletenessTracker } from "../governance/feature-completeness-tracker.js";
import type { ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import type { DomainContract } from "../governance/domain-contract.js";

export interface CoderExecutionResult {
  success: boolean;
  taskId: number;
  changedFiles: string[];
  outputFiles: string[];
  tokensIn?: number;
  tokensOut?: number;
  error?: string;
  repaired?: boolean;
}

export class ContractDrivenCoder {
  /**
   * Execute a single authorized Task under full AEGIS governance.
   */
  public static async executeTask(
    task: Task,
    projectPath: string,
    generatorFn: (prompt: string) => Promise<string>,
    options: {
      archContract?: ArchitectureContractV1;
      domainContract?: DomainContract;
      enableRepair?: boolean;
    } = {}
  ): Promise<CoderExecutionResult> {
    const ownedFiles = task.ownedFiles || [];

    // 1. Preflight File Lock Verification
    const lockCheck = TaskFileLockManager.getInstance().canAcquireLocks(task.id, ownedFiles);
    if (!lockCheck.canLock) {
      return {
        success: false,
        taskId: task.id,
        changedFiles: [],
        outputFiles: [],
        error: `FILE_LOCK_ERROR: Conflicting active locks on: [${lockCheck.conflictingFiles.join(", ")}]`,
      };
    }

    // 2. Create Transactional Checkpoint
    const checkpointId = TransactionalRepairSystem.createCheckpoint(
      projectPath,
      ownedFiles,
      { taskId: task.id, rootCause: `Task #${task.id}: ${task.title}` }
    );


    try {
      // 3. Extract Minimum Sufficient Context
      const context = TargetedContextMinimizer.buildContext(
        task,
        projectPath,
        options.archContract,
        options.domainContract
      );

      // 4. Compose Governed Prompt
      const composed = PromptComposer.compose({
        role: "CODER",
        projectId: "project",
        generationId: "gen_01",
        contracts: {
          architectureContract: options.archContract,
          domainContract: options.domainContract,
        },
        task,
        contextFiles: context.filesToRead,
      });

      // 5. Invoke Model
      const rawModelOutput = await generatorFn(composed.fullPromptText);

      // 6. Validate Output Schema
      const validation = OutputContractValidator.validateOutput<CodeChangeResult>(
        rawModelOutput,
        "CodeChangeResult"
      );

      if (!validation.isValid || !validation.parsed) {
        throw new Error(`INVALID_OUTPUT_SCHEMA: ${validation.errors.join("; ")}`);
      }

      const codeResult = validation.parsed;
      const changedFiles: string[] = [];

      // 7. Process and Validate Generated Files
      for (const item of codeResult.changedFiles) {
        const normalizedRelPath = item.path.replace(/\\/g, "/");

        // 7a. Path Validation
        const pathCheck = PathValidator.validatePath(normalizedRelPath, projectPath, {
          allowNewFiles: true,
          allowedFiles: ownedFiles,
        });
        if (!pathCheck.valid) {
          throw new Error(`PATH_VALIDATION_ERROR: ${pathCheck.reason}`);
        }



        // 7b. Semantic Duplicate Check
        const dupCheck = SemanticDuplicateDetector.checkBeforeWrite(normalizedRelPath);
        if (!dupCheck.allowed) {
          throw new Error(`SEMANTIC_DUPLICATE_ERROR: File "${normalizedRelPath}" is a duplicate alias for "${dupCheck.canonicalPath}".`);
        }

        // 7c. Stub & Fake Handler Check
        const stubCheck = StubDetector.detect(item.content);
        if (stubCheck.hasStubs && stubCheck.suspiciousLines.some(l => l.includes("console.log") && l.includes("onClick"))) {
          throw new Error(`FAKE_FEATURE_ERROR: Detected placeholder console.log-only button click handler in "${normalizedRelPath}".`);
        }

        // 7d. Import & Export Consistency Check
        const importExportCheck = ImportExportValidator.validateFile(
          projectPath,
          normalizedRelPath,
          item.content,
          {
            requiredExports: task.requiredExports,
            requiredImports: task.requiredImports,
          }
        );

        if (!importExportCheck.isValid) {
          const crit = importExportCheck.violations.find(v => v.severity === "CRITICAL");
          if (crit) {
            throw new Error(`IMPORT_EXPORT_VIOLATION [${crit.type}]: ${crit.message}`);
          }
        }

        // 7e. Architecture Drift & Server/Client Boundary Check
        const isFrontend = normalizedRelPath.startsWith("src/") || normalizedRelPath.includes("/client/");
        const lockedFramework = options.archContract?.frontend.framework || "React-Vite";
        if (isFrontend && (lockedFramework.includes("React") || lockedFramework.includes("Vite")) && (item.content.includes("next/router") || item.content.includes("next/navigation") || item.content.includes("next/link"))) {
          throw new Error(`ARCHITECTURE_DRIFT_ERROR: Next.js imports detected in locked React-Vite project for "${normalizedRelPath}".`);
        }


        // Write validated file to disk
        const fullPath = join(projectPath, normalizedRelPath);
        const parentDir = dirname(fullPath);
        if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
        writeFileSync(fullPath, item.content, "utf8");
        changedFiles.push(normalizedRelPath);
      }

      // 8. Commit Checkpoint on Success
      TransactionalRepairSystem.commit(checkpointId);

      // Update feature tracker if task is linked to a feature
      if (task.featureId) {
        FeatureCompletenessTracker.updateFeatureStatus(task.featureId, "IMPLEMENTED", {
          ownedFiles: changedFiles,
        });
      }

      return {
        success: true,
        taskId: task.id,
        changedFiles,
        outputFiles: changedFiles,
        tokensIn: composed.tokensEstimate,
        tokensOut: Math.ceil(rawModelOutput.length / 4),
      };
    } catch (err: any) {
      console.warn(`[ContractDrivenCoder] ⚠️ Task #${task.id} failed validation: ${err.message}. Triggering rollback...`);
      TransactionalRepairSystem.rollback(projectPath, checkpointId, err.message);


      return {
        success: false,
        taskId: task.id,
        changedFiles: [],
        outputFiles: [],
        error: err.message,
      };
    }
  }
}
