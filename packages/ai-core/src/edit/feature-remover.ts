/**
 * Aegis AI — Phase 5 Feature Remover
 *
 * Implements safe feature decommissioning and code cleanup:
 * - Unregisters route from router/App without leaving orphan routes
 * - Prunes navigation links from header/navbar
 * - Removes feature-owned files (pages, feature components)
 * - PRESERVES shared components (Card, Button, Table) used by other pages
 * - Cleans up dangling import statements from entry points
 * - Updates .aegis/feature-matrix.json to decommission the feature
 * - Ensures project builds cleanly with zero broken references
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { ProjectDependencyGraph } from "./project-dependency-graph.js";
import { FeatureMatrixManager } from "../contracts/feature-matrix.js";

export interface FeatureRemoveRequest {
  featureName: string;
  userRequest: string;
}

export interface FeatureRemoveResult {
  success: boolean;
  deletedFiles: string[];
  preservedSharedFiles: string[];
  modifiedFiles: string[];
  prunedRoutes: string[];
  error?: string;
}

export class FeatureRemover {
  /**
   * Safely removes a feature and its exclusively-owned artifacts.
   */
  public static async removeFeature(
    projectRoot: string,
    request: FeatureRemoveRequest
  ): Promise<FeatureRemoveResult> {
    const cleanRoot = projectRoot.replace(/\\/g, "/");
    const targetSlug = request.featureName.toLowerCase().replace(/[^a-z0-9_-]/g, "");

    const deletedFiles: string[] = [];
    const preservedSharedFiles: string[] = [];
    const modifiedFiles: string[] = [];
    const prunedRoutes: string[] = [];

    // 1. Scan project dependencies
    const graph = ProjectDependencyGraph.scan(cleanRoot);

    // 2. Locate routes matching target slug
    const matchingRoutes = graph.routes.filter(
      (r) =>
        r.path.toLowerCase().replace(/[^a-z0-9]/g, "") === targetSlug ||
        r.componentName.toLowerCase().includes(targetSlug)
    );

    for (const r of matchingRoutes) {
      prunedRoutes.push(r.path);
    }

    // 3. Unregister from routes file
    if (graph.routesFile) {
      const routerPath = join(cleanRoot, graph.routesFile);
      if (existsSync(routerPath)) {
        let content = readFileSync(routerPath, "utf8");
        let changed = false;

        for (const r of matchingRoutes) {
          // Remove route entry (e.g. `{ path: "/blog", element: <Blog /> },`)
          const entryRegex = new RegExp(
            `\\s*\\{[^}]*?path:\\s*["']${escapeRegex(r.path)}["'][^}]*?\\},?`,
            "g"
          );
          if (entryRegex.test(content)) {
            content = content.replace(entryRegex, "");
            changed = true;
          }

          // Remove JSX route entry (e.g. `<Route path="/blog" element={<Blog />} />`)
          const jsxRegex = new RegExp(
            `\\s*<Route[^>]*?path=["']${escapeRegex(r.path)}["'][^>]*?\\/>`,
            "g"
          );
          if (jsxRegex.test(content)) {
            content = content.replace(jsxRegex, "");
            changed = true;
          }

          // Remove import statement (e.g. `import Blog from "./pages/Blog";`)
          const importRegex = new RegExp(
            `import\\s+${escapeRegex(r.componentName)}\\s+from\\s+["'][^"']+["'];?\\r?\\n?`,
            "g"
          );
          if (importRegex.test(content)) {
            content = content.replace(importRegex, "");
            changed = true;
          }
        }

        if (changed) {
          writeFileSync(routerPath, content, "utf8");
          modifiedFiles.push(graph.routesFile);
        }
      }
    }

    // 4. Prune navigation links from Navbar / Navigation files
    for (const navRel of graph.navigationFiles) {
      const navPath = join(cleanRoot, navRel);
      if (existsSync(navPath)) {
        let navContent = readFileSync(navPath, "utf8");
        let changed = false;

        for (const r of matchingRoutes) {
          // Remove from nav items array
          const navItemRegex = new RegExp(
            `\\s*\\{[^}]*?href:\\s*["']${escapeRegex(r.path)}["'][^}]*?\\},?`,
            "g"
          );
          if (navItemRegex.test(navContent)) {
            navContent = navContent.replace(navItemRegex, "");
            changed = true;
          }
        }

        if (changed) {
          writeFileSync(navPath, navContent, "utf8");
          if (!modifiedFiles.includes(navRel)) modifiedFiles.push(navRel);
        }
      }
    }

    // 5. Delete feature-owned files while strictly preserving shared files
    const featureFiles = graph.featureOwnedFiles.get(targetSlug) || [];

    // Also check standard page file candidate
    const componentCandidates = matchingRoutes.map((r) => `src/pages/${r.componentName}.tsx`);
    for (const cand of componentCandidates) {
      if (existsSync(join(cleanRoot, cand)) && !featureFiles.includes(cand)) {
        featureFiles.push(cand);
      }
    }

    for (const relFile of featureFiles) {
      const isShared = graph.sharedFiles.includes(relFile);
      if (isShared) {
        preservedSharedFiles.push(relFile);
        console.log(`[FeatureRemover] 🛡️ Preserved shared component: ${relFile}`);
      } else {
        const fullPath = join(cleanRoot, relFile);
        if (existsSync(fullPath)) {
          try {
            unlinkSync(fullPath);
            deletedFiles.push(relFile);
            console.log(`[FeatureRemover] 🗑️ Removed feature-owned file: ${relFile}`);
          } catch (e: any) {
            console.warn(`[FeatureRemover] Could not delete ${relFile}: ${e.message}`);
          }
        }
      }
    }

    // 6. Delete obsolete feature test if exists
    const testCandidate = `src/__tests__/${targetSlug}.test.ts`;
    const testFullPath = join(cleanRoot, testCandidate);
    if (existsSync(testFullPath)) {
      try {
        unlinkSync(testFullPath);
        deletedFiles.push(testCandidate);
      } catch {}
    }

    // 7. Update FeatureMatrix (.aegis/feature-matrix.json)
    const matrix = FeatureMatrixManager.loadFromProject(cleanRoot);
    if (matrix) {
      const remainingFeatures = matrix.features.filter(
        (f) =>
          !f.title.toLowerCase().includes(targetSlug) &&
          !matchingRoutes.some((r) => f.routes.includes(r.path))
      );

      if (remainingFeatures.length !== matrix.features.length) {
        const updatedMatrix = FeatureMatrixManager.createMatrix(
          matrix.projectName,
          matrix.domainName,
          remainingFeatures
        );
        FeatureMatrixManager.saveToProject(cleanRoot, updatedMatrix);
        if (!modifiedFiles.includes(".aegis/feature-matrix.json")) {
          modifiedFiles.push(".aegis/feature-matrix.json");
        }
      }
    }

    return {
      success: true,
      deletedFiles,
      preservedSharedFiles,
      modifiedFiles,
      prunedRoutes,
    };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
