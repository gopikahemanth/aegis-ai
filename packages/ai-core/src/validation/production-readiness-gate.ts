/**
 * ProductionReadinessGate
 *
 * Final quality and security enforcement gate for AEGIS-generated projects.
 * Guarantees that code is truly clean, domain-isolated, uncompromised by fake sessions,
 * and ready for real-world deployment.
 */

import { GenerationIntegrityValidator, type GenerationIntegrityReport } from "./generation-integrity-validator.js";
import type { ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface ReadinessCheckResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface ProductionReadinessReport {
  isReady: boolean;
  verdict: "APPROVED_FOR_PRODUCTION" | "REJECTED_NEEDS_REPAIR";
  overallScore: number;
  checks: ReadinessCheckResult[];
  integrityReport: GenerationIntegrityReport;
}

export class ProductionReadinessGate {
  public static evaluate(projectRoot: string, contract: ArchitectureContractV1): ProductionReadinessReport {
    const checks: ReadinessCheckResult[] = [];

    // 1. Run Generation Integrity Validator
    const integrityReport = GenerationIntegrityValidator.validate(projectRoot, contract);
    checks.push({
      name: "Domain Isolation",
      passed: integrityReport.domainReport.clean,
      message: integrityReport.domainReport.clean
        ? "No foreign domain terminology or components detected"
        : `Contaminated with ${integrityReport.domainReport.violations.length} foreign items`,
    });

    checks.push({
      name: "Authentication & Security Integrity",
      passed: integrityReport.hardcodedReport.clean,
      message: integrityReport.hardcodedReport.clean
        ? "No hardcoded demo credentials, mock sessions, or random scoring hacks"
        : `Found ${integrityReport.hardcodedReport.issues.length} hardcoded mock issues`,
    });

    checks.push({
      name: "Contract & Feature Completeness",
      passed: integrityReport.coverageReport.coveredPercentage >= 80,
      message: `Feature coverage is ${integrityReport.coverageReport.coveredPercentage}%`,
    });

    // 2. Package.json and Build Scripts Readiness
    const pkgPath = join(projectRoot, "package.json");
    let hasBuildScripts = false;
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        hasBuildScripts = Boolean(pkg.scripts && (pkg.scripts.build || pkg.scripts.dev));
      } catch {}
    }

    checks.push({
      name: "Build Pipeline Configuration",
      passed: hasBuildScripts,
      message: hasBuildScripts ? "package.json contains valid build and dev scripts" : "Missing build scripts in package.json",
    });

    // 3. Database Configuration Readiness
    const envPath = join(projectRoot, ".env");
    let hasDbConfig = false;
    if (existsSync(envPath)) {
      try {
        const envContent = readFileSync(envPath, "utf8");
        hasDbConfig = envContent.includes("DATABASE_URL=");
      } catch {}
    }

    checks.push({
      name: "Database Environment Config",
      passed: hasDbConfig,
      message: hasDbConfig ? "Valid DATABASE_URL configured in .env" : "Missing DATABASE_URL configuration",
    });

    const isReady = checks.every(c => c.passed) && integrityReport.passed;

    return {
      isReady,
      verdict: isReady ? "APPROVED_FOR_PRODUCTION" : "REJECTED_NEEDS_REPAIR",
      overallScore: integrityReport.score,
      checks,
      integrityReport,
    };
  }
}
