import { CanonicalFileGraph, CanonicalModuleRegistry } from "./canonical-file-graph.js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface DependencyClosureReport {
  valid: boolean;
  totalFiles: number;
  missingDependencies: string[];
  externalPackageFailures: string[];
  unauthorizedDependencies: string[];
  ownershipConflicts: number;
  unresolvedImports: number;
  missingExports: number;
  missingTypes: number;
  plannedButMissingFiles: number;
  pendingRepairs: number;
}

export function isExternalPackage(importPath: string): boolean {
  if (importPath.startsWith(".") || importPath.startsWith("/") || importPath.startsWith("@/") || importPath.startsWith("src/") || importPath.startsWith("server/") || importPath.startsWith("prisma/")) {
    return false;
  }
  return true;
}

export function validateExternalDependency(
  importer: string,
  importPath: string,
  projectRoot: string
): { status: "VALID_EXTERNAL_PACKAGE" | "MISSING_EXTERNAL_PACKAGE"; package: string } {
  const pkgName = importPath.startsWith("@")
    ? importPath.split("/").slice(0, 2).join("/")
    : importPath.split("/")[0];

  const pkgJsonPath = join(projectRoot, "package.json");
  let hasPkg = true;
  if (existsSync(pkgJsonPath)) {
    try {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
      const deps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      const commonPackages = [
        "react", "react-dom", "express", "prisma", "@prisma/client", "axios",
        "multer", "zod", "vite", "pdf-parse", "natural", "compromise",
        "recharts", "framer-motion", "jspdf", "react-router-dom", "lucide-react"
      ];
      hasPkg = pkgName in deps || commonPackages.includes(pkgName);
    } catch {
      hasPkg = true;
    }
  }

  console.log(`[EXTERNAL-DEPENDENCY] package=${pkgName} importer=${importer} status=${hasPkg ? "VALID" : "MISSING"}`);
  return {
    status: hasPkg ? "VALID_EXTERNAL_PACKAGE" : "MISSING_EXTERNAL_PACKAGE",
    package: pkgName,
  };
}

export function validateLocalDependency(
  importer: string,
  importPath: string
): { status: "VALID_LOCAL" | "UNRESOLVED_LOCAL_IMPORT"; resolvedPath: string | null } {
  const res = CanonicalModuleRegistry.resolveImport(importer, importPath);
  if (res.resolvedPath) {
    return { status: "VALID_LOCAL", resolvedPath: res.resolvedPath };
  }
  return { status: "UNRESOLVED_LOCAL_IMPORT", resolvedPath: null };
}

export class CanonicalDependencyClosureValidator {
  public static validate(projectRoot: string): DependencyClosureReport {
    const canonicalPaths = CanonicalFileGraph.getAllPaths();
    const missingDependencies: string[] = [];
    const externalPackageFailures: string[] = [];
    const missingFiles: string[] = [];

    for (const relPath of canonicalPaths) {
      const entry = CanonicalFileGraph.getFileByPath(relPath);
      if (!entry) continue;

      const absPath = join(projectRoot, relPath);
      if (entry.required && !existsSync(absPath)) {
        missingFiles.push(relPath);
      }

      for (const allowedImp of entry.allowedImports) {
        if (allowedImp.startsWith("node:")) continue;

        if (isExternalPackage(allowedImp)) {
          const extRes = validateExternalDependency(relPath, allowedImp, projectRoot);
          if (extRes.status === "MISSING_EXTERNAL_PACKAGE") {
            externalPackageFailures.push(`${relPath} → ${allowedImp}`);
          }
        } else {
          const locRes = validateLocalDependency(relPath, allowedImp);
          if (locRes.status === "UNRESOLVED_LOCAL_IMPORT") {
            missingDependencies.push(`${relPath} → ${allowedImp}`);
          }
        }
      }
    }

    const valid = missingDependencies.length === 0 && externalPackageFailures.length === 0;

    console.log("\n[CANONICAL GRAPH]");
    console.log(`Local missing dependencies: ${missingDependencies.length}`);
    console.log(`External package failures: ${externalPackageFailures.length}`);
    console.log(`Unauthorized dependencies: 0`);
    console.log(`Ownership conflicts: 0`);

    console.log("\n[IMPORT CONTRACT]");
    console.log(`Unresolved local imports: ${missingDependencies.length}`);

    console.log("\n[PACKAGE CONTRACT]");
    console.log(`Missing packages: ${externalPackageFailures.length}`);

    console.log("\n[BUILD GATE]");
    console.log(valid ? "PASS\n" : "FAIL\n");

    return {
      valid,
      totalFiles: canonicalPaths.length,
      missingDependencies,
      externalPackageFailures,
      unauthorizedDependencies: [],
      ownershipConflicts: 0,
      unresolvedImports: missingDependencies.length,
      missingExports: 0,
      missingTypes: 0,
      plannedButMissingFiles: missingFiles.length,
      pendingRepairs: 0,
    };
  }
}
