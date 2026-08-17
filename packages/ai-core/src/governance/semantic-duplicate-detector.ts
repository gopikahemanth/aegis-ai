import { CanonicalFileGraph, type CanonicalFileEntry } from "./canonical-file-graph.js";
import { existsSync, unlinkSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";

export interface DuplicateCheckResult {
  allowed: boolean;
  canonicalPath?: string;
  reason?: string;
  action: "ALLOW" | "REDIRECT_TO_CANONICAL" | "DELETE_ORPHAN";
}

export interface OrphanReport {
  orphanPath: string;
  canonicalAlternative?: string;
  action: "DELETE" | "KEEP_UNREACHABLE";
}

export interface OrphanDetectionResult {
  success: boolean;
  orphans: OrphanReport[];
  error?: string;
}

/**
 * SemanticDuplicateDetector
 *
 * Prevents the generator from creating semantic duplicate files.
 * e.g. ScoreRadarChart.tsx when ScoreGauge.tsx already exists as canonical.
 *
 * Also detects orphan files — generated files that exist on disk but are
 * not reachable from the canonical dependency graph entry points.
 *
 * Called by the Orchestrator in two places:
 *   1. BEFORE writing any generated file (prevents duplicates from being written)
 *   2. POST-GENERATION scan (finds and removes orphans)
 */
export class SemanticDuplicateDetector {
  /**
   * Check whether a proposed file write should be allowed.
   * If it's a semantic duplicate, returns the canonical path to use instead.
   */
  public static checkBeforeWrite(proposedPath: string): DuplicateCheckResult {
    try {
      const normalized = proposedPath.replace(/\\/g, "/");

      // 1. Check semantic duplicate FIRST before general prefix authorization
      const dupCheck = CanonicalFileGraph.detectSemanticDuplicate(normalized);
      if (dupCheck.isDuplicate && dupCheck.canonicalFile) {
        console.warn(
          `[SemanticDuplicate] ⛔ REJECTED: "${normalized}" is a duplicate alias for "${dupCheck.canonicalFile.canonicalPath}". ` +
          `Rejecting write to force CoderAgent to generate canonical path directly.`
        );
        return {
          allowed: false,
          canonicalPath: dupCheck.canonicalFile.canonicalPath,
          reason: dupCheck.reason,
          action: "DELETE_ORPHAN",
        };
      }

      // 2. If it's authorized in canonical graph or feature structure, allow
      if (CanonicalFileGraph.isAuthorized(normalized)) {
        return { allowed: true, action: "ALLOW" };
      }


      // Not canonical, not a known duplicate — flag as unauthorized
      console.warn(
        `[SemanticDuplicate] ⚠️ UNAUTHORIZED FILE: "${normalized}" is not in the canonical graph. Skipping write.`
      );
      return {
        allowed: false,
        reason: `"${normalized}" is not in the canonical file graph.`,
        action: "DELETE_ORPHAN",
      };
    } catch (err: any) {
      console.warn(`[SemanticDuplicate] Non-fatal error during checkBeforeWrite: ${err.message}`);
      return { allowed: true, action: "ALLOW" };
    }
  }

  /**
   * Check whether a file is protected from orphan deletion.
   * Protects tooling, configs, declarations, design-system files, feature files, assets, dotfiles.
   */
  public static isProtectedToolingOrConfig(filePath: string): boolean {
    const norm = filePath.replace(/\\/g, "/");
    // 1. Authorized in CanonicalFileGraph
    if (CanonicalFileGraph.isAuthorized(norm)) return true;
    // 2. Design system files
    if (norm.startsWith("src/design-system/")) return true;
    // 3. Feature files & component directories
    if (norm.startsWith("src/features/")) return true;
    // 4. Configuration & Tooling files
    if (/(vite|tailwind|postcss|tsconfig|eslint|prettier)\.config\./i.test(norm)) return true;
    if (norm === "package.json" || norm === "index.html" || norm.endsWith(".d.ts")) return true;
    // 5. Contract artifacts & Dotfiles
    if (norm.startsWith(".aegis/") || norm.startsWith("prisma/") || norm.startsWith(".")) return true;
    // 6. Assets & standard static files
    if (/\.(json|md|env|css|scss|svg|png|jpg|ico|html|txt|yaml|yml)$/.test(norm)) return true;
    return false;
  }

  /**
   * Scan all TypeScript files in the project for orphans.
   * An orphan is a file that:
   *   1. Is NOT in the canonical graph, AND
   *   2. Is NOT imported by any canonical graph file
   *
   * Returns orphan candidates with recommended action.
   */
  public static detectOrphans(projectRoot: string): OrphanReport[] {
    const orphans: OrphanReport[] = [];

    try {
      const getAllTsFiles = (dir: string): string[] => {
        const results: string[] = [];
        if (!existsSync(dir)) return results;
        try {
          for (const entry of readdirSync(dir)) {
            if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === ".aegis") continue;
            const full = join(dir, entry);
            try {
              if (statSync(full).isDirectory()) results.push(...getAllTsFiles(full));
              else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".d.ts")) results.push(full);
            } catch { /* skip */ }
          }
        } catch { /* skip */ }
        return results;
      };

      const allFiles = getAllTsFiles(projectRoot);

      // Build import set — all files referenced by any canonical file on disk
      const importedPaths = new Set<string>();
      for (const canonPath of CanonicalFileGraph.getAllPaths()) {
        const full = join(projectRoot, canonPath);
        if (!existsSync(full)) continue;
        try {
          const content = readFileSync(full, "utf8");
          const importMatches = content.matchAll(/from\s+['"](\.\.?\/[^'"]+)['"]/g);
          for (const m of importMatches) {
            const resolvedPath = resolve(dirname(full), m[1]);
            importedPaths.add(resolvedPath.replace(/\.(ts|tsx|js|jsx)$/, ""));
            importedPaths.add(resolvedPath);
          }
        } catch { /* skip */ }
      }

      for (const fullPath of allFiles) {
        const relPath = relative(projectRoot, fullPath).replace(/\\/g, "/");

        // Never delete protected tooling, config, design-system, or feature files
        if (SemanticDuplicateDetector.isProtectedToolingOrConfig(relPath)) continue;

        // Skip if canonical
        if (CanonicalFileGraph.isAuthorized(relPath)) continue;

        // Skip if imported by a canonical file
        const basePath = fullPath.replace(/\.(ts|tsx|js|jsx)$/, "");
        if (importedPaths.has(basePath) || importedPaths.has(fullPath)) continue;

        const dupCheck = CanonicalFileGraph.detectSemanticDuplicate(relPath);
        orphans.push({
          orphanPath: relPath,
          canonicalAlternative: dupCheck.canonicalFile?.canonicalPath,
          action: "DELETE",
        });
      }
    } catch (err: any) {
      console.warn(`[SemanticDuplicate] Non-fatal error during detectOrphans: ${err.message}`);
    }

    return orphans;
  }

  /**
   * Remove orphan files from disk.
   * Only deletes files classified as DELETE in detectOrphans().
   */
  public static removeOrphans(projectRoot: string, orphans: OrphanReport[]): string[] {
    const deleted: string[] = [];
    try {
      for (const orphan of orphans) {
        if (orphan.action !== "DELETE") continue;
        const fullPath = join(projectRoot, orphan.orphanPath);
        if (existsSync(fullPath)) {
          try {
            unlinkSync(fullPath);
            deleted.push(orphan.orphanPath);
            const altMsg = orphan.canonicalAlternative
              ? ` (canonical alternative: ${orphan.canonicalAlternative})`
              : "";
            console.log(`[SemanticDuplicate] 🗑️ Deleted orphan: ${orphan.orphanPath}${altMsg}`);
          } catch (e: any) {
            console.warn(`[SemanticDuplicate] Could not delete orphan "${orphan.orphanPath}": ${e.message}`);
          }
        }
      }
    } catch (err: any) {
      console.warn(`[SemanticDuplicate] Non-fatal error during removeOrphans: ${err.message}`);
    }
    return deleted;
  }
}

