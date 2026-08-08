import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { CanonicalProjectSpecification } from "../spec/canonical-spec.js";
import { ProjectSpecification } from "../architect/specification.js";

export interface ArchitectureContractV1 {
  version: 1;
  status: "locked";
  frontend: {
    framework: string; // e.g. "Next.js" | "React-Vite" | "HTML"
  };
  backend: {
    framework: string; // e.g. "Next.js API Routes" | "Express" | "Fastify" | "None"
  };
  database: {
    provider: string; // e.g. "PostgreSQL" | "SQLite" | "MongoDB" | "MySQL"
    orm: string; // e.g. "Prisma" | "Drizzle" | "TypeORM" | "None"
  };
  language: string; // e.g. "TypeScript" | "JavaScript"
  styling: string; // e.g. "TailwindCSS" | "CSS Modules"
  packageManager: "pnpm" | "npm" | "yarn";
  authentication: string; // e.g. "NextAuth.js" | "JWT" | "Session" | "none"
  requiredLibraries: string[];
  requiredFeatures: string[];
  requiredRoutes: string[];
  requiredModels: string[];
  projectStructure: Record<string, string>;
}

export class ArchitectureResolver {
  public static resolve(
    userPrompt: string,
    rawSpec: ProjectSpecification,
    canonicalSpec: CanonicalProjectSpecification
  ): ArchitectureContractV1 {
    const promptLower = userPrompt.toLowerCase();

    // Single source of truth resolution rules
    let frontendFramework = canonicalSpec.lockedStack?.frontend || rawSpec.frontend || "React-Vite";
    if (promptLower.includes("next.js") || promptLower.includes("nextjs")) frontendFramework = "Next.js";
    else if (promptLower.includes("vite") || promptLower.includes("react")) frontendFramework = "React-Vite";

    let backendFramework = canonicalSpec.lockedStack?.backend || rawSpec.backend || "Express";
    if (promptLower.includes("next.js api") || promptLower.includes("next api")) backendFramework = "Next.js API Routes";
    else if (promptLower.includes("express")) backendFramework = "Express";

    let dbProvider = canonicalSpec.lockedStack?.database || rawSpec.database || "SQLite";
    if (promptLower.includes("postgres") || promptLower.includes("postgresql")) dbProvider = "PostgreSQL";
    else if (promptLower.includes("sqlite")) dbProvider = "SQLite";

    let orm = canonicalSpec.lockedStack?.orm || "Prisma";
    if (promptLower.includes("drizzle")) orm = "Drizzle";
    else if (promptLower.includes("prisma")) orm = "Prisma";

    let auth = canonicalSpec.lockedStack?.auth || rawSpec.auth || "none";
    if (promptLower.includes("nextauth") || promptLower.includes("next-auth")) auth = "NextAuth.js";
    else if (promptLower.includes("jwt")) auth = "JWT";

    return {
      version: 1,
      status: "locked",
      frontend: { framework: frontendFramework },
      backend: { framework: backendFramework },
      database: { provider: dbProvider, orm },
      language: canonicalSpec.lockedStack?.language || rawSpec.language || "TypeScript",
      styling: canonicalSpec.lockedStack?.styling || rawSpec.styling || "TailwindCSS",
      packageManager: canonicalSpec.lockedStack?.packageManager || rawSpec.packageManager || "pnpm",
      authentication: auth,
      requiredLibraries: canonicalSpec.inferredLibraries || rawSpec.inferredLibraries || [],
      requiredFeatures: canonicalSpec.features || rawSpec.features || [],
      requiredRoutes: canonicalSpec.userFlows || rawSpec.userFlows || [],
      requiredModels: canonicalSpec.dataModels || rawSpec.dataModels || [],
      projectStructure: {
        src: "Frontend source directory",
        server: "Backend server directory",
        prisma: "Database schema directory"
      }
    };
  }

  public static writeContract(outputDirectory: string, contract: ArchitectureContractV1): void {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    writeFileSync(join(aegisDir, "architecture-contract.json"), JSON.stringify(contract, null, 2), "utf8");
    console.log(`[ArchitectureResolver] 🔒 Locked Single-Source Architecture Contract: ${contract.frontend.framework} + ${contract.backend.framework} + ${contract.database.provider} (${contract.database.orm})`);
  }

  public static loadContract(outputDirectory: string): ArchitectureContractV1 | null {
    const contractPath = join(outputDirectory, ".aegis", "architecture-contract.json");
    if (!existsSync(contractPath)) return null;
    try {
      return JSON.parse(readFileSync(contractPath, "utf8"));
    } catch {
      return null;
    }
  }
}
