/**
 * ExistingSymbolModifier
 *
 * End-to-end executor for safe existing-symbol brownfield modification,
 * integrating ImpactClosureEngine, ASTSymbolPatchPlanner, BrownfieldGitGuard,
 * BrownfieldTransactionManager, BaselineRegressionValidator, and InProjectTestRunner.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { ImpactClosureEngine, type TargetSymbolRequest, type ImpactClosureResult } from "./impact-closure-engine.js";
import { ASTSymbolPatchPlanner, type AstPatchOperation, type PatchPlanValidationStatus } from "./ast-symbol-patch-planner.js";
import { BrownfieldGitGuard } from "./brownfield-git-guard.js";
import { BrownfieldTransactionManager } from "./brownfield-transaction-manager.js";
import { BaselineRegressionValidator, type BaselineRegressionReport } from "./baseline-regression-validator.js";
import { TestGeneratorAgent } from "../agents/test-generator-agent.js";
import { InProjectTestRunner } from "../validation/in-project-test-runner.js";

import { PatchPreviewEngine, type PatchPreview } from "./patch-preview-engine.js";

export interface SymbolModificationRequest {
  targetSymbols: TargetSymbolRequest[];
  userRequest: string;
  patches: {
    filePath: string;
    operations: AstPatchOperation[];
  }[];
  preview?: PatchPreview;
}

export interface SymbolModificationResult {
  success: boolean;
  status: PatchPlanValidationStatus | "SUCCESS" | "TEST_REGRESSION" | "BUILD_FAILED" | "GIT_DIRTY_TARGET" | "IMPACT_ANALYSIS_INCOMPLETE" | "PLAN_STALE" | "FEATURE_BRANCH_EXISTS";
  impactClosure: ImpactClosureResult;
  touchedFiles: string[];
  regressionReport?: BaselineRegressionReport;
  checkpointRolledBack?: boolean;
  branchName?: string;
  error?: string;
}

export class ExistingSymbolModifier {
  private readonly projectRoot: string;
  private readonly txManager = new BrownfieldTransactionManager();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Executes an AST-safe modification of existing symbols across all impacted files.
   */
  public async modify(request: SymbolModificationRequest): Promise<SymbolModificationResult> {
    console.log(`[ExistingSymbolModifier] 🛡️ Starting existing-symbol modification: "${request.userRequest}"`);

    // 0. If PatchPreview is supplied, enforce strict immutability (PLAN_STALE / PATCH_DRIFT check)
    if (request.preview) {
      const immutabilityCheck = PatchPreviewEngine.verifyImmutability(request.preview, this.projectRoot);
      if (!immutabilityCheck.valid) {
        console.warn(`[ExistingSymbolModifier] 🛑 Plan immutability check failed: ${immutabilityCheck.error}`);
        return {
          success: false,
          status: "PLAN_STALE",
          impactClosure: {
            status: "CLOSED",
            targetSymbols: request.preview.requiredFiles.map(f => ({ filePath: f, symbolName: "all" })),
            mustChange: request.preview.requiredFiles,
            mayChange: request.preview.mayChangeFiles,
            readOnly: request.preview.readOnlyFiles,
            requiredTests: [],
            protected: [],
            callGraphEdges: [],
          },
          touchedFiles: [],
          error: immutabilityCheck.error,
        };
      }
    }

    // 1. Compute closed impact set
    const impactEngine = new ImpactClosureEngine(this.projectRoot);
    const closure = impactEngine.computeClosure(request.targetSymbols);

    if (closure.status !== "CLOSED") {
      const reasonMsg = closure.unresolvedReasons?.map(r => `${r.file}: ${r.reason}`).join("; ") || "Unknown unresolved references";
      console.warn(`[ExistingSymbolModifier] 🛑 Impact analysis incomplete: ${reasonMsg}`);
      return {
        success: false,
        status: "IMPACT_ANALYSIS_INCOMPLETE",
        impactClosure: closure,
        touchedFiles: [],
        error: `IMPACT_ANALYSIS_INCOMPLETE: ${reasonMsg}`,
      };
    }

    // 2. Validate patch plan convergence
    const plannedFiles = request.patches.map(p => p.filePath);
    const validation = ASTSymbolPatchPlanner.validatePatchPlan(closure, plannedFiles);

    if (validation.status !== "CLOSED_AND_CONVERGENT") {
      console.warn(`[ExistingSymbolModifier] 🛑 Patch convergence failed: ${validation.error}`);
      return {
        success: false,
        status: validation.status,
        impactClosure: closure,
        touchedFiles: [],
        error: validation.error,
      };
    }

    // 3. Git pre-flight check across ALL required files in closure
    const allRequiredFiles = [...closure.mustChange, ...closure.mayChange];
    const gitPreflight = BrownfieldGitGuard.evaluatePreflight(this.projectRoot, allRequiredFiles);

    if (!gitPreflight.allowed) {
      console.warn(`[ExistingSymbolModifier] 🛑 Git preflight blocked modification: ${gitPreflight.reason}`);
      return {
        success: false,
        status: "GIT_DIRTY_TARGET",
        impactClosure: closure,
        touchedFiles: [],
        error: gitPreflight.reason,
      };
    }

    // 3b. If preview requested a dedicated feature branch, isolate changes on that branch
    let activeBranch: string | undefined;
    if (request.preview?.branchName && gitPreflight.gitState.isGitRepo) {
      const branchRes = BrownfieldGitGuard.createFeatureBranch(request.preview.branchName, this.projectRoot);
      if (!branchRes.success) {
        console.warn(`[ExistingSymbolModifier] 🛑 Feature branch creation blocked: ${branchRes.error}`);
        return {
          success: false,
          status: "FEATURE_BRANCH_EXISTS",
          impactClosure: closure,
          touchedFiles: [],
          error: branchRes.error,
        };
      }
      activeBranch = request.preview.branchName;
    }

    // 4. Capture pre-change test baseline
    const baselineReport = await BaselineRegressionValidator.captureBaseline(this.projectRoot);

    // 5. Create transaction checkpoint
    const checkpointId = this.txManager.createCheckpoint(this.projectRoot, plannedFiles);
    const touchedFiles: string[] = [];

    try {
      // 6. Apply AST patches to each planned file
      for (const patchEntry of request.patches) {
        const fullPath = join(this.projectRoot, patchEntry.filePath);
        if (!existsSync(fullPath)) {
          throw new Error(`Target file "${patchEntry.filePath}" does not exist.`);
        }

        const originalContent = readFileSync(fullPath, "utf8");
        const updatedContent = ASTSymbolPatchPlanner.applyPatchesToContent(
          originalContent,
          patchEntry.operations
        );

        writeFileSync(fullPath, updatedContent, "utf8");
        touchedFiles.push(patchEntry.filePath);
        console.log(`[ExistingSymbolModifier] ✓ AST patched: ${patchEntry.filePath} (${patchEntry.operations.length} operations)`);
      }

      // 7. Synthesize new test case for modified behavior
      const testResult = await TestGeneratorAgent.generate({
        projectRoot: this.projectRoot,
        domainContract: {
          domainName: request.userRequest,
          entities: [{ name: "ModifiedSymbol", fields: [], kind: "domain" }],
          features: ["symbol-modification"],
          contractHash: "brownfield_sym_mod",
          createdAt: new Date().toISOString(),
        } as any,
      });

      if (testResult.generatedFiles.length > 0) {
        for (const tf of testResult.generatedFiles) {
          if (!touchedFiles.includes(tf)) touchedFiles.push(tf);
        }
      }

      // 8. Run test suite and check for regressions against baseline
      const postChangeReport = InProjectTestRunner.run(this.projectRoot);
      const regressionReport = BaselineRegressionValidator.evaluateRegression(
        baselineReport,
        postChangeReport,
        testResult.testCases.length
      );

      if (regressionReport.hasRegression) {
        console.warn(`[ExistingSymbolModifier] 🛑 ${regressionReport.regressionMessage}. Rolling back...`);
        this.txManager.rollback(checkpointId);
        return {
          success: false,
          status: "TEST_REGRESSION",
          impactClosure: closure,
          touchedFiles: [],
          regressionReport,
          checkpointRolledBack: true,
          error: regressionReport.regressionMessage,
        };
      }

      // 9. Verify build
      try {
        const pkgPath = join(this.projectRoot, "package.json");
        if (existsSync(pkgPath)) {
          const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
          if (pkg.scripts?.build) {
            execSync("npm run build", { cwd: this.projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
          }
        }
      } catch (err: any) {
        console.warn(`[ExistingSymbolModifier] 🛑 Build verification failed. Rolling back...`);
        this.txManager.rollback(checkpointId);
        return {
          success: false,
          status: "BUILD_FAILED",
          impactClosure: closure,
          touchedFiles: [],
          regressionReport,
          checkpointRolledBack: true,
          error: "BUILD_FAILED: TypeScript build failed after applying symbol patches.",
        };
      }

      // 10. Commit checkpoint & stage explicitly touched files only
      this.txManager.commit(checkpointId);

      if (gitPreflight.gitState.isGitRepo) {
        BrownfieldGitGuard.commitTouchedFiles(
          this.projectRoot,
          touchedFiles,
          `refactor: update ${request.userRequest.slice(0, 50)} via Aegis AI`
        );
      }

      console.log(`[ExistingSymbolModifier] 🎉 Existing-symbol modification complete and verified!`);
      return {
        success: true,
        status: "SUCCESS",
        impactClosure: closure,
        touchedFiles,
        regressionReport,
        branchName: activeBranch,
      };
    } catch (err: any) {
      console.error(`[ExistingSymbolModifier] Exception during modification: ${err.message}. Rolling back...`);
      this.txManager.rollback(checkpointId);
      return {
        success: false,
        status: "PATCH_TARGET_INVALID",
        impactClosure: closure,
        touchedFiles: [],
        checkpointRolledBack: true,
        error: err.message,
      };
    }
  }
}
