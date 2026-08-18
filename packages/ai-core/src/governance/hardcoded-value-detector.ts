/**
 * HardcodedValueDetector
 *
 * Scans generated source code to detect hardcoded fake credentials, mock sessions,
 * fabricated business metrics, and non-deterministic random scoring hacks.
 *
 * Rules:
 * - Detects demo user credentials ("demo-user-id", "demo@aegis.dev").
 * - Detects Math.random() in business score calculations.
 * - Detects hardcoded mock metric constants.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export interface HardcodedIssue {
  file: string;
  category: "DEMO_CREDENTIALS" | "HARDCODED_BUSINESS_DATA" | "RANDOM_SCORING_HACK" | "MOCK_SESSION";
  description: string;
  matchedPattern: string;
  snippet: string;
}

export interface HardcodedDetectionReport {
  clean: boolean;
  issues: HardcodedIssue[];
}

export class HardcodedValueDetector {
  private static readonly PATTERNS: Array<{
    category: HardcodedIssue["category"];
    pattern: RegExp;
    description: string;
  }> = [
    {
      category: "DEMO_CREDENTIALS",
      pattern: /["'](?:demo-user-id|demo@aegis\.dev|admin@aegis\.dev|test@aegis\.dev|demo_user)["']/i,
      description: "Hardcoded fake demo user credentials or email",
    },
    {
      category: "MOCK_SESSION",
      pattern: /useState\s*\(\s*\{\s*id:\s*["']demo-user-id["']/i,
      description: "Hardcoded mock authentication session injected into component state",
    },
    {
      category: "HARDCODED_BUSINESS_DATA",
      pattern: /(?:totalVolume:\s*14850|activeStreak:\s*12|riskScore:\s*98)/i,
      description: "Hardcoded arbitrary business metrics",
    },
    {
      category: "RANDOM_SCORING_HACK",
      pattern: /Math\.random\(\)\s*\*\s*(?:100|50|20)/i,
      description: "Randomized Math.random() score generation instead of algorithmic calculation",
    },
  ];

  /**
   * Scans a project for hardcoded mock values.
   */
  public static scanProject(projectRoot: string): HardcodedDetectionReport {
    const issues: HardcodedIssue[] = [];
    const files = this.getAllSourceFiles(projectRoot);

    for (const rel of files) {
      const fullPath = join(projectRoot, rel);
      let content = "";
      try {
        content = readFileSync(fullPath, "utf8");
      } catch {
        continue;
      }

      for (const pat of this.PATTERNS) {
        const match = content.match(pat.pattern);
        if (match) {
          const idx = match.index || 0;
          const start = Math.max(0, idx - 40);
          const snippet = content.slice(start, start + 100).replace(/\s+/g, " ");

          issues.push({
            file: rel,
            category: pat.category,
            description: pat.description,
            matchedPattern: match[0],
            snippet,
          });
        }
      }
    }

    return {
      clean: issues.length === 0,
      issues,
    };
  }

  private static getAllSourceFiles(dir: string): string[] {
    const results: string[] = [];
    const srcDirs = ["src", "server"];

    for (const d of srcDirs) {
      const full = join(dir, d);
      if (existsSync(full)) {
        results.push(...this.walkDir(full, d));
      }
    }

    return results;
  }

  private static walkDir(dir: string, currentRel: string): string[] {
    const files: string[] = [];
    try {
      const list = readdirSync(dir);
      for (const item of list) {
        if (item === "node_modules" || item === ".git" || item === "dist") continue;
        const full = join(dir, item);
        const rel = join(currentRel, item);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          files.push(...this.walkDir(full, rel));
        } else if (/\.(ts|tsx|js|jsx)$/.test(item)) {
          files.push(rel.replace(/\\/g, "/"));
        }
      }
    } catch {}
    return files;
  }
}
