import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { RepositoryScanner } from "./repository-scanner.js";
import { BrownfieldGitGuard } from "./brownfield-git-guard.js";
import { BrownfieldWriteGuard } from "./brownfield-write-guard.js";
import { BrownfieldTransactionManager } from "./brownfield-transaction-manager.js";
import { ImpactAnalyzer } from "./impact-analyzer.js";
import { SurgicalPatchPlanner } from "./surgical-patch-planner.js";
import { BaselineRegressionValidator, type BaselineRegressionReport } from "./baseline-regression-validator.js";
import { PatchEngine } from "../healing/patch-engine.js";
import { TestGeneratorAgent } from "../agents/test-generator-agent.js";
import { InProjectTestRunner } from "../validation/in-project-test-runner.js";
import { execSync } from "node:child_process";
import type { BrownfieldProjectContract, PlannedPatch } from "./brownfield-contract.js";

export interface BrownfieldExecutionResult {
  success: boolean;
  contract: BrownfieldProjectContract;
  touchedFiles: string[];
  regressionReport?: BaselineRegressionReport;
  checkpointRolledBack?: boolean;
  error?: string;
}

export class BrownfieldWorkflowEngine {
  private readonly patchEngine = new PatchEngine();
  private readonly txManager = new BrownfieldTransactionManager();

