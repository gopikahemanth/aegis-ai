/**
 * Aegis AI — Phase 5 Project Dependency Graph
 *
 * Scans an existing project to analyze routes, components, imports,
 * data models, and dependency relationships.
 *
 * Distinguishes between:
 * - Feature-owned files: uniquely used by a specific feature (safely removable on feature deletion).
 * - Shared files: imported across multiple features (e.g., Card, Button, Table — must NEVER be deleted).
 * - Entry points: main.tsx, App.tsx, routes.tsx (must be modified surgically, never deleted).
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname, dirname } from "node:path";
import type { ProjectDependencySummary } from "./edit-types.js";

export class ProjectDependencyGraph {
  /**
   * Builds a comprehensive dependency summary for an existing project.
   */
  public static scan(projectRoot: string): ProjectDependencySummary {
    const cleanRoot = projectRoot.replace(/\\/g, "/");

    // 1. Entry Points
    const entryPoints: string[] = [];
    for (const c of ["src/main.tsx", "src/index.tsx", "src/App.tsx", "src/routes.tsx", "src/index.css"]) {
      if (existsSync(join(cleanRoot, c))) entryPoints.push(c);
    }

    // 2. Routes & Navigation
    let routesFile: string | undefined;
    for (const c of ["src/routes.tsx", "src/routes.ts", "src/App.tsx", "src/router.tsx", "src/routes/index.tsx"]) {
      if (existsSync(join(cleanRoot, c))) {
        routesFile = c;
        break;
      }
    }

    const routes: Array<{ path: string; componentName: string; filePath?: string }> = [];
    if (routesFile) {
      const fullPath = join(cleanRoot, routesFile);
      try {
        const content = readFileSync(fullPath, "utf8");
        // Match { path: "/...", element: <Component /> } or path="/..." element={<Component />}
        const routeRegex = /path:\s*["']([^"']+)["'][^}]*?(?:element|Component):\s*<?([A-Za-z0-9_$]+)/g;
        let m: RegExpExecArray | null;
        while ((m = routeRegex.exec(content)) !== null) {
          routes.push({
            path: m[1],
            componentName: m[2],
          });
        }

        // Also match JSX <Route path="/..." element={<Component />} />
        const jsxRouteRegex = /<Route[^>]*?path=["']([^"']+)["'][^>]*?element=\{<([A-Za-z0-9_$]+)/g;
        while ((m = jsxRouteRegex.exec(content)) !== null) {
          if (!routes.some((r) => r.path === m![1])) {
            routes.push({
              path: m[1],
              componentName: m[2],
            });
          }
        }
      } catch {}
    }

    // 3. Collect all source files
    const allFiles: string[] = [];
    const srcDir = join(cleanRoot, "src");
    if (existsSync(srcDir)) {
      this.collectFilesRecursive(srcDir, cleanRoot, allFiles);
    }

    // 4. Map imports to identify shared files vs feature-owned files
    const importMap = new Map<string, string[]>(); // targetFile -> importingFiles[]

    for (const file of allFiles) {
      if (!/\.(tsx?|jsx?)$/.test(file)) continue;
      const fullPath = join(cleanRoot, file);
      try {
        const content = readFileSync(fullPath, "utf8");
        const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?["']([^"']+)["']/g;
        let m: RegExpExecArray | null;
        while ((m = importRegex.exec(content)) !== null) {
          const importPath = m[1];
          if (importPath.startsWith(".")) {
            const resolvedRel = this.resolveRelativeImport(file, importPath, cleanRoot);
            if (resolvedRel) {
              const current = importMap.get(resolvedRel) || [];
              if (!current.includes(file)) current.push(file);
              importMap.set(resolvedRel, current);
            }
          }
        }
      } catch {}
    }

    // Shared files: files imported by 2 or more distinct files, or located in shared/
    const sharedFiles: string[] = [];
    const featureOwnedFiles = new Map<string, string[]>();

    for (const file of allFiles) {
      const isExplicitShared = file.includes("shared/") || file.includes("components/ui/") || file.includes("common/");
      const importers = importMap.get(file) || [];
      if (isExplicitShared || importers.length >= 2) {
        sharedFiles.push(file);
      } else {
        // Associate with feature name based on path
        const matchFeature = file.match(/src\/(?:pages|features)\/([A-Za-z0-9_-]+)/);
        const featureKey = matchFeature ? matchFeature[1].toLowerCase() : "general";
        const list = featureOwnedFiles.get(featureKey) || [];
        list.push(file);
        featureOwnedFiles.set(featureKey, list);
      }
    }

    // 5. Prisma models
    let schemaPath: string | undefined;
    const models: string[] = [];
    const prismaFile = join(cleanRoot, "prisma", "schema.prisma");
    if (existsSync(prismaFile)) {
      schemaPath = "prisma/schema.prisma";
      try {
        const content = readFileSync(prismaFile, "utf8");
        const modelRegex = /model\s+([A-Za-z0-9_$]+)\s*\{/g;
        let m: RegExpExecArray | null;
        while ((m = modelRegex.exec(content)) !== null) {
          models.push(m[1]);
        }
      } catch {}
    }

    return {
      projectRoot: cleanRoot,
      framework: "react-vite",
      entryPoints,
      routesFile,
      routes,
      navigationFiles: allFiles.filter((f) => /nav|header|sidebar/i.test(f)),
      featureOwnedFiles,
      sharedFiles,
      userModifiedFiles: [],
      schemaPath,
      models,
    };
  }

  private static collectFilesRecursive(dir: string, root: string, result: string[]): void {
    try {
      for (const item of readdirSync(dir)) {
        if (item === "node_modules" || item === ".git" || item === "dist") continue;
        const full = join(dir, item);
        const st = statSync(full);
        if (st.isDirectory()) {
          this.collectFilesRecursive(full, root, result);
        } else {
          result.push(relative(root, full).replace(/\\/g, "/"));
        }
      }
    } catch {}
  }

  private static resolveRelativeImport(sourceFile: string, importPath: string, root: string): string | null {
    const sourceDir = dirname(sourceFile);
    const candidateBase = join(sourceDir, importPath).replace(/\\/g, "/");

    for (const ext of [".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"]) {
      const full = join(root, candidateBase + ext);
      if (existsSync(full)) {
        return (candidateBase + ext).replace(/\\/g, "/");
      }
    }
    return null;
  }
}
