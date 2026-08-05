import { FeatureContractValidator } from "../validation/feature-contract-validator.js";

export interface RealityCheckResult {
  passed: boolean;
  violationCount: number;
  report: string;
}

/**
 * RealityCheckerAgent
 *
 * Runs AFTER all code generation tasks complete.
 * Audits the generated project against feature contracts to prove that
 * every claimed feature is actually implemented — not mocked, hardcoded,
 * or faked with placeholder data.
 *
 * If violations are found, the result.passed = false and report contains
 * the full violation list for the self-healing loop to consume.
 */
export class RealityCheckerAgent {
  private readonly validator = new FeatureContractValidator();

  /**
   * Audit the project at the given output directory.
   * Returns a RealityCheckResult describing whether the project passes
   * the No Mock Data policy.
   */
  public audit(outputDirectory: string): RealityCheckResult {
    const violations = this.validator.validate(outputDirectory);
    const errors = violations.filter(v => v.severity === "error");
    const report = this.validator.formatViolations(violations);

    if (errors.length === 0) {
      console.log("[RealityChecker] ✓ All feature contracts satisfied.");
      return { passed: true, violationCount: 0, report };
    }

    console.warn(`[RealityChecker] 🔴 ${errors.length} violation(s) detected.`);
    for (const v of errors) {
      console.warn(`  ✗ [${v.feature}] ${v.file}:${v.line} — ${v.violation}`);
    }

    return { passed: false, violationCount: errors.length, report };
  }

  /**
   * Produce a healing prompt from the violation report.
   * This is passed to the RepairAgent / self-healing loop.
   */
  public buildHealingPrompt(
    originalRequest: string,
    result: RealityCheckResult,
    projectSummary: string
  ): string {
    return `The generated project failed the Reality Checker audit.
The following feature contracts were violated — meaning the project contains mock data,
hardcoded values, or fake implementations that were not caught by the build step.

Original User Request:
${originalRequest}

Reality Checker Report:
${result.report}

Project Context Summary:
${projectSummary}

Your task:
Fix every violation listed above by replacing mock/hardcoded values with real implementations.
For each violation:
  1. Identify the feature that is faked
  2. Implement the real logic (real parsing, real calculation, real persistence)
  3. If a library is needed (pdfjs-dist, jsPDF, mammoth), add the import and implement it
  4. Remove ALL hardcoded scores, static chart arrays, and setTimeout-based fake loading
  5. IF YOU IMPORT ANY NEW THIRD-PARTY NPM PACKAGES (e.g. jspdf, jspdf-autotable, html2canvas), LIST THEM AT THE VERY END OF YOUR RESPONSE AS:
NEW_DEPENDENCIES: package1, package2

Output ONLY the corrected files. Follow the standard file output format.`;
  }
}
