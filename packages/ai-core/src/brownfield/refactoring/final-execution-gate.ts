/**
 * FinalExecutionGate — Aegis V2.3 Project 2 Phase 4.6
 *
 * Single authoritative pre-execution validation gate:
 * - Computes immutable executionFingerprint
 * - Enforces disk preimage immutability (detects disk drift -> PLAN_STALE)
 * - Validates Git clean state and branch availability
 * - Validates SemanticRefactoringVerifier results
 * - Enforces concurrency safety (rejects overlapping active transactions)
 * - 0 disk mutations, 0 branch creations on rejection
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { BrownfieldGitGuard } from "../brownfield-git-guard.js";
import { SemanticRefactoringVerifier } from "./semantic-refactoring-verifier.js";
import type {
  StructuralRefactoringPlan,
  StructuralRefactoringTransformation,
  StructuralRefactoringStatus,
} from "./structural-refactoring-contract.js";

export interface ExecutionGateResult {
  allowed: boolean;
  status: StructuralRefactoringStatus;
  executionFingerprint: string;
  reasons: string[];
  gitHead?: string;
}

export class FinalExecutionGate {
  private static activeTransactions: Set<string> = new Set();
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Evaluates all preconditions and computes a canonical execution fingerprint.
   */
  public evaluate(
    plan: StructuralRefactoringPlan,
    transformation?: StructuralRefactoringTransformation
  ): ExecutionGateResult {
    const reasons: string[] = [];
    let status: StructuralRefactoringStatus = "READY";

    // 1. Plan Readiness Check
    if (!plan.isApplyAllowed || plan.impactStatus !== "READY") {
      reasons.push(`Plan is not ready for execution (status: ${plan.impactStatus})`);
      status = plan.impactStatus;
    }

    // 2. Transformation Readiness (if supplied)
    if (transformation && !transformation.isApplyAllowed) {
      reasons.push(`Transformation is blocked: ${transformation.blockedReasons.join("; ")}`);
      status = transformation.status;
    }

    // 3. Disk Drift & Preimage Verification
    for (const [relPath, expectedHash] of Object.entries(plan.preimages)) {
      const fullPath = resolve(this.projectRoot, relPath);
      let currentHash = "";
      if (existsSync(fullPath)) {
        currentHash = createHash("sha256").update(readFileSync(fullPath)).digest("hex");
      } else {
        currentHash = createHash("sha256").update("").digest("hex");
      }

      if (currentHash !== expectedHash) {
        status = "PLAN_STALE";
        reasons.push(`Disk drift detected for "${relPath}". Preimage mismatch.`);
      }
    }

    // 4. Git Preflight Verification
    const gitPreflight = BrownfieldGitGuard.evaluatePreflight(this.projectRoot, plan.affectedFiles);
    if (gitPreflight.status === "DIRTY_TARGET_CONFLICT") {
      if (status === "READY") {
        status = "GIT_DIRTY_TARGET";
      }
      reasons.push(`Target files contain uncommitted changes: ${gitPreflight.conflictingFiles?.join(", ")}`);
    }

    // 5. In-Memory Semantic Verification (only if preimages match)
    let verificationHash = "VERIFY_SKIPPED";
    if (status === "READY") {
      const verifier = new SemanticRefactoringVerifier(this.projectRoot);
      const semanticResult = verifier.verify(plan, { skipTests: true, skipBuild: true });
      verificationHash = semanticResult.verificationHash;
      if (!semanticResult.passed) {
        status = semanticResult.status as any;
        reasons.push(...semanticResult.errors);
      }
    }

    // 6. Concurrency Safety: Check overlapping active transactions
    for (const file of plan.affectedFiles) {
      const lockKey = `${this.projectRoot}:${file}`;
      if (FinalExecutionGate.activeTransactions.has(lockKey)) {
        status = "BLOCKED";
        reasons.push(`Concurrency conflict: File "${file}" is currently locked by another active transaction.`);
      }
    }

    // 7. Canonical Execution Fingerprint Generation
    const sortedPreimages = Object.keys(plan.preimages)
      .sort()
      .map(k => `${k}:${plan.preimages[k]}`)
      .join(";");

    const patchHash = transformation ? transformation.patchHash : plan.patchHash;
    const gitHead = gitPreflight.gitState.headCommit || "HEAD_UNINITIALIZED";

    const fingerprintPayload = [
      plan.planHash,
      patchHash,
      verificationHash,
      sortedPreimages,
      gitHead,
    ].join("|");

    const executionFingerprint = createHash("sha256")
      .update(fingerprintPayload)
      .digest("hex");

    const allowed = status === "READY" && reasons.length === 0;

    return {
      allowed,
      status: allowed ? "READY" : status,
      executionFingerprint,
      reasons,
      gitHead,
    };
  }

  /**
   * Acquires in-memory locks for affected files during execution.
   */
  public static acquireLocks(projectRoot: string, files: string[]): void {
    const cleanRoot = projectRoot.replace(/\\/g, "/");
    for (const f of files) {
      this.activeTransactions.add(`${cleanRoot}:${f}`);
    }
  }

  /**
   * Releases in-memory locks for affected files.
   */
  public static releaseLocks(projectRoot: string, files: string[]): void {
    const cleanRoot = projectRoot.replace(/\\/g, "/");
    for (const f of files) {
      this.activeTransactions.delete(`${cleanRoot}:${f}`);
    }
  }
}
