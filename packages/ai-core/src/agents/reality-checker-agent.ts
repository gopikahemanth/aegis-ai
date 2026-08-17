import { FeatureContractValidator } from "../validation/feature-contract-validator.js";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface RealityCheckResult {
  passed: boolean;
  violationCount: number;
  report: string;
  violations: Array<{ feature: string; file: string; line: number; violation: string; severity: "error" | "warning" }>;
}

export class RealityCheckerAgent {
  private readonly validator = new FeatureContractValidator();

  /**
   * Audit the project at the given output directory.
   * Checks both feature contract validations AND contextual fake feature patterns
   * (e.g. empty event handlers, mock constants, fake setTimeout loading).
   */
  public audit(outputDirectory: string): RealityCheckResult {
    const contractViolations = this.validator.validate(outputDirectory);
    const contextualViolations = this.auditSourceFiles(outputDirectory);

    const allViolations = [...contractViolations, ...contextualViolations];
    const errors = allViolations.filter(v => v.severity === "error");
    const report = this.formatReport(allViolations);

    if (errors.length === 0) {
      console.log("[RealityChecker] ✓ All feature reality checks passed.");
      return { passed: true, violationCount: 0, report, violations: allViolations };
    }

    console.warn(`[RealityChecker] 🔴 ${errors.length} reality violation(s) detected.`);
    for (const v of errors.slice(0, 5)) {
      console.warn(`  ✗ [${v.feature}] ${v.file}:${v.line} — ${v.violation}`);
    }

    return { passed: false, violationCount: errors.length, report, violations: allViolations };
  }

  private auditSourceFiles(outputDirectory: string): Array<{ feature: string; file: string; line: number; violation: string; severity: "error" | "warning" }> {
    const violations: Array<{ feature: string; file: string; line: number; violation: string; severity: "error" | "warning" }> = [];
    const sourceFiles = this.collectSourceFiles(outputDirectory);

    const FAKE_PATTERNS = [
      { pattern: /onClick=\{?\s*\(\)\s*=>\s*\{\s*\}\s*\}?/, desc: "Empty onClick handler without business logic", severity: "error" as const },
      { pattern: /onClick=\{?\s*\(\)\s*=>\s*console\.log\([^)]*\)\s*\}?/, desc: "Console.log-only onClick handler", severity: "error" as const },
      { pattern: /setTimeout\(\s*\(\)\s*=>\s*\{\s*set(?:Loading|Score|Data)\([^)]*\)\s*;\s*\}\s*,\s*\d{3,5}\)/, desc: "Fake setTimeout simulation pretending to process data", severity: "error" as const },
      { pattern: /const\s+mock(?:Data|Result|Score|Users|Items)\s*=/, desc: "Hardcoded mock dataset in production component", severity: "warning" as const },
    ];

    for (const fullPath of sourceFiles) {
      const rel = relative(outputDirectory, fullPath).replace(/\\/g, "/");
      try {
        const content = readFileSync(fullPath, "utf8");
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;

          for (const p of FAKE_PATTERNS) {
            if (p.pattern.test(line)) {
              violations.push({
                feature: "Reality Check",
                file: rel,
                line: i + 1,
                violation: p.desc,
                severity: p.severity,
              });
              break;
            }
          }
        }
      } catch {}
    }

    return violations;
  }

  private collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    const scan = (d: string) => {
      if (!existsSync(d)) return;
      try {
        for (const entry of readdirSync(d)) {
          if (["node_modules", ".git", "dist", ".aegis"].includes(entry)) continue;
          const full = join(d, entry);
          if (statSync(full).isDirectory()) scan(full);
          else if (/\.(tsx|ts|jsx|js)$/.test(entry) && !entry.endsWith(".d.ts")) results.push(full);
        }
      } catch {}
    };
    scan(join(dir, "src"));
    scan(join(dir, "server"));
    return results;
  }

  private formatReport(violations: Array<{ feature: string; file: string; line: number; violation: string; severity: "error" | "warning" }>): string {
    if (violations.length === 0) return "All features verified as real implementations.";
    return violations.map(v => `[${v.severity.toUpperCase()}] ${v.file}:${v.line} (${v.feature}): ${v.violation}`).join("\n");
  }

  public buildHealingPrompt(
    originalRequest: string,
    result: RealityCheckResult,
    projectSummary: string
  ): string {
    return `The generated project failed the Reality Checker audit.
The following feature implementations were flagged as mock/fake/unimplemented:

Original User Request:
${originalRequest}

Reality Checker Report:
${result.report}

Project Context Summary:
${projectSummary}

Your task:
Replace all empty handlers, simulated setTimeout delays, and hardcoded mock data with real implementations.
Output ONLY the corrected files.`;
  }
}
