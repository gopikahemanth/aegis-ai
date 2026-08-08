import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

export interface FastSanitationReport {
  casingCollisionsResolved: number;
  missingDependenciesAdded: string[];
  exportFixesApplied: number;
  databaseUrlValid: boolean;
}

export class FastDeterministicSanitizer {
  public static sanitizeProject(outputDirectory: string): FastSanitationReport {
    const report: FastSanitationReport = {
      casingCollisionsResolved: 0,
      missingDependenciesAdded: [],
      exportFixesApplied: 0,
      databaseUrlValid: true
    };

    // 1. File Casing Collision Resolution
    report.casingCollisionsResolved = this.resolveCasingCollisions(outputDirectory);

    // 2. Dependency Closure
    report.missingDependenciesAdded = this.ensureDependencyClosure(outputDirectory);

    // 3. Export / Import contract sanitation
    report.exportFixesApplied = this.sanitizeExportContracts(outputDirectory);

    // 4. Database URL validation
    report.databaseUrlValid = this.validateDatabaseUrl(outputDirectory);

    return report;
  }

  private static resolveCasingCollisions(root: string): number {
    let resolved = 0;
    const allFiles = this.getAllFiles(root).filter(f => !f.includes("node_modules") && !f.includes(".aegis") && !f.includes(".git"));
    const pathMap = new Map<string, string>(); // lowercase -> actual path

    for (const file of allFiles) {
      const lower = file.toLowerCase();
      if (pathMap.has(lower) && pathMap.get(lower) !== file) {
        const existing = pathMap.get(lower)!;
        console.warn(`[CaseCollisionDetector] ⚠️ Case collision detected between "${file}" and "${existing}". Canonicalizing...`);
        try {
          unlinkSync(join(root, file));
          resolved++;
        } catch {}
      } else {
        pathMap.set(lower, file);
      }
    }
    return resolved;
  }

  private static ensureDependencyClosure(root: string): string[] {
    const pkgPath = join(root, "package.json");
    if (!existsSync(pkgPath)) return [];

    const added: string[] = [];
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      pkg.dependencies = pkg.dependencies || {};
      pkg.devDependencies = pkg.devDependencies || {};

      const codeFiles = this.getAllFiles(root).filter(f => (f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".js")) && !f.includes("node_modules"));
      const externalImports = new Set<string>();

      for (const file of codeFiles) {
        const content = readFileSync(join(root, file), "utf8");
        const matches = content.matchAll(/(?:import|from|require\()\s*['"]([^'"]+)['"]/g);
        for (const m of matches) {
          const specifier = m[1];
          if (!specifier.startsWith(".") && !specifier.startsWith("/") && !specifier.startsWith("node:")) {
            const pkgName = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
            externalImports.add(pkgName);
          }
        }
      }

      for (const imp of externalImports) {
        if (!pkg.dependencies[imp] && !pkg.devDependencies[imp]) {
          pkg.dependencies[imp] = "latest";
          added.push(imp);
          if (["express", "cors", "multer", "pdf-parse", "bcryptjs", "jsonwebtoken", "react", "react-dom"].includes(imp)) {
            pkg.devDependencies[`@types/${imp}`] = "latest";
          }
        }
      }

      if (added.length > 0) {
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
        console.log(`[DependencyClosure] 📦 Automatically added missing production imports: ${added.join(", ")}`);
      }
    } catch (err: any) {
      console.warn(`[DependencyClosure] Warning: ${err.message}`);
    }
    return added;
  }

  private static sanitizeExportContracts(root: string): number {
    let fixes = 0;
    const prismaPath = join(root, "server", "lib", "prisma.ts");
    if (existsSync(prismaPath)) {
      let content = readFileSync(prismaPath, "utf8");
      if (content.includes("export default prisma") && !content.includes("export const prisma")) {
        content = content + "\nexport const prisma = prismaClient;\n";
        writeFileSync(prismaPath, content, "utf8");
        fixes++;
      }
    }
    return fixes;
  }

  private static validateDatabaseUrl(root: string): boolean {
    const envPath = join(root, ".env");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf8");
      if (content.includes("DATABASE_URL")) {
        const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
        if (match && match[1]) {
          const url = match[1];
          if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
            console.warn(`[DatabaseValidator] ⚠️ Invalid DATABASE_URL protocol for PostgreSQL: "${url}". Setting canonical PostgreSQL URL...`);
            const fixed = content.replace(/DATABASE_URL=.*(\r?\n|$)/, 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aegis_app"\n');
            writeFileSync(envPath, fixed, "utf8");
            return false;
          }
        }
      }
    } else {
      writeFileSync(envPath, 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aegis_app"\n', "utf8");
    }
    return true;
  }

  private static getAllFiles(dir: string, baseDir = dir): string[] {
    let results: string[] = [];
    if (!existsSync(dir)) return results;
    const list = readdirSync(dir);
    for (const file of list) {
      const fullPath = join(dir, file);
      const relativePath = join(dir.replace(baseDir, ""), file).replace(/^[/\\]/, "");
      const stat = statSync(fullPath);
      if (stat && stat.isDirectory()) {
        if (file !== "node_modules" && file !== ".git" && file !== "dist") {
          results = results.concat(this.getAllFiles(fullPath, baseDir));
        }
      } else {
        results.push(relativePath);
      }
    }
    return results;
  }
}
