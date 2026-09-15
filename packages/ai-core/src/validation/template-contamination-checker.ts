/**
 * TemplateContaminationChecker — Aegis V2.3 Phase 6.1
 *
 * Verifies that a generated application contains ONLY components, routes,
 * and UI text belonging to the requested domain, with ZERO remnants from
 * unrelated starter templates (e.g., Art Gallery, Expense Tracker, Fitness).
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface TemplateContaminationViolation {
  file: string;
  issueType: "CONTAMINATED_FILE" | "FORBIDDEN_KEYWORD" | "SOURCE_PATH_LEAK" | "UNRELATED_ROUTE" | "PLACEHOLDER_STUB";
  description: string;
}

export interface TemplateContaminationReport {
  status: "PASS" | "FAIL";
  clean: boolean;
  violations: TemplateContaminationViolation[];
  summary: string;
}

export class TemplateContaminationChecker {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Audits the generated project against cross-domain template contamination,
   * source path leaks, placeholder stubs, and dead routes.
   */
  public audit(domainCategory?: string): TemplateContaminationReport {
    const violations: TemplateContaminationViolation[] = [];
    const srcDir = join(this.projectRoot, "src");

    if (!existsSync(srcDir)) {
      return {
        status: "PASS",
        clean: true,
        violations: [],
        summary: "No src directory found to audit.",
      };
    }

    const domain = (domainCategory || "general").toLowerCase();
    const isArtGallery = domain.includes("art") || domain.includes("gallery");
    const isFitness = domain.includes("fitness") || domain.includes("workout") || domain.includes("gym");
    const isExpense = domain.includes("expense") || domain.includes("budget") || domain.includes("finance");
    const isTask = domain.includes("task") || domain.includes("kanban") || domain.includes("todo");
    const isStudent = domain.includes("student") || domain.includes("school") || domain.includes("academic");
    const isLibrary = domain.includes("library") || domain.includes("book");

    const files = this.collectSourceFiles(srcDir);

    for (const filePath of files) {
      const relPath = relative(this.projectRoot, filePath).replace(/\\/g, "/");
      const lowerRel = relPath.toLowerCase();

      // 1. File Name Checks
      if (!isArtGallery) {
        if (
          lowerRel.includes("artwork") ||
          lowerRel.includes("gallery") ||
          lowerRel.includes("artstats") ||
          lowerRel.includes("exhibition") ||
          lowerRel.includes("painting")
        ) {
          violations.push({
            file: relPath,
            issueType: "CONTAMINATED_FILE",
            description: `File "${relPath}" belongs to an unrelated Art Gallery template.`,
          });
        }
      }

      if (!isFitness && !isStudent && !isLibrary) {
        if (lowerRel.includes("workoutplan") || lowerRel.includes("exercisecard")) {
          violations.push({
            file: relPath,
            issueType: "CONTAMINATED_FILE",
            description: `File "${relPath}" belongs to an unrelated Fitness template.`,
          });
        }
      }

      // 2. File Content Checks (UI text, headings, source path leaks, stubs)
      if (lowerRel.endsWith(".tsx") || lowerRel.endsWith(".jsx") || lowerRel.endsWith(".html")) {
        try {
          const content = readFileSync(filePath, "utf8");
          const lowerContent = content.toLowerCase();

          // Check for Art Gallery phrases in non-art projects
          if (!isArtGallery) {
            const forbiddenArtPhrases = [
              "gallery overview",
              "artworkstats",
              "artworkdashboard",
              "curated exhibitions",
              "starry horizon",
              "vincent van gogh",
              "oil painting",
              "canvas portfolio",
              "recent additions (art)",
            ];
            for (const phrase of forbiddenArtPhrases) {
              if (lowerContent.includes(phrase)) {
                violations.push({
                  file: relPath,
                  issueType: "FORBIDDEN_KEYWORD",
                  description: `Found unrelated Art Gallery template phrase "${phrase}" in ${relPath}.`,
                });
              }
            }
          }

          // Check for Generic "Operations Nexus" and REC-101 fallback phrases in all non-explicitly-operations projects
          const isExplicitTelemetry = domain.includes("telemetry") || domain.includes("industrial-scada");
          if (!isExplicitTelemetry) {
            const forbiddenGenericPhrases = [
              "operations nexus",
              "operational records",
              "rec-101",
              "rec-102",
              "rec-103",
              "rec-104",
              "primary master workspace",
              "secondary workflow cluster",
              "telemetry feed ingestion",
              "maintenance & inspection cycle",
              "standard asset",
              "code / reference id",
              "primary metric",
            ];
            for (const phrase of forbiddenGenericPhrases) {
              if (lowerContent.includes(phrase)) {
                violations.push({
                  file: relPath,
                  issueType: "FORBIDDEN_KEYWORD",
                  description: `Found generic fallback template phrase "${phrase}" in ${relPath}.`,
                });
              }
            }
          }

          // Check for source file path leaks rendered into JSX
          if (
            content.includes("C:\\Users\\") ||
            content.includes("c:/users/") ||
            content.includes("/projects/aegis-ai/") ||
            content.includes("font-mono mb-1\">src/") ||
            content.includes("font-mono mb-1\">server/")
          ) {
            violations.push({
              file: relPath,
              issueType: "SOURCE_PATH_LEAK",
              description: `Source path leak detected rendered in visible code of ${relPath}.`,
            });
          }

          // Check for empty debug stubs
          if (
            content.includes("Auto-created missing component") ||
            content.includes("Placeholder Component Stub")
          ) {
            violations.push({
              file: relPath,
              issueType: "PLACEHOLDER_STUB",
              description: `Placeholder stub detected in ${relPath}.`,
            });
          }
        } catch {}
      }
    }

    // 3. Route Integrity Verification
    const routesFile = join(srcDir, "routes.tsx");
    if (existsSync(routesFile)) {
      try {
        const routesContent = readFileSync(routesFile, "utf8");
        // Scan for imported components in routes.tsx
        const importMatches = routesContent.matchAll(/import\s+(?:\{[^}]+\}|\w+)\s+from\s+["']([^"']+)["']/g);
        for (const match of importMatches) {
          const importTarget = match[1];
          if (importTarget.startsWith(".")) {
            const resolvedTarget = join(srcDir, importTarget).replace(/\\/g, "/");
            const possibleExts = ["", ".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"];
            const exists = possibleExts.some((ext) => existsSync(resolvedTarget + ext));
            if (!exists) {
              violations.push({
                file: "src/routes.tsx",
                issueType: "UNRELATED_ROUTE",
                description: `Route imports non-existent module: "${importTarget}".`,
              });
            }
          }
        }
      } catch {}
    }

    const clean = violations.length === 0;
    return {
      status: clean ? "PASS" : "FAIL",
      clean,
      violations,
      summary: clean
        ? "No template contamination detected. Project is cleanly domain-scoped."
        : `Detected ${violations.length} template contamination violation(s).`,
    };
  }

  private collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const st = statSync(fullPath);
        if (st.isDirectory()) {
          results.push(...this.collectSourceFiles(fullPath));
        } else {
          results.push(fullPath);
        }
      }
    } catch {}
    return results;
  }
}
