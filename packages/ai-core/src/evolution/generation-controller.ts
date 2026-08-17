/**
 * GenerationController
 *
 * Coordinates the long-lived evolution lifecycle (G1 -> G2 -> ... -> G8).
 * Delegates execution, coding, healing, and validation to existing subsystems without duplication.
 */

import { ProjectGenerationLock } from "./project-generation-lock.js";
import { ProjectStateReconciler } from "./project-state-reconciler.js";
import { ProjectStateIntegrityValidator } from "./project-state-integrity-validator.js";
import { IncrementalChangeAnalyzer, type ChangeSet, type ChangeCategory } from "./incremental-change-analyzer.js";
import { ProjectIntelligenceIndex, type GenerationRecord } from "./project-intelligence-index.js";
import { DatabaseEvolutionManager } from "./database-evolution-manager.js";
import { ArchitectureResolver, type ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import { DomainContractManager, type DomainContract } from "../governance/domain-contract.js";
import { FinalSuccessGate } from "../validation/final-success-gate.js";
import { GoldenWorkflowRegistry } from "./golden-workflow-registry.js";

export interface EvolutionRequest {
  generationId: string;
  parentGenerationId?: string;
  projectId: string;
  projectPath: string;
  prompt: string;
  category?: ChangeCategory;
}

export interface EvolutionResult {
  success: boolean;
  generationId: string;
  parentGenerationId?: string;
  changeSet: ChangeSet;
  architectureContract: ArchitectureContractV1;
  domainContract: DomainContract;
  evidence: string[];
  error?: string;
}

export class GenerationController {
  /**
   * Execute an incremental evolution generation safely.
   */
  public static async executeGeneration(
    req: EvolutionRequest,
    taskExecutor: (tasks: any[]) => Promise<{ success: boolean; modifiedFiles: string[]; createdFiles: string[]; deletedFiles: string[] }>
  ): Promise<EvolutionResult> {
    console.log(`[GenerationController] 🔄 Starting Generation "${req.generationId}" for Project "${req.projectId}"...`);

    // 1. Acquire Project-Level Exclusive Lock
    const lockResult = ProjectGenerationLock.acquireLock(req.projectPath, req.generationId, req.projectId, req.prompt);
    if (!lockResult.acquired) {
      throw new Error(lockResult.error || `PROJECT_GENERATION_LOCKED: Could not acquire lock.`);
    }

    try {
      // 2. Validate Project Integrity
      ProjectStateIntegrityValidator.validateAndRecover(req.projectPath);

      // 3. Reconcile Existing State vs Locked Contracts
      const existingArch = ArchitectureResolver.loadContract(req.projectPath);
      const reconciliation = ProjectStateReconciler.reconcile(req.projectPath, existingArch, null);

      // 4. Analyze Incremental Change Impact & Blast Radius
      const existingFiles = Object.keys(reconciliation.reconciledState.diskFileHashes);
      const impact = IncrementalChangeAnalyzer.analyzeRequest(req.prompt, existingFiles);

      // 5. Resolve / Preserve Architecture Contract
      const arch = ArchitectureResolver.resolve(req.prompt, undefined, undefined, req.projectPath);
      ArchitectureResolver.writeContract(req.projectPath, arch);

      // 6. Lock Domain Contract
      const domain = DomainContractManager.lock(arch, arch.architectureHash!, req.projectPath);

      // 7. Execute Tasks via delegated task executor (ParallelScheduler + ContractDrivenCoder)
      const taskExecResult = await taskExecutor([]);
      if (!taskExecResult.success) {
        throw new Error(`Task execution failed during generation ${req.generationId}.`);
      }

      // 8. Capture Changed vs Preserved Files
      const postReconciliation = ProjectStateReconciler.reconcile(req.projectPath, arch, domain);
      const postFiles = Object.keys(postReconciliation.reconciledState.diskFileHashes);

      const createdFiles = taskExecResult.createdFiles || [];
      const modifiedFiles = taskExecResult.modifiedFiles || [];
      const deletedFiles = taskExecResult.deletedFiles || [];
      const preservedFiles = existingFiles.filter((f) => !modifiedFiles.includes(f) && !deletedFiles.includes(f));

      const changeSet: ChangeSet = {
        generationId: req.generationId,
        category: impact.category,
        blastRadius: impact.blastRadius,
        createdFiles,
        modifiedFiles,
        deletedFiles,
        preservedFiles,
        fileHashesBefore: reconciliation.reconciledState.diskFileHashes,
        fileHashesAfter: postReconciliation.reconciledState.diskFileHashes,
      };

      // 9. Verify File Preservation on untouched files
      const preservationCheck = IncrementalChangeAnalyzer.verifyFilePreservation(req.projectPath, changeSet);
      if (!preservationCheck.preservedValid) {
        throw new Error(`File preservation check failed: ${preservationCheck.corruptedFiles.join(", ")}`);
      }

      // 10. Record Generation in Project Intelligence Index
      const genRecord: GenerationRecord = {
        generationId: req.generationId,
        parentGenerationId: req.parentGenerationId,
        requestId: `req_${Date.now()}`,
        prompt: req.prompt,
        timestamp: new Date().toISOString(),
        contractHashes: {
          architectureHash: arch.architectureHash || "",
          domainHash: domain.domainHash || "",
        },
        changeSet,
        verificationPassed: true,
        evidenceSummary: `Verified ${createdFiles.length} created, ${modifiedFiles.length} modified, ${preservedFiles.length} preserved files.`,
      };

      ProjectIntelligenceIndex.recordGeneration(req.projectPath, req.projectId, genRecord);

      return {
        success: true,
        generationId: req.generationId,
        parentGenerationId: req.parentGenerationId,
        changeSet,
        architectureContract: arch,
        domainContract: domain,
        evidence: [genRecord.evidenceSummary],
      };
    } finally {
      // Always release generation lock
      ProjectGenerationLock.releaseLock(req.projectPath, req.generationId);
    }
  }
}
