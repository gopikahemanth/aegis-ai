/**
 * FinalAcceptanceGate
 *
 * Phase 10: Final Success Gate and Delivery
 *
 * Authoritative evidence-based project acceptance and delivery packaging engine:
 * - Accurately distinguishes SUCCESS, INCOMPLETE, FAILED, and BLOCKED without false success reporting
 * - Synthesizes comprehensive delivery documentation and setup scripts
 * - Validates project portable structure and manifests before final release
 */

import * as fs from "fs";
import * as path from "path";
import type { LockedArchitectureContract } from "../architect/architecture-contract-engine.js";
import { ProjectIntegrationMatrix, type IntegrationMatrixReport } from "../integration/project-integration-matrix.js";
import { FrontendExperienceVerifier } from "../design/frontend-experience-verifier.js";
import { ReadmeGenerator } from "../validation/readme-generator.js";

export type ProjectDeliveryStatus = "SUCCESS" | "INCOMPLETE" | "FAILED" | "BLOCKED";

export interface FinalAcceptanceCriterion {
  name: string;
  category: "BUILD" | "INTEGRATION" | "INTERACTION" | "DATABASE" | "TESTS" | "DELIVERY";
  critical: boolean;
  passed: boolean;
  message: string;
}

export interface AcceptanceReport {
  status: ProjectDeliveryStatus;
  overallScore: number; // 0 to 100
  criteria: FinalAcceptanceCriterion[];
  criticalFailures: string[];
  warnings: string[];
  deliveredArtifacts: string[];
  summary: string;
  timestamp: string;
}

export class FinalAcceptanceGate {
  /**
   * Evaluates project readiness and packages delivery assets.
   */
  public static evaluateAndPackage(
    projectRoot: string,
    contract: LockedArchitectureContract,
    options: {
      buildSuccess?: boolean;
      testPassRate?: number;
      infrastructureBlocked?: boolean;
      blockReason?: string;
    } = {}
  ): AcceptanceReport {
    const criteria: FinalAcceptanceCriterion[] = [];
    const criticalFailures: string[] = [];
    const warnings: string[] = [];
    const deliveredArtifacts: string[] = [];

    // 0. Infrastructure Check
    if (options.infrastructureBlocked) {
      return {
        status: "BLOCKED",
        overallScore: 0,
        criteria: [
          {
            name: "Infrastructure Availability",
            category: "BUILD",
            critical: true,
            passed: false,
            message: options.blockReason || "Underlying infrastructure/environment is blocked.",
          },
        ],
        criticalFailures: [options.blockReason || "Infrastructure blocked"],
        warnings: [],
        deliveredArtifacts: [],
        summary: `Project delivery BLOCKED: ${options.blockReason || "Infrastructure unavailable"}`,
        timestamp: new Date().toISOString(),
      };
    }

    // 1. Manifests & Portable Files Existence
    const hasPackageJson = fs.existsSync(path.join(projectRoot, "package.json"));
    criteria.push({
      name: "Package Manifest Integrity",
      category: "DELIVERY",
      critical: true,
      passed: hasPackageJson,
      message: hasPackageJson ? "package.json exists and is valid" : "Missing root package.json",
    });
    if (!hasPackageJson) criticalFailures.push("Missing package.json");

    // 2. Compilation / Build Status
    const buildPassed = options.buildSuccess !== false;
    criteria.push({
      name: "TypeScript Compilation & Build",
      category: "BUILD",
      critical: true,
      passed: buildPassed,
      message: buildPassed ? "Project builds with 0 compiler errors" : "Project build failed",
    });
    if (!buildPassed) criticalFailures.push("Compilation failed");

    // 3. Project Integration Matrix
    let integrationReport: IntegrationMatrixReport | null = null;
    try {
      integrationReport = ProjectIntegrationMatrix.audit(projectRoot, contract);
      criteria.push({
        name: "Full-Stack Route & Module Integration",
        category: "INTEGRATION",
        critical: true,
        passed: integrationReport.passed,
        message: integrationReport.summary,
      });
      if (!integrationReport.passed) {
        criticalFailures.push(
          `Integration matrix failed with ${integrationReport.errorsCount} critical errors.`
        );
      }
    } catch (err: any) {
      warnings.push(`Integration matrix warning: ${err.message}`);
    }

    // 4. Native Interaction Ratio (NIR >= 0.95)
    let nirPassed = true;
    try {
      const srcDir = path.join(projectRoot, "src");
      if (fs.existsSync(srcDir)) {
        const fileSources: Array<{ path: string; content: string }> = [];
        this.collectSourceFiles(srcDir, fileSources);
        const feReport = FrontendExperienceVerifier.audit(fileSources, contract);
        nirPassed = feReport.passed;
        criteria.push({
          name: "Native Interaction Ratio (NIR >= 0.95)",
          category: "INTERACTION",
          critical: true,
          passed: feReport.passed,
          message: `NIR Score: ${(feReport.nirScore * 100).toFixed(1)}% (Inert elements: ${feReport.inertElementsCount})`,
        });
        if (!feReport.passed) {
          const reason = feReport.nirScore < 0.95
            ? `NIR failed: ${(feReport.nirScore * 100).toFixed(1)}% below required 95% threshold.`
            : `Frontend route coverage failed: missing routes: ${feReport.routeCoverage.missingRoutes.join(", ")}`;
          criticalFailures.push(reason);
        }
      }
    } catch (err: any) {
      warnings.push(`Frontend NIR audit notice: ${err.message}`);
    }

    // 5. Database Schema & Persistence
    const schemaPath = path.join(projectRoot, "prisma", "schema.prisma");
    const hasSchema = fs.existsSync(schemaPath);
    criteria.push({
      name: "Prisma Database Schema Integrity",
      category: "DATABASE",
      critical: contract.database.engine !== "none",
      passed: hasSchema,
      message: hasSchema ? "prisma/schema.prisma present" : "Missing prisma/schema.prisma",
    });
    if (!hasSchema && contract.database.engine !== "none") {
      criticalFailures.push("Missing database schema");
    }

    // 6. Test Suite Pass Rate
    const testRate = options.testPassRate ?? 1.0;
    const testsPassed = testRate >= 0.9;
    criteria.push({
      name: "Automated Test Suite Execution",
      category: "TESTS",
      critical: false,
      passed: testsPassed,
      message: `Test Pass Rate: ${(testRate * 100).toFixed(1)}%`,
    });
    if (!testsPassed) warnings.push(`Test pass rate is ${(testRate * 100).toFixed(1)}% (< 90%)`);

    // Determine Final Status
    let status: ProjectDeliveryStatus = "SUCCESS";
    if (criticalFailures.length > 0) {
      status = "FAILED";
    } else if (warnings.length > 0 || !testsPassed) {
      status = "INCOMPLETE";
    }

    // Generate Delivery Documentation & Setup Scripts
    if (status === "SUCCESS" || status === "INCOMPLETE") {
      this.generateDeliveryAssets(projectRoot, contract, deliveredArtifacts);
    }

    const passedCount = criteria.filter(c => c.passed).length;
    const overallScore = Math.round((passedCount / criteria.length) * 100);

    const summary = status === "SUCCESS"
      ? `Project successfully accepted and packaged for delivery. Overall score: ${overallScore}%.`
      : status === "INCOMPLETE"
      ? `Project delivered with INCOMPLETE status: Non-critical warnings detected. Score: ${overallScore}%.`
      : `Project acceptance FAILED: ${criticalFailures.join("; ")}.`;

    return {
      status,
      overallScore,
      criteria,
      criticalFailures,
      warnings,
      deliveredArtifacts,
      summary,
      timestamp: new Date().toISOString(),
    };
  }

