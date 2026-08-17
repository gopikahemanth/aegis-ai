/**
 * DomainContaminationValidator
 *
 * Deterministic validator that detects cross-domain contamination in generated artifacts.
 *
 * The validator compares file names, paths, and source text against the current
 * DomainContract's suspiciousTerminology list. It does NOT use a hardcoded
 * global forbidden-word list — contamination is domain-relative.
 *
 * Example:
 *   Project: AI Code Security Reviewer
 *   "Resume" and "JobDescription" are suspicious → contamination detected.
 *
 *   Project: AI Resume Scanner
 *   "Resume" and "JobDescription" are NOT suspicious → allowed.
 *
 * This only flags terms that belong to a DIFFERENT known domain,
 * not generic English words.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { DomainContract } from "./domain-contract.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ContaminationSeverity = "error" | "warning";

export interface ContaminationViolation {
  file: string;
  line: number;
  term: string;
  context: string;
  severity: ContaminationSeverity;
  message: string;
}

export interface ContaminationReport {
  passed: boolean;
  violationCount: number;
  violations: ContaminationViolation[];
  summary: string;
}

// ─── DomainContaminationValidator ───────────────────────────────────────────

export class DomainContaminationValidator {
  /**
   * Scan the project source files for contamination from other domains.
   *
   * @param projectRoot  - Absolute path to the generated project root
   * @param domain       - The locked DomainContract for this project
   */
  public static validate(
    projectRoot: string,
    domain: DomainContract,
  ): ContaminationReport {
    if (!domain || domain.suspiciousTerminology.length === 0) {
      return {
        passed: true,
        violationCount: 0,
        violations: [],
        summary: "No suspicious terminology defined — contamination check skipped.",
      };
    }

    const sourceFiles = DomainContaminationValidator.collectSourceFiles(projectRoot);
    const violations: ContaminationViolation[] = [];

    // Build lookup set for fast matching
    const suspiciousSet = new Set(domain.suspiciousTerminology.map(t => t.toLowerCase()));

    for (const absPath of sourceFiles) {
      const relPath = relative(projectRoot, absPath).replace(/\\/g, "/");

      // Check path/filename itself
      const pathViolation = DomainContaminationValidator.checkPath(relPath, suspiciousSet, domain);
      if (pathViolation) violations.push(pathViolation);

      // Check file content
      try {
        const content = readFileSync(absPath, "utf8");
        const contentViolations = DomainContaminationValidator.checkContent(
          relPath, content, suspiciousSet, domain
        );
        violations.push(...contentViolations);
      } catch { /* skip unreadable */ }
    }

    const errors = violations.filter(v => v.severity === "error");
    const passed = errors.length === 0;

    const summary = passed
      ? `No cross-domain contamination detected in ${sourceFiles.length} source files.`
      : `CONTAMINATION DETECTED: ${errors.length} error(s), ${violations.length - errors.length} warning(s) across ${sourceFiles.length} files.`;

    if (!passed) {
      console.warn(`[DomainContamination] ❌ ${summary}`);
      errors.slice(0, 5).forEach(v =>
        console.warn(`  • ${v.file}:${v.line} — "${v.term}" (${v.message})`)
      );
    } else {
      console.log(`[DomainContamination] ✓ ${summary}`);
    }

    return { passed, violationCount: violations.length, violations, summary };
  }

  // ── Path checker ─────────────────────────────────────────────────────────

  private static checkPath(
    relPath: string,
    suspicious: Set<string>,
    domain: DomainContract,
  ): ContaminationViolation | null {
    const pathLower = relPath.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const term of suspicious) {
      const normalized = term.replace(/[^a-z0-9]/g, "");
      if (pathLower.includes(normalized) && normalized.length > 4) {
        return {
          file: relPath,
          line: 0,
          term,
          context: relPath,
          severity: "error",
          message: `File path contains term "${term}" from a different domain. ` +
            `Domain is "${domain.domainName}". This file likely belongs to a different project.`,
        };
      }
    }
    return null;
  }

  // ── Content checker ───────────────────────────────────────────────────────

  private static checkContent(
    relPath: string,
    content: string,
    suspicious: Set<string>,
    domain: DomainContract,
  ): ContaminationViolation[] {
    const violations: ContaminationViolation[] = [];
    const lines = content.split("\n");

    // Only check meaningful lines: JSX text, string literals, identifiers
    const MEANINGFUL_LINE = /[a-zA-Z]{4,}/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!MEANINGFUL_LINE.test(line)) continue;

      // Skip comments about domain context
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

      const lineLower = line.toLowerCase();

      for (const term of suspicious) {
        if (term.length < 5) continue; // Too short to be meaningful
        const normalized = term.replace(/[^a-z]/g, "");
        if (normalized.length < 5) continue;

        if (lineLower.includes(normalized)) {
          violations.push({
            file: relPath,
            line: i + 1,
            term,
            context: line.trim().slice(0, 100),
            severity: DomainContaminationValidator.classifySeverity(term, line),
            message: `Contains term "${term}" from a different domain. ` +
              `Current domain: "${domain.domainName}".`,
          });
          break; // One violation per line
        }
      }
    }

    return violations;
  }

  private static classifySeverity(term: string, line: string): ContaminationSeverity {
    // In identifiers, JSX labels, or route definitions = error
    const lineLower = line.toLowerCase();
    const termNorm = term.replace(/[^a-z]/g, "");

    // Check if term appears as an identifier (not in a comment or string that might be coincidental)
    const inIdentifier = new RegExp(`\\b${termNorm}\\b`, "i").test(line.replace(/[^a-zA-Z0-9_]/g, " "));
    if (inIdentifier) return "error";

    // In a string literal or generic usage = warning
    return "warning";
  }

  // ── File collection ──────────────────────────────────────────────────────

  private static collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;

    const walk = (d: string) => {
      try {
        for (const entry of readdirSync(d)) {
          if (["node_modules", ".git", "dist", ".aegis"].includes(entry)) continue;
          const full = join(d, entry);
          try {
            if (statSync(full).isDirectory()) {
              walk(full);
            } else if (/\.(ts|tsx|js|jsx)$/.test(entry) && !entry.endsWith(".d.ts")) {
              results.push(full);
            }
          } catch { /* skip */ }
        }
      } catch { /* skip */ }
    };

    // Only scan src/ and server/ — not node_modules, tooling, etc.
    const srcDir = join(dir, "src");
    const serverDir = join(dir, "server");
    if (existsSync(srcDir)) walk(srcDir);
    if (existsSync(serverDir)) walk(serverDir);

    return results;
  }
}
