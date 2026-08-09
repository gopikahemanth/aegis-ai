import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, extname, basename, relative } from "node:path";

export interface ClosureViolation {
  sourceFile: string;
  importPath: string;
  resolvedAttempts: string[];
  suggestedMatch?: string;
}

export interface ClosureResult {
  valid: boolean;
  missing: string[];
  brokenImports: ClosureViolation[];
  suggestedMatches: Map<string, string>;
}

export class DependencyClosureValidator {
  private static readonly EXTENSIONS = [
    ".ts", ".tsx", ".js", ".jsx",
    "/index.ts", "/index.tsx", "/index.js", "/index.jsx",
  ];

  private static readonly SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

  private static levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i-1] === b[j-1]
          ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
      }
    }
    return dp[m][n];
  }

  public static resolveModule(importPath: string, fromDir: string): string | null {
    if (!importPath.startsWith(".") && !importPath.startsWith("/")) return "external";

    const base = resolve(fromDir, importPath);

    if (existsSync(base)) {
      try {
        if (statSync(base).isFile()) return base;
      } catch { /* skip */ }
    }

    for (const ext of DependencyClosureValidator.EXTENSIONS) {
      const candidate = base + ext;
      if (existsSync(candidate)) return candidate;
    }

    return null;
  }

  private static collectFiles(dir: string, files: string[] = []): string[] {
    if (!existsSync(dir)) return files;
    try {
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === ".aegis") continue;
        const fullPath = join(dir, entry);
        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            DependencyClosureValidator.collectFiles(fullPath, files);
          } else if (DependencyClosureValidator.SCAN_EXTENSIONS.has(extname(entry))) {
            files.push(fullPath);
          }
        } catch { /* skip */ }
      }
    } catch { /* ignore permission errors */ }
    return files;
  }

  private static findClosestMatch(importPath: string, allFiles: string[], projectRoot: string): string | undefined {
    const importBase = basename(importPath).replace(/\.[^.]+$/, "").toLowerCase();
    let best: string | undefined;
    let bestDist = Infinity;

    for (const f of allFiles) {
      const fileBase = basename(f).replace(/\.[^.]+$/, "").toLowerCase();
      const dist = DependencyClosureValidator.levenshtein(importBase, fileBase);
      if (dist < bestDist && dist <= 3) {
        bestDist = dist;
        best = f.replace(projectRoot, "").replace(/\\/g, "/").replace(/^\//, "");
      }
    }

    return best;
  }

  public static validate(projectRoot: string): ClosureResult {
    const allFiles = DependencyClosureValidator.collectFiles(projectRoot);
    const brokenImports: ClosureViolation[] = [];
    const missingSet = new Set<string>();
    const suggestedMatches = new Map<string, string>();

    const importRegex = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"](\.[^'"]+)['"]/g;

    for (const file of allFiles) {
      let content: string;
      try {
        content = readFileSync(file, "utf8");
      } catch { continue; }

      const fileDir = dirname(file);
      let match: RegExpExecArray | null;
      importRegex.lastIndex = 0;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith("node:")) continue;

        const resolved = DependencyClosureValidator.resolveModule(importPath, fileDir);

        if (resolved === null) {
          const relativeSource = file.replace(projectRoot, "").replace(/\\/g, "/").replace(/^\//, "");
          const attempts = DependencyClosureValidator.EXTENSIONS.map(
            ext => resolve(fileDir, importPath + ext).replace(projectRoot, "").replace(/\\/g, "/")
          );

          const suggested = DependencyClosureValidator.findClosestMatch(importPath, allFiles, projectRoot);

          const violation: ClosureViolation = {
            sourceFile: relativeSource,
            importPath,
            resolvedAttempts: attempts,
            suggestedMatch: suggested,
          };

          brokenImports.push(violation);
          missingSet.add(importPath);

          if (suggested) {
            suggestedMatches.set(importPath, suggested);
          }
        }
      }
    }

    const result: ClosureResult = {
      valid: brokenImports.length === 0,
      missing: [...missingSet],
      brokenImports,
      suggestedMatches,
    };

    if (!result.valid) {
      console.error(`\n[DependencyClosure] ❌ ${brokenImports.length} unresolved local import(s):`);
      for (const v of brokenImports.slice(0, 20)) {
        const fix = v.suggestedMatch ? ` → did you mean "${v.suggestedMatch}"?` : "";
        console.error(`  • ${v.sourceFile}: import "${v.importPath}"${fix}`);
      }
      if (brokenImports.length > 20) {
        console.error(`  ... and ${brokenImports.length - 20} more.`);
      }
    } else {
      console.log(`[DependencyClosure] ✓ All local imports resolved (${allFiles.length} files scanned)`);
    }

    return result;
  }

  /**
   * Apply deterministic fixes for extension-mismatch violations.
   * e.g. import "./routes" when routes.tsx exists → fix the import in-place.
   * Returns number of fixes applied.
   */
  public static applyDeterministicFixes(projectRoot: string, violations: ClosureViolation[]): number {
    let fixed = 0;

    for (const v of violations) {
      if (!v.suggestedMatch) continue;

      const sourceAbs = join(projectRoot, v.sourceFile);
      if (!existsSync(sourceAbs)) continue;

      try {
        let content = readFileSync(sourceAbs, "utf8");
        const targetAbs = join(projectRoot, v.suggestedMatch);
        const sourceDir = dirname(sourceAbs);
        
        // Build relative path from source dir to target
        const relRaw = relative(sourceDir, targetAbs).replace(/\\/g, "/");
        const relPath = relRaw.startsWith(".") ? relRaw : "./" + relRaw;
        // Strip extension — TypeScript imports don't use .ts/.tsx
        const relNoExt = relPath.replace(/\.(ts|tsx|js|jsx)$/, "");

        const oldImport = `"${v.importPath}"`;
        const newImport = `"${relNoExt}"`;

        if (content.includes(oldImport) && relNoExt !== v.importPath) {
          content = content.split(oldImport).join(newImport);
          writeFileSync(sourceAbs, content, "utf8");
          console.log(`[DependencyClosure] ✓ Fixed: "${v.importPath}" → "${relNoExt}" in ${v.sourceFile}`);
          fixed++;
        }
      } catch { /* ignore */ }
    }

    return fixed;
  }
}