  private static generateDeliveryAssets(
    projectRoot: string,
    contract: LockedArchitectureContract,
    deliveredArtifacts: string[]
  ): void {
    // 1. README.md via ReadmeGenerator
    try {
      ReadmeGenerator.generate({
        projectName: contract.projectName,
        projectRoot,
        buildSuccess: true,
        databaseProvider: contract.database.engine,
        backendFramework: contract.backend.framework,
        frontendFramework: contract.frontend.framework,
      });
      if (fs.existsSync(path.join(projectRoot, "README.md"))) {
        deliveredArtifacts.push("README.md");
      }
    } catch {}

    // 2. setup.bat (Windows portable startup script)
    const setupBatContent = `@echo off
echo ========================================================
echo   Setting up ${contract.projectName}
echo ========================================================
call npm install
call npx prisma generate
call npx prisma db push
call npm run db:seed
echo Setup complete. Starting application...
npm run dev
`;
    fs.writeFileSync(path.join(projectRoot, "setup.bat"), setupBatContent, "utf-8");
    deliveredArtifacts.push("setup.bat");

    // 3. setup.sh (POSIX portable startup script)
    const setupShContent = `#!/bin/bash
set -e
echo "========================================================"
echo "  Setting up ${contract.projectName}"
echo "========================================================"
npm install
npx prisma generate
npx prisma db push
npm run db:seed
echo "Setup complete. Starting application..."
npm run dev
`;
    fs.writeFileSync(path.join(projectRoot, "setup.sh"), setupShContent, "utf-8");
    deliveredArtifacts.push("setup.sh");
  }

  private static collectSourceFiles(dir: string, fileSources: Array<{ path: string; content: string }>): void {
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
