/**
 * DesignTokenLinter
 *
 * Scans generated frontend JSX/TSX files for hardcoded Tailwind arbitrary colors
 * and AI-website cliché color patterns (e.g. bg-purple-600, from-indigo-500, etc.)
 * that violate the design system contract.
 *
 * Runs before the frontend approval gate and performs a single corrective healing pass
 * via CoderAgent if violations are detected.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import type { CoderAgent } from "../agents/coder-agent.js";
import type { Task } from "../planner/task.js";
import { PatchEngine } from "../healing/patch-engine.js";

export interface DesignTokenViolation {
  file: string;
  line: number;
  matchedClass: string;
  rule: string;
}

export interface DesignTokenLintReport {
  valid: boolean;
  violations: DesignTokenViolation[];
  scannedFilesCount: number;
  healed: boolean;
}

export class DesignTokenLinter {
  // Regex patterns matching generic hardcoded Tailwind colors & arbitrary gradients
  // Excludes standard neutrals (slate, stone, zinc, gray, neutral, white, black, transparent)
  private static readonly FORBIDDEN_CLASS_PATTERNS: Array<{ regex: RegExp; rule: string }> = [
    {
      regex: /\b(?:bg|text|border|ring)-(?:purple|indigo|violet|fuchsia)-(?:50|[1-9]00|950)\b/g,
      rule: "Hardcoded arbitrary purple/indigo palette. Use var(--color-primary) or design-system tokens.",
    },
    {
      regex: /\b(?:bg|text|border|ring)-(?:blue)-(?:600|700|800)\b/g,
      rule: "Hardcoded generic blue utility class. Use var(--color-primary) or design-system tokens.",
    },
    {
      regex: /\b(?:bg|text|border|ring)-(?:pink|rose|cyan|teal|emerald)-(?:500|600|700|800)\b/g,
      rule: "Hardcoded arbitrary palette utility class. Align with locked design system tokens.",
    },
    {
      regex: /\bfrom-(?:purple|indigo|violet|fuchsia|pink|blue|emerald|cyan)-(?:[1-9]00)\b/g,
      rule: "Generic AI gradient start class. Gradients must align with locked design tokens.",
    },
    {
      regex: /\bto-(?:purple|indigo|violet|fuchsia|pink|blue|emerald|cyan)-(?:[1-9]00)\b/g,
      rule: "Generic AI gradient end class. Gradients must align with locked design tokens.",
    },
    {
      regex: /\bvia-(?:purple|indigo|violet|fuchsia|pink|blue)-(?:[1-9]00)\b/g,
      rule: "Generic AI gradient middle class. Gradients must align with locked design tokens.",
    },
  ];

  /**
   * Scans all .tsx and .jsx files in the project's src/ folder.
   */
  public static scanProject(projectPath: string): { violations: DesignTokenViolation[]; scannedFilesCount: number } {
    const srcDir = join(projectPath, "src");
    if (!existsSync(srcDir)) {
      return { violations: [], scannedFilesCount: 0 };
    }

    const files = this.collectSourceFiles(srcDir);
    const violations: DesignTokenViolation[] = [];

    for (const file of files) {
      // Skip design system token definitions themselves
      const rel = relative(projectPath, file).replace(/\\/g, "/");
      if (rel.includes("design-system/tokens") || rel.includes("index.css") || rel.includes(".test.")) {
        continue;
      }

      try {
        const content = readFileSync(file, "utf8");
        const lines = content.split(/\r?\n/);

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          for (const pattern of this.FORBIDDEN_CLASS_PATTERNS) {
            pattern.regex.lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = pattern.regex.exec(line)) !== null) {
              violations.push({
                file: rel,
                line: i + 1,
                matchedClass: match[0],
                rule: pattern.rule,
              });
            }
          }
        }
      } catch {}
    }

    return { violations, scannedFilesCount: files.length };
  }

  /**
   * Validates project styling against tokens and executes a single corrective healing pass if needed.
   */
  public static async validateAndHeal(
    projectPath: string,
    coderAgent: CoderAgent,
    architecture: any,
    architecturePlan: string
  ): Promise<DesignTokenLintReport> {
    const initialScan = this.scanProject(projectPath);

    if (initialScan.violations.length === 0) {
      console.log(`[DesignTokenLinter] ✓ Passed (${initialScan.scannedFilesCount} files clean, 0 violations).`);
      return {
        valid: true,
        violations: [],
        scannedFilesCount: initialScan.scannedFilesCount,
        healed: false,
      };
    }

    console.warn(
      `[DesignTokenLinter] ⚠️ Found ${initialScan.violations.length} hardcoded color violations across ${new Set(initialScan.violations.map(v => v.file)).size} files. Triggering corrective healing pass...`
    );

    // Build structured {file, line, matchedClass} -> token-variable repair mapping
    const repairMappings = initialScan.violations.map(v => {
      let tokenVar = "var(--color-primary)";
      if (v.matchedClass.startsWith("text-")) tokenVar = "var(--color-text-primary)";
      else if (v.matchedClass.startsWith("bg-")) tokenVar = "var(--color-surface)";
      else if (v.matchedClass.startsWith("border-")) tokenVar = "var(--color-border)";
      else if (v.matchedClass.startsWith("ring-")) tokenVar = "var(--color-primary)";
      else if (v.matchedClass.startsWith("from-") || v.matchedClass.startsWith("to-") || v.matchedClass.startsWith("via-")) tokenVar = "var(--color-primary)";
      return {
        file: v.file,
        line: v.line,
        matchedClass: v.matchedClass,
        tokenVariable: tokenVar,
      };
    });

    const violationSummary = repairMappings
      .slice(0, 20)
      .map(m => `- ${m.file}:${m.line} -> "${m.matchedClass}" => use CSS token [${m.tokenVariable}]`)
      .join("\n");

    const repairTask: Task = {
      id: "task_design_token_lint_repair",
      title: "Repair hardcoded Tailwind color classes with design system tokens",
      description: `Replace forbidden hardcoded classes with theme variables from src/design-system/tokens.ts.
Targeted Repair Mapping:
${violationSummary}

INSTRUCTIONS:
1. Replace hardcoded color utility classes with the suggested CSS token variable syntax, e.g. bg-[var(--color-surface)], text-[var(--color-primary)], border-[var(--color-border)].
2. Replace hardcoded gradient classes with clean solid tokens or theme variables.
3. Keep all JSX functionality, event handlers, and layout structures intact.`,
      dependencies: [],
      stage: "Frontend",
    } as any;

    try {
      const repairResult = await coderAgent.execute(
        repairTask,
        architecture,
        architecturePlan,
        `DESIGN TOKEN LINT REPAIR INSTRUCTION:\n${violationSummary}`,
        projectPath
      );

      const patchEngine = new PatchEngine();
      patchEngine.apply(repairResult.response, projectPath);

      // Re-scan after healing
      const secondScan = this.scanProject(projectPath);
      if (secondScan.violations.length === 0) {
        console.log("[DesignTokenLinter] ✓ Corrective healing successful! All hardcoded color classes removed.");
        return {
          valid: true,
          violations: [],
          scannedFilesCount: secondScan.scannedFilesCount,
          healed: true,
        };
      }

      console.warn(
        `[DesignTokenLinter] ⚠️ Residual violations remaining after healing (${secondScan.violations.length}). Reporting with warning.`
      );
      return {
        valid: false,
        violations: secondScan.violations,
        scannedFilesCount: secondScan.scannedFilesCount,
        healed: true,
      };
    } catch (err: any) {
      console.warn(`[DesignTokenLinter] ⚠️ Corrective healing pass failed: ${err.message}. Continuing with warning.`);
      return {
        valid: false,
        violations: initialScan.violations,
        scannedFilesCount: initialScan.scannedFilesCount,
        healed: false,
      };
    }
  }

  private static collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;

    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...this.collectSourceFiles(fullPath));
      } else if (entry.endsWith(".tsx") || entry.endsWith(".jsx")) {
        results.push(fullPath);
      }
    }
    return results;
  }
}
