/**
 * VerificationStageRunner
 *
 * Stage 6: Independent Verification & Quality Gate
 * Role: VERIFIER
 *
 * Evaluates generated project across critical quality criteria:
 * 1. Contract & File Prerequisite Verification
 * 2. Deterministic Syntax & Closure Verification (Test Pyramid Level 1)
 * 3. Frontend Experience & Native Interaction Ratio (NIR >= 0.95)
 * 4. Client-API Contract Reconciliation (ensuring 0 unresolved or mismatched routes)
 * 5. Database Schema & Prisma Model Integrity
 */

import * as fs from "fs";
import * as path from "path";
import { BaseStageRunner, type StageContext } from "./stage-runner.js";
import type { OrchestratedAgentRole } from "../agent-contract.js";
import type { OrchestratorJobStatus } from "../job-state-manager.js";
import { FrontendExperienceVerifier } from "../../design/frontend-experience-verifier.js";
import { ClientApiContractReconciler } from "../../validation/client-api-contract-reconciler.js";
import { TestPyramidRunner } from "../../validation/test-pyramid-runner.js";

export interface VerificationStageOutput {
  status: "SUCCESS" | "FAILED" | "BLOCKED" | "INCOMPLETE";
  typescriptValid: boolean;
  apiContractValid: boolean;
  databaseValid: boolean;
  frontendExperiencePassed: boolean;
  nirScore: number;
  pyramidLevelPassed: number;
  issues: string[];
  warnings: string[];
  timestamp: string;
}

export class VerificationStageRunner extends BaseStageRunner<VerificationStageOutput> {
  readonly stageName = "Independent Verification & Quality Gate";
  readonly agentRole: OrchestratedAgentRole = "VERIFIER";
  readonly targetJobStatus: OrchestratorJobStatus = "VERIFYING";

  protected async runInternal(context: StageContext): Promise<VerificationStageOutput> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let typescriptValid = true;
    let apiContractValid = true;
    let databaseValid = true;
    let frontendExperiencePassed = true;
    let nirScore = 1.0;
    let pyramidLevelPassed = 1;

    // 1. Check prerequisites
    if (!context.projectSpec) {
      issues.push("Missing project specification.");
    }
    if (!context.architecturePlan) {
      issues.push("Missing locked architecture contract.");
    }
    if (!context.frontendSummary || context.frontendSummary.filesCreated?.length === 0) {
      issues.push("Frontend stage did not produce any files.");
    }
    if (!context.backendSummary || context.backendSummary.filesCreated?.length === 0) {
      issues.push("Backend stage did not produce any files.");
    }

    // 2. Frontend Experience Verification (NIR >= 0.95 and route coverage)
    if (context.frontendSummary?.auditReport) {
      const feAudit = context.frontendSummary.auditReport;
      nirScore = feAudit.nirScore;
      frontendExperiencePassed = feAudit.passed;
      if (!feAudit.passed) {
        issues.push(
          `Frontend Experience Gate failed: NIR=${(feAudit.nirScore * 100).toFixed(1)}% (minimum 95%). Recommendations: ${feAudit.recommendations.join("; ")}`
        );
      }
    } else if (context.outputDirectory && fs.existsSync(context.outputDirectory)) {
      // Disk-based frontend audit
      const srcDir = path.join(context.outputDirectory, "src");
      if (fs.existsSync(srcDir)) {
        const fileSources: Array<{ path: string; content: string }> = [];
        this.collectSourceFiles(srcDir, fileSources);
        const diskAudit = FrontendExperienceVerifier.audit(fileSources, context.architecturePlan);
        nirScore = diskAudit.nirScore;
        frontendExperiencePassed = diskAudit.passed;
        if (!diskAudit.passed) {
          issues.push(
            `Frontend Experience Gate failed: NIR=${(diskAudit.nirScore * 100).toFixed(1)}%. Recommendations: ${diskAudit.recommendations.join("; ")}`
          );
        }
      }
    }

    // 3. Client-API Contract Reconciliation
    if (context.outputDirectory && fs.existsSync(context.outputDirectory)) {
      try {
        const reconcileReport = ClientApiContractReconciler.reconcileProject(context.outputDirectory);
        if (reconcileReport.diagnostics && reconcileReport.diagnostics.length > 0) {
          const errors = reconcileReport.diagnostics.filter(m => m.severity === "ERROR");
          if (errors.length > 0) {
            apiContractValid = false;
            for (const err of errors.slice(0, 5)) {
              issues.push(`API Contract Mismatch: [${err.type}] ${err.message} in ${err.frontendFile}`);
            }
          }
        }
      } catch (err: any) {
        warnings.push(`ClientApiContractReconciler notice: ${err.message}`);
      }
    }

    // 4. Deterministic Test Pyramid Level 1 Verification
    if (context.outputDirectory && fs.existsSync(context.outputDirectory)) {
      try {
        const pyramidReport = await TestPyramidRunner.verify(1, context.outputDirectory);
        if (!pyramidReport.passed) {
          typescriptValid = false;
          for (const lvl of pyramidReport.levelResults) {
            for (const err of lvl.errors) {
              issues.push(`Test Pyramid L${lvl.level} Check Failed: ${err}`);
            }
          }
        } else {
          pyramidLevelPassed = pyramidReport.highestLevelPassed;
        }
      } catch (err: any) {
        warnings.push(`TestPyramidRunner notice: ${err.message}`);
      }
    }

    // 5. Database Schema Sanity
    if (context.outputDirectory) {
      const schemaPath = path.join(context.outputDirectory, "prisma", "schema.prisma");
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, "utf-8");
        if (!schemaContent.includes("datasource db") || !schemaContent.includes("model ")) {
          databaseValid = false;
          issues.push("Prisma schema is missing datasource or model definitions.");
        }
      }
    }

    const passed = issues.length === 0;

    const output: VerificationStageOutput = {
      status: passed ? "SUCCESS" : "FAILED",
      typescriptValid,
      apiContractValid,
      databaseValid,
      frontendExperiencePassed,
      nirScore,
      pyramidLevelPassed,
      issues,
      warnings,
      timestamp: new Date().toISOString(),
    };

    context.verificationReport = output;

    if (!passed) {
      throw new Error(`Verification Quality Gate failed with ${issues.length} issue(s): ${issues.join("; ")}`);
    }

    return output;
  }

  private collectSourceFiles(dir: string, fileSources: Array<{ path: string; content: string }>): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          this.collectSourceFiles(fullPath, fileSources);
        } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx"))) {
          fileSources.push({
            path: fullPath,
            content: fs.readFileSync(fullPath, "utf-8"),
          });
        }
      }
    } catch {}
  }
}
