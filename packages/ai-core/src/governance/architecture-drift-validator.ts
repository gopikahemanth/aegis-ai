/**
 * ArchitectureDriftValidator & ServerBoundaryValidator
 *
 * Enforces strict compliance between the locked ArchitectureContract, TechnologyContract,
 * and the actual generated/existing code on disk.
 *
 * Catches:
 * 1. Framework drift (e.g. Next.js in a React-Vite project, NestJS in an Express project)
 * 2. Database & ORM drift (e.g. MongoDB/Mongoose in a PostgreSQL/Prisma project)
 * 3. Server boundary violations (Frontend code importing Prisma, DB drivers, fs, child_process)
 * 4. Secret leaks in client bundles (e.g. process.env.DATABASE_URL, JWT_SECRET in src/)
 * 5. Package manager drift (pnpm vs npm)
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { ArchitectureContractV1 } from "./architecture-resolver.js";

export interface DriftIssue {
  category: "FRAMEWORK_DRIFT" | "DATABASE_DRIFT" | "ORM_DRIFT" | "BOUNDARY_VIOLATION" | "SECRET_LEAK" | "PACKAGE_MANAGER_DRIFT";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  file?: string;
  expected: string;
  actual: string;
  description: string;
}

export interface ArchitectureValidationResult {
  valid: boolean;
  driftDetected: boolean;
  issues: DriftIssue[];
  summary: string;
}

export class ArchitectureDriftValidator {
  /**
   * Validate project on disk against the locked ArchitectureContract.
   */
  public static validate(
    projectPath: string,
    contract: ArchitectureContractV1
  ): ArchitectureValidationResult {
    const issues: DriftIssue[] = [];

    // ── 1. Validate package.json dependencies against locked contract ────────
    const pkgPath = join(projectPath, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        const allDeps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {}),
        };

        const isReactVite = contract.frontend.framework.toLowerCase().includes("vite") || contract.frontend.framework.toLowerCase().includes("react");
        const isNext = contract.frontend.framework.toLowerCase().includes("next");
        const isPostgres = contract.database.provider.toLowerCase().includes("postgres");
        const isPrisma = contract.database.orm.toLowerCase().includes("prisma");

        // Framework drift checks
        if (isReactVite && allDeps["next"]) {
          issues.push({
            category: "FRAMEWORK_DRIFT",
            severity: "CRITICAL",
            file: "package.json",
            expected: contract.frontend.framework,
            actual: "next",
            description: `Locked architecture is ${contract.frontend.framework}, but "next" dependency was found in package.json.`,
          });
        }

        if (!isNext && (allDeps["next-auth"] || allDeps["@next-auth/prisma-adapter"])) {
          issues.push({
            category: "FRAMEWORK_DRIFT",
            severity: "CRITICAL",
            file: "package.json",
            expected: contract.authentication,
            actual: "next-auth",
            description: `Locked auth is ${contract.authentication}, but "next-auth" was installed in a non-Next.js project.`,
          });
        }

        if (contract.backend.framework === "Express" && (allDeps["@nestjs/core"] || allDeps["@nestjs/common"])) {
          issues.push({
            category: "FRAMEWORK_DRIFT",
            severity: "CRITICAL",
            file: "package.json",
            expected: "Express",
            actual: "NestJS",
            description: `Locked backend is Express, but NestJS dependencies were found in package.json.`,
          });
        }

        // Database / ORM drift checks
        if (isPostgres && (allDeps["mongoose"] || allDeps["mongodb"])) {
          issues.push({
            category: "DATABASE_DRIFT",
            severity: "CRITICAL",
            file: "package.json",
            expected: "PostgreSQL",
            actual: "MongoDB/Mongoose",
            description: `Locked database is PostgreSQL, but MongoDB/Mongoose dependencies were found.`,
          });
        }

        if (isPrisma && (allDeps["drizzle-orm"] || allDeps["typeorm"])) {
          issues.push({
            category: "ORM_DRIFT",
            severity: "CRITICAL",
            file: "package.json",
            expected: "Prisma",
            actual: allDeps["drizzle-orm"] ? "Drizzle ORM" : "TypeORM",
            description: `Locked ORM is Prisma, but competing ORM package was found.`,
          });
        }

        // Package manager drift check
        if (contract.packageManager === "pnpm" && existsSync(join(projectPath, "package-lock.json"))) {
          issues.push({
            category: "PACKAGE_MANAGER_DRIFT",
            severity: "HIGH",
            file: "package-lock.json",
            expected: "pnpm (pnpm-lock.yaml)",
            actual: "npm (package-lock.json)",
            description: `Locked package manager is pnpm, but npm package-lock.json exists.`,
          });
        }
      } catch {}
    }

    // ── 2. Scan source files for Server Boundary Violations & Secret Leaks ────
    const srcDir = join(projectPath, "src");
    if (existsSync(srcDir)) {
      const frontendFiles = this.collectFiles(srcDir);

      for (const file of frontendFiles) {
        if (!file.endsWith(".ts") && !file.endsWith(".tsx") && !file.endsWith(".js") && !file.endsWith(".jsx")) {
          continue;
        }

        try {
          const content = readFileSync(file, "utf8");
          const relPath = file.replace(projectPath, "").replace(/^[/\\]/, "").replace(/\\/g, "/");

          // Boundary checks: Prisma, DB drivers, node fs in frontend
          if (
            content.includes('from "@prisma/client"') ||
            content.includes("from '@prisma/client'") ||
            content.includes('from "prisma"') ||
            content.includes('require("@prisma/client")')
          ) {
            issues.push({
              category: "BOUNDARY_VIOLATION",
              severity: "CRITICAL",
              file: relPath,
              expected: "Server-only database client isolation",
              actual: "Frontend importing @prisma/client",
              description: `Server boundary violation: Frontend component ${relPath} directly imports @prisma/client.`,
            });
          }

          if (
            content.includes('from "node:fs"') ||
            content.includes('from "fs"') ||
            content.includes('from "node:child_process"') ||
            content.includes('from "child_process"')
          ) {
            issues.push({
              category: "BOUNDARY_VIOLATION",
              severity: "CRITICAL",
              file: relPath,
              expected: "Browser-compatible execution environment",
              actual: "Frontend importing Node.js server modules (fs/child_process)",
              description: `Server boundary violation: Frontend component ${relPath} imports server-only Node.js module.`,
            });
          }

          // Secret Leak checks: DATABASE_URL, JWT_SECRET in client code
          if (
            content.includes("process.env.DATABASE_URL") ||
            content.includes("process.env.JWT_SECRET") ||
            content.includes("import.meta.env.DATABASE_URL") ||
            content.includes("import.meta.env.JWT_SECRET")
          ) {
            issues.push({
              category: "SECRET_LEAK",
              severity: "CRITICAL",
              file: relPath,
              expected: "Zero secret tokens exposed in client bundles",
              actual: "Frontend references secret environment variables",
              description: `Security violation: Secret environment variable (DATABASE_URL or JWT_SECRET) referenced in client file ${relPath}.`,
            });
          }
        } catch {}
      }
    }

    const driftDetected = issues.length > 0;
    return {
      valid: !driftDetected,
      driftDetected,
      issues,
      summary: driftDetected
        ? `ARCHITECTURE_DRIFT: ${issues.length} violation(s) detected: ${issues.map(i => `[${i.category}] ${i.description}`).join("; ")}`
        : "Project perfectly conforms to locked ArchitectureContract.",
    };
  }

  private static collectFiles(dir: string): string[] {
    const files: string[] = [];
    if (!existsSync(dir)) return files;

    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        files.push(...this.collectFiles(full));
      } else {
        files.push(full);
      }
    }
    return files;
  }
}
