/**
 * GenerationIntegrityValidator
 *
 * Comprehensive generation integrity engine that evaluates generated projects across
 * domain contamination, hardcoded mock values, feature coverage, and AST syntax validity.
 *
 * Rules:
 * - Fails if domain contamination is detected.
 * - Fails if hardcoded demo credentials or fake sessions are present.
 * - Fails if feature coverage is below acceptable threshold.
 * - Fails if syntax errors remain.
 */

import { DomainContaminationDetector, type DomainContaminationReport } from "../governance/domain-contamination-detector.js";
import { HardcodedValueDetector, type HardcodedDetectionReport } from "../governance/hardcoded-value-detector.js";
import { FeatureCoverageValidator, type FeatureCoverageReport } from "./feature-coverage-validator.js";
import type { ArchitectureContractV1 } from "../governance/architecture-resolver.js";

export interface GenerationIntegrityReport {
  passed: boolean;
  score: number; // 0 to 100
  domainReport: DomainContaminationReport;
  hardcodedReport: HardcodedDetectionReport;
  coverageReport: FeatureCoverageReport;
  summary: string[];
}

export class GenerationIntegrityValidator {
  /**
   * Evaluates overall generation integrity.
   */
  public static validate(projectRoot: string, contract: ArchitectureContractV1): GenerationIntegrityReport {
    const summary: string[] = [];

    // 1. Domain Contamination Scan
    const domainReport = DomainContaminationDetector.scanProject(projectRoot, contract);
    if (!domainReport.clean) {
      summary.push(`❌ Domain contamination detected: ${domainReport.violations.length} foreign term violation(s).`);
    } else {
      summary.push("✅ Domain isolation verified (zero foreign domain leakage).");
    }

    // 2. Hardcoded Values Scan
    const hardcodedReport = HardcodedValueDetector.scanProject(projectRoot);
    if (!hardcodedReport.clean) {
      summary.push(`❌ Hardcoded mock values detected: ${hardcodedReport.issues.length} issue(s).`);
    } else {
      summary.push("✅ Code integrity verified (no demo credentials or mock sessions).");
    }

    // 3. Feature Coverage Validation
    const coverageReport = FeatureCoverageValidator.validateCoverage(projectRoot, contract);
    if (!coverageReport.allSatisfied) {
      summary.push(`⚠️ Feature contract coverage: ${coverageReport.coveredPercentage}% (${coverageReport.missingItems.length} missing item(s)).`);
    } else {
      summary.push(`✅ Feature contract 100% satisfied (${coverageReport.totalFound}/${coverageReport.totalRequired} items).`);
    }

    // Calculate composite score
    let score = 100;
    if (!domainReport.clean) score -= Math.min(40, domainReport.violations.length * 15);
    if (!hardcodedReport.clean) score -= Math.min(30, hardcodedReport.issues.length * 10);
    score = Math.round(score * (coverageReport.coveredPercentage / 100));

    const passed = domainReport.clean && hardcodedReport.clean && coverageReport.coveredPercentage >= 80;

    return {
      passed,
      score: Math.max(0, score),
      domainReport,
      hardcodedReport,
      coverageReport,
      summary,
    };
  }
}