  /**
   * Executes a safe additive brownfield modification on an existing repository.
   */
  public async execute(
    projectRoot: string,
    request: string,
    featureModule: {
      newFiles: { path: string; content: string; symbols?: string[] }[];
      surgicalEdits: { path: string; search: string; replace: string; reason: string; symbols?: string[] }[];
    }
  ): Promise<BrownfieldExecutionResult> {
    console.log(`[BrownfieldWorkflowEngine] 🛡️ Starting Brownfield Additive Modification in: ${projectRoot}`);

    // 1. Scan repository
    const contract = RepositoryScanner.scan(projectRoot, request);
    if (contract.mode !== "BROWNFIELD") {
      return {
        success: false,
        contract,
        touchedFiles: [],
        error: "INVALID_MODE: RepositoryScanner detected target directory is not an existing project.",
      };
    }

    // 2. Compute impact set
    const impact = ImpactAnalyzer.analyze(contract, request);
    contract.impactSet = impact;

    const plannedTargetFiles = [
      ...featureModule.newFiles.map(f => f.path),
      ...featureModule.surgicalEdits.map(e => e.path),
    ];

    // 3. Git pre-flight check
    const gitPreflight = BrownfieldGitGuard.evaluatePreflight(projectRoot, plannedTargetFiles);
    if (!gitPreflight.allowed) {
      console.warn(`[BrownfieldWorkflowEngine] 🛑 Preflight check failed: ${gitPreflight.reason}`);
      return {
        success: false,
        contract,
        touchedFiles: [],
        error: gitPreflight.reason,
      };
    }

    // 4. Plan surgical patches & validate write safety
    const planResult = SurgicalPatchPlanner.planPatches(
      contract,
      featureModule.newFiles,
      featureModule.surgicalEdits
    );

    if (!planResult.success) {
      console.warn(`[BrownfieldWorkflowEngine] 🛑 Patch planning failed: ${planResult.error}`);
      return {
        success: false,
        contract,
        touchedFiles: [],
        error: planResult.error,
      };
    }

    contract.plannedPatches = planResult.plannedPatches;

    // Validate write guard for every planned patch
    for (const patch of contract.plannedPatches) {
      const writeCheck = BrownfieldWriteGuard.validateWrite(projectRoot, patch.filePath, patch.operation);
      if (!writeCheck.allowed) {
        return {
          success: false,
          contract,
          touchedFiles: [],
          error: writeCheck.reason,
        };
      }
    }

    // 5. Capture pre-change test baseline
    const baselineReport = await BaselineRegressionValidator.captureBaseline(projectRoot);
    contract.testInventory.baselinePassedTests = baselineReport.passedTests;
    contract.testInventory.baselineTotalTests = baselineReport.totalTests;
    contract.testInventory.baselineExitCode = baselineReport.status === "PASS" ? 0 : 1;

    // 6. Create transaction checkpoint
    const checkpointId = this.txManager.createCheckpoint(projectRoot, plannedTargetFiles);
    contract.checkpointId = checkpointId;

    const touchedFiles: string[] = [];

    try {
      // 7. Apply new files and surgical patches
      for (const patch of contract.plannedPatches) {
        if (patch.operation === "CREATE" && patch.newContent) {
          const fullPath = join(projectRoot, patch.filePath);
          writeFileSync(fullPath, patch.newContent, "utf8");
          touchedFiles.push(patch.filePath);
          console.log(`[BrownfieldWorkflowEngine] ✓ Created new isolated module: ${patch.filePath}`);
        } else if (patch.operation === "SURGICAL_PATCH" && patch.patchBlocks) {
          for (const block of patch.patchBlocks) {
            const patchFormatted = SurgicalPatchPlanner.formatSearchReplaceBlock(
              patch.filePath,
              block.search,
              block.replace
            );
            this.patchEngine.apply(patchFormatted, projectRoot);
            if (!touchedFiles.includes(patch.filePath)) touchedFiles.push(patch.filePath);
          }
          console.log(`[BrownfieldWorkflowEngine] ✓ Surgically patched: ${patch.filePath}`);
        }
      }

      // 8. Synthesize new feature tests via TestGeneratorAgent
      const testResult = await TestGeneratorAgent.generate({
        projectRoot,
        domainContract: {
          domainName: request,
          entities: [{ name: "FeatureItem", fields: [], kind: "domain" }],
          features: ["additive-feature"],
          contractHash: "brownfield_hash",
          createdAt: new Date().toISOString(),
        } as any,
      });

      if (testResult.generatedFiles.length > 0) {
        for (const tf of testResult.generatedFiles) {
          if (!touchedFiles.includes(tf)) touchedFiles.push(tf);
        }
      }

      // 9. Run post-change test suite and verify regression
      const postChangeReport = InProjectTestRunner.run(projectRoot);
      const regressionReport = BaselineRegressionValidator.evaluateRegression(
        baselineReport,
        postChangeReport,
        testResult.testCases.length
      );

      if (regressionReport.hasRegression) {
        console.warn(`[BrownfieldWorkflowEngine] 🛑 ${regressionReport.regressionMessage}. Rolling back...`);
        this.txManager.rollback(checkpointId);
        return {
          success: false,
          contract,
          touchedFiles: [],
          regressionReport,
          checkpointRolledBack: true,
          error: regressionReport.regressionMessage,
        };
      }

      // 10. Verify build
      try {
        const pkgPath = join(projectRoot, "package.json");
        if (existsSync(pkgPath)) {
          const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
          if (pkg.scripts?.build) {
            execSync("npm run build", { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
          }
        }
      } catch (err: any) {
        console.warn(`[BrownfieldWorkflowEngine] 🛑 Build verification failed. Rolling back...`);
        this.txManager.rollback(checkpointId);
        return {
          success: false,
          contract,
          touchedFiles: [],
          regressionReport,
          checkpointRolledBack: true,
          error: "BUILD_FAILED: Build command failed after applying brownfield patches.",
        };
      }

      // 11. Commit checkpoint & stage explicitly touched files only
      this.txManager.commit(checkpointId);

      if (gitPreflight.gitState.isGitRepo) {
        BrownfieldGitGuard.commitTouchedFiles(
          projectRoot,
          touchedFiles,
          `feat: add ${request.slice(0, 50)} via Aegis AI`
        );
      }

      console.log(`[BrownfieldWorkflowEngine] 🎉 Brownfield feature addition complete and verified!`);
      return {
        success: true,
        contract,
        touchedFiles,
        regressionReport,
      };
    } catch (err: any) {
      console.error(`[BrownfieldWorkflowEngine] Exception during modification: ${err.message}. Rolling back...`);
      this.txManager.rollback(checkpointId);
      return {
        success: false,
        contract,
        touchedFiles: [],
        checkpointRolledBack: true,
        error: err.message,
      };
    }
  }
}
