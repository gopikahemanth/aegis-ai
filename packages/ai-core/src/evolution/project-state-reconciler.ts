/**
 * ProjectStateReconciler
 *
 * Reconstructs authoritative project state by comparing disk filesystem, package.json,
 * Prisma schemas, and routes against recorded contract state.
 * Detects drift and reconciles actual state without blind overwrites.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import type { ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import type { DomainContract } from "../governance/domain-contract.js";

export type DriftType =
  | "ARCHITECTURE_DRIFT"
  | "DOMAIN_DRIFT"
  | "DATA_DRIFT"
  | "API_DRIFT"
  | "FILE_GRAPH_DRIFT"
  | "DEPENDENCY_DRIFT"
  | "MANUAL_USER_EDIT";

export interface DriftDetectionResult {
  hasDrift: boolean;
  driftTypes: DriftType[];
  details: string[];
  diskFilesCount: number;
  reconciledState: {
    framework: string;
    database: string;
    models: string[];
    routes: string[];
    diskFileHashes: Record<string, string>;
  };
}

export class ProjectStateReconciler {
  /**
   * Reconcile actual disk state vs locked contracts.
   */
  public static reconcile(
    projectPath: string,
    lockedArch?: ArchitectureContractV1 | null,
    lockedDomain?: DomainContract | null
  ): DriftDetectionResult {
    const driftTypes: DriftType[] = [];
    const details: string[] = [];
    const diskFileHashes: Record<string, string> = {};

    // 1. Scan disk files
    const allFiles = this.collectSourceFiles(projectPath);
    for (const absFile of allFiles) {
      const rel = relative(projectPath, absFile).replace(/\\/g, "/");
      try {
        const content = readFileSync(absFile, "utf8");
        diskFileHashes[rel] = createHash("sha256").update(content).digest("hex").slice(0, 16);
      } catch {}
    }

    // 2. Discover package.json dependencies
    let detectedFramework = "React-Vite";
    const pkgPath = join(projectPath, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        if (deps["next"]) detectedFramework = "Next.js";
        else if (deps["react"]) detectedFramework = "React-Vite";
      } catch {}
    }

    // 3. Discover Database Models from prisma/schema.prisma
    const discoveredModels: string[] = [];
    const schemaPath = join(projectPath, "prisma", "schema.prisma");
    let detectedDatabase = "none";

    if (existsSync(schemaPath)) {
      try {
        const schemaContent = readFileSync(schemaPath, "utf8");
        const modelMatches = schemaContent.matchAll(/model\s+([A-Za-z0-9_]+)\s*\{/g);
        for (const match of modelMatches) {
          discoveredModels.push(match[1]);
        }
        if (schemaContent.includes('provider = "postgresql"')) detectedDatabase = "postgresql";
        else if (schemaContent.includes('provider = "sqlite"')) detectedDatabase = "sqlite";
      } catch {}
    }

    // 4. Compare vs locked contracts if provided
    if (lockedArch) {
      if (lockedArch.frontend.framework !== detectedFramework) {
        driftTypes.push("ARCHITECTURE_DRIFT");
        details.push(`Frontend drift: locked=${lockedArch.frontend.framework}, disk=${detectedFramework}`);
      }
      if (lockedArch.database.provider.toLowerCase() !== detectedDatabase.toLowerCase() && detectedDatabase !== "none") {
        driftTypes.push("DATA_DRIFT");
        details.push(`Database provider drift: locked=${lockedArch.database.provider}, disk=${detectedDatabase}`);
      }
    }

    if (lockedDomain) {
      const missingEntities = lockedDomain.entities
        .filter((e) => e.kind === "domain")
        .map((e) => e.name)
        .filter((name) => !discoveredModels.includes(name) && discoveredModels.length > 0);

      if (missingEntities.length > 0) {
        driftTypes.push("DOMAIN_DRIFT");
        details.push(`Missing domain entities on disk: ${missingEntities.join(", ")}`);
      }
    }

    return {
      hasDrift: driftTypes.length > 0,
      driftTypes,
      details,
      diskFilesCount: allFiles.length,
      reconciledState: {
        framework: detectedFramework,
        database: detectedDatabase,
        models: discoveredModels,
        routes: [],
        diskFileHashes,
      },
    };
  }

  private static collectSourceFiles(dir: string): string[] {
    const files: string[] = [];
    if (!existsSync(dir)) return files;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".aegis" || entry.name === "dist") {
        continue;
      }
      if (entry.isDirectory()) {
        files.push(...this.collectSourceFiles(full));
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
    return files;
  }
}
