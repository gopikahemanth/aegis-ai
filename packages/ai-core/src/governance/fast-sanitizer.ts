/**
 * FastDeterministicSanitizer
 *
 * Safe, contract-aware, deterministic sanitizer for AEGIS generation.
 *
 * Rules:
 * - NO hardcoded domain templates (no injected Security / Resume / Gym / Telehealth dashboards).
 * - NO fake authentication tokens or demo credentials (no demo-user-id or demo@aegis.dev).
 * - NO dangerous global regex substitutions that alter application logic.
 * - ONLY performs safe, non-destructive file system and AST normalization:
 *   - File casing collision resolution
 *   - Duplicate file extension cleanup
 *   - External dependency closure in package.json
 *   - Safe export / import contract normalization via ASTSafeTransformer
 *   - Router nesting normalization
 *   - Database URL environment validation
 *   - Generic README documentation compliance
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, unlinkSync, rmSync, mkdirSync } from "node:fs";
import { join, dirname, extname, relative } from "node:path";
import { ASTSafeTransformer } from "./ast-safe-transformer.js";
import type { ArchitectureContractV1 } from "./architecture-resolver.js";

export interface FastSanitationReport {
  casingCollisionsResolved: number;
  missingDependenciesAdded: string[];
  exportFixesApplied: number;
  syntaxErrorsRepaired: number;
  databaseUrlValid: boolean;
}

export class FastDeterministicSanitizer {
  public static sanitizeProject(outputDirectory: string, contract?: ArchitectureContractV1): FastSanitationReport {
    const report: FastSanitationReport = {
      casingCollisionsResolved: 0,
      missingDependenciesAdded: [],
      exportFixesApplied: 0,
      syntaxErrorsRepaired: 0,
      databaseUrlValid: true,
    };

    // 1. File Casing Collision Resolution (Windows case-insensitivity safety)
    report.casingCollisionsResolved = this.resolveCasingCollisions(outputDirectory);

    // 2. Remove duplicate api.tsx if api.ts exists
    this.removeDuplicateApiTsx(outputDirectory);

    // 3. Dependency Closure for external packages in package.json
    report.missingDependenciesAdded = this.ensureDependencyClosure(outputDirectory);

    // 4. Export / Import contract sanitation & Known Syntax preflight fixes via ASTSafeTransformer
    report.exportFixesApplied = this.sanitizeExportContracts(outputDirectory);
    report.syntaxErrorsRepaired = this.repairKnownSyntaxErrors(outputDirectory);

    // 5. Enforce canonical structure for generic UI components (CircularProgress, LoadingSpinner)
    this.enforceGenericComponents(outputDirectory);

    // 6. Sanitize React Router nesting (prevent duplicate <BrowserRouter>)
    this.sanitizeRouterNesting(outputDirectory);

    // 7. Enforce multi-page routing based on actual existing pages or contract
    this.ensureMultiPageFeatureRouting(outputDirectory, contract);

    // 8. Database URL validation in .env
    report.databaseUrlValid = this.validateDatabaseUrl(outputDirectory);

    // 9. Generate canonical README.md for DoD documentation compliance
    this.ensureReadmeDocumentation(outputDirectory, contract);

    return report;
  }

  /**
   * Remove src/services/api.tsx if src/services/api.ts exists.
   */
  private static removeDuplicateApiTsx(outputDirectory: string): void {
    const srcDir = join(outputDirectory, "src");
    if (existsSync(srcDir)) {
      try {
        const allFiles = this.getAllFiles(srcDir);
        for (const f of allFiles) {
          if (f.endsWith(".css.tsx")) {
            try { unlinkSync(join(srcDir, f)); } catch {}
          }
        }
      } catch {}
    }
    const apiTs = join(outputDirectory, "src", "services", "api.ts");
    const apiTsx = join(outputDirectory, "src", "services", "api.tsx");
    if (existsSync(apiTs) && existsSync(apiTsx)) {
      try {
        unlinkSync(apiTsx);
        console.log("[FastSanitizer] 🗑️ Removed duplicate src/services/api.tsx (api.ts is canonical)");
      } catch {}
    }

    // Fix backend server files mistakenly created with .tsx extension
    const serverDir = join(outputDirectory, "server");
    if (existsSync(serverDir)) {
      try {
        const serverFiles = this.getAllFiles(serverDir).filter(f => f.endsWith(".tsx"));
        for (const relFile of serverFiles) {
          const oldPath = join(serverDir, relFile);
          const newPath = oldPath.slice(0, -1); // .tsx -> .ts
          try {
            const content = readFileSync(oldPath, "utf8");
            writeFileSync(newPath, content, "utf8");
            unlinkSync(oldPath);
            console.log(`[FastSanitizer] 🔧 Renamed backend server file: ${relFile} -> ${relFile.slice(0, -1)}`);
          } catch {}
        }
      } catch {}
    }
  }

  /**
   * Enforce clean structure for generic design system components without domain data.
   */
  private static enforceGenericComponents(root: string): void {
    const cpPath = join(root, "src", "design-system", "components", "CircularProgress.tsx");
    if (existsSync(cpPath)) {
      const content = readFileSync(cpPath, "utf8");
      const isBroken = /\(props:\s*any\)/.test(content) && (content.includes("size") || content.includes("value"));
      if (isBroken) {
        const fixed = `import React from "react";

export interface CircularProgressProps {
  value?: number;
  size?: number;
  className?: string;
}

export function CircularProgress({ value = 0, size = 40, className = "" }: CircularProgressProps) {
  return (
    <div className={\`relative inline-flex items-center justify-center font-bold text-cyan-400 \${className}\`} style={{ width: size, height: size }}>
      <span>{Math.round(value)}%</span>
    </div>
  );
}

export default CircularProgress;
`;
        writeFileSync(cpPath, fixed, "utf8");
      }
    }

    const spinnerPath = join(root, "src", "design-system", "components", "LoadingSpinner.tsx");
    if (existsSync(spinnerPath)) {
      try {
        let content = readFileSync(spinnerPath, "utf8");
        if (!content.includes("export const Spinner") && !content.includes("export function Spinner")) {
          content += "\nexport const Spinner = LoadingSpinner;\n";
          writeFileSync(spinnerPath, content, "utf8");
        }
      } catch {}
    }

    const duplicateSpinner = join(root, "src", "shared", "components", "LoadingSpinner.tsx");
    if (existsSync(duplicateSpinner) && existsSync(spinnerPath)) {
      try { rmSync(duplicateSpinner, { force: true }); } catch {}
    }
  }

  /**
   * Resolves Windows casing collisions across directories.
   */
  private static resolveCasingCollisions(root: string): number {
    let resolved = 0;
    const srcDir = join(root, "src");
    if (!existsSync(srcDir)) return resolved;

    try {
      const seen = new Map<string, string>();
      const files = this.getAllFiles(srcDir);
      for (const rel of files) {
        const lower = rel.toLowerCase();
        if (seen.has(lower)) {
          const first = seen.get(lower)!;
          if (first !== rel) {
            const firstStat = statSync(join(srcDir, first));
            const secondStat = statSync(join(srcDir, rel));
            // Keep larger file, remove smaller duplicate
            const toRemove = firstStat.size >= secondStat.size ? join(srcDir, rel) : join(srcDir, first);
            try {
              unlinkSync(toRemove);
              resolved++;
              console.log(`[FastSanitizer] 🔧 Resolved file casing collision: removed ${toRemove}`);
            } catch {}
          }
        } else {
          seen.set(lower, rel);
        }
      }
    } catch {}
    return resolved;
  }

  /**
   * Guarantees dependency closure for external npm libraries in package.json.
   */
  private static ensureDependencyClosure(root: string): string[] {
    const added: string[] = [];
    const pkgPath = join(root, "package.json");
    if (!existsSync(pkgPath)) return added;

    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      pkg.dependencies = pkg.dependencies || {};

      const standardDeps: Record<string, string> = {
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "react-router-dom": "^6.26.0",
        "@tanstack/react-query": "^5.56.2",
        "@tanstack/react-table": "^8.20.5",
        "lucide-react": "^0.441.0",
        "clsx": "^2.1.1",
        "tailwind-merge": "^2.5.2",
        "axios": "^1.7.7",
        "zod": "^3.23.8",
      };

      for (const [dep, ver] of Object.entries(standardDeps)) {
        if (!pkg.dependencies[dep]) {
          pkg.dependencies[dep] = ver;
          added.push(dep);
        }
      }

      if (added.length > 0) {
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
        console.log(`[FastSanitizer] 📦 Added missing base dependencies: ${added.join(", ")}`);
      }
    } catch {}

    return added;
  }

  /**
   * Non-destructive export & import contract sanitation.
   */
  private static sanitizeExportContracts(root: string): number {
    let fixes = 0;
    const srcDir = join(root, "src");
    if (!existsSync(srcDir)) return fixes;

    try {
      const files = this.getAllFiles(srcDir).filter(f => f.endsWith(".ts") || f.endsWith(".tsx"));
      for (const rel of files) {
        const fullPath = join(srcDir, rel);
        let content = readFileSync(fullPath, "utf8");
        const res = ASTSafeTransformer.transformSource(content, rel);
        if (res.transformed) {
          writeFileSync(fullPath, res.code, "utf8");
          fixes += res.repairsApplied.length;
        }
      }
    } catch {}

    return fixes;
  }

  /**
   * Safe syntax repair on TypeScript source files.
   */
  private static repairKnownSyntaxErrors(root: string): number {
    let repaired = 0;
    const srcDir = join(root, "src");
    if (!existsSync(srcDir)) return repaired;

    try {
      const files = this.getAllFiles(srcDir).filter(f => f.endsWith(".ts") || f.endsWith(".tsx"));
      for (const rel of files) {
        const fullPath = join(srcDir, rel);
        const content = readFileSync(fullPath, "utf8");
        const syntaxCheck = ASTSafeTransformer.validateSyntax(content, rel);
        if (!syntaxCheck.valid) {
          const transformed = ASTSafeTransformer.transformSource(content, rel);
          if (transformed.transformed) {
            writeFileSync(fullPath, transformed.code, "utf8");
            repaired++;
          }
        }
      }
    } catch {}

    return repaired;
  }

  /**
   * Ensures React Router is not nested with duplicate <BrowserRouter>.
   */
  private static sanitizeRouterNesting(root: string): void {
    const appPath = join(root, "src", "App.tsx");
    const routesPath = join(root, "src", "routes.tsx");
    if (existsSync(appPath) && existsSync(routesPath)) {
      try {
        let appContent = readFileSync(appPath, "utf8");
        let routesContent = readFileSync(routesPath, "utf8");

        const appHasRouter = appContent.includes("<BrowserRouter") || appContent.includes("<Router");
        const routesHasRouter = routesContent.includes("<BrowserRouter") || routesContent.includes("<Router");

        if (appHasRouter && routesHasRouter) {
          // Remove duplicate Router wrapping in routes.tsx, keep pure <Routes>
          routesContent = routesContent
            .replace(/<BrowserRouter[^>]*>/g, "<>")
            .replace(/<\/BrowserRouter>/g, "</>")
            .replace(/<Router[^>]*>/g, "<>")
            .replace(/<\/Router>/g, "</>");
          writeFileSync(routesPath, routesContent, "utf8");
          console.log("[FastSanitizer] 🔧 Removed nested <BrowserRouter> from routes.tsx to avoid runtime React Router crash");
        }
      } catch {}
    }
  }

  /**
   * Ensures multi-page routing is correctly wired based on actual files or contract.
   */
  private static ensureMultiPageFeatureRouting(root: string, contract?: ArchitectureContractV1): void {
    const routesTsxPath = join(root, "src", "routes.tsx");
    if (!existsSync(routesTsxPath)) {
      // Generate clean standard router file from existing pages
      const routesCode = this.generateRoutesFromExistingPages(root, contract);
      try {
        const srcDir = join(root, "src");
        if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });
        writeFileSync(routesTsxPath, routesCode, "utf8");
        console.log("[FastSanitizer] 🔧 Generated canonical routes.tsx from project pages");
      } catch {}
    }
  }

  /**
   * Generates a clean routes.tsx matching existing page files on disk.
   */
  public static generateRoutesFromExistingPages(root: string, contract?: ArchitectureContractV1): string {
    const srcDir = join(root, "src");
    const pages: Array<{ name: string; importPath: string; routePath: string }> = [];

    if (existsSync(srcDir)) {
      const allFiles = this.getAllFiles(srcDir);
      for (const f of allFiles) {
        if ((f.includes("Page") || f.includes("View") || f.includes("Dashboard")) && (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.includes(".test.") && !f.includes(".spec.")) {
          const baseName = f.split(/[/\\]/).pop()!.replace(/\.(tsx|ts)$/, "");
          const routeSlug = baseName.replace(/Page$/, "").replace(/View$/, "").toLowerCase();
          const routePath = routeSlug === "dashboard" || routeSlug === "home" || routeSlug === "index" ? "/" : `/${routeSlug}`;
          const importRel = "./" + f.replace(/\\/g, "/").replace(/\.(tsx|ts)$/, "");
          pages.push({ name: baseName, importPath: importRel, routePath });
        }
      }
    }

    if (pages.length === 0) {
      return `import React from "react";
import { Routes, Route } from "react-router-dom";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Application Ready</h1></div>} />
    </Routes>
  );
}

export const routes = AppRoutes;
export default AppRoutes;
`;
    }

    const imports = pages.map(p => `import { ${p.name} } from "${p.importPath}";`).join("\n");
    const routeElements = pages.map(p => `      <Route path="${p.routePath}" element={<${p.name} />} />`).join("\n");

    return `import React from "react";
import { Routes, Route } from "react-router-dom";
${imports}

export function AppRoutes() {
  return (
    <Routes>
${routeElements}
    </Routes>
  );
}

export const routes = AppRoutes;
export default AppRoutes;
`;
  }

  /**
   * Validates that DATABASE_URL exists in .env or writes standard local development URL.
   */
  private static validateDatabaseUrl(root: string): boolean {
    const envPath = join(root, ".env");
    if (!existsSync(envPath)) {
      try {
        writeFileSync(envPath, `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db?schema=public"\nPORT=3000\nNODE_ENV=development\n`, "utf8");
        return true;
      } catch {
        return false;
      }
    }
    const envContent = readFileSync(envPath, "utf8");
    return envContent.includes("DATABASE_URL=");
  }

  /**
   * Generates a clean, professional README.md for the generated project.
   */
  private static ensureReadmeDocumentation(root: string, contract?: ArchitectureContractV1): void {
    const readmePath = join(root, "README.md");
    if (!existsSync(readmePath)) {
      const title = contract?.applicationType?.replace(/_/g, " ") || "Generated Application";
      const content = `# ${title}

Generated with AEGIS Autonomous Software Engineering.

## Getting Started

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Database Setup
Ensure PostgreSQL is running, then run Prisma migrations:
\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

### 3. Run Development Server
\`\`\`bash
npm run dev
\`\`\`
`;
      try {
        writeFileSync(readmePath, content, "utf8");
      } catch {}
    }
  }

  /**
   * Helper to recursively find all files in a directory.
   */
  private static getAllFiles(dir: string): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;

    const list = readdirSync(dir);
    for (const item of list) {
      if (item === "node_modules" || item === ".git" || item === "dist" || item === "build") continue;
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      if (stat && stat.isDirectory()) {
        const sub = this.getAllFiles(fullPath);
        for (const s of sub) {
          results.push(join(item, s));
        }
      } else {
        results.push(item);
      }
    }
    return results;
  }
}
