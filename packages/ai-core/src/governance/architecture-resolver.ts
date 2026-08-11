import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { CanonicalProjectSpecification } from "../spec/canonical-spec.js";
import { ProjectSpecification } from "../architect/specification.js";

export type ProvenanceSource = "user" | "default" | "inferred";

export interface ArchitectureContractV1 {
  version: 1;
  status: "locked";
  prompt?: string;
  /** Overall provenance of this contract */
  source: "user_prompt" | "canonical_spec" | "system_default";
  confidence: number;
  reason: string;
  userSpecified: boolean;
  inferred: boolean;
  overridden: boolean;
  frontend: {
    framework: string;
    provenance: ProvenanceSource;
  };
  backend: {
    framework: string;
    provenance: ProvenanceSource;
  };
  database: {
    provider: string;
    orm: string;
    provenance: ProvenanceSource;
    ormProvenance: ProvenanceSource;
  };
  language: string;
  styling: string;
  packageManager: "pnpm" | "npm" | "yarn";
  authentication: string;
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
    canonicalSpec: CanonicalProjectSpecification,
    outputDirectory?: string
  ): ArchitectureContractV1 {
    // ── Idempotency Check: Load existing locked contract ONLY if prompt matches ───────────
    if (outputDirectory) {
      const existing = ArchitectureResolver.loadContract(outputDirectory);
      if (existing && existing.status === "locked") {
        const contractPrompt = (existing as any).prompt || "";
        if (!contractPrompt || contractPrompt.trim().toLowerCase() === userPrompt.trim().toLowerCase()) {
          console.log(`[ArchitectureResolver] 🔒 Reusing existing locked Architecture Contract (DB: ${existing.database.provider}, Frontend: ${existing.frontend.framework})`);
          return existing;
        } else {
          console.log(`[ArchitectureResolver] ⚠️ New prompt detected — invalidating stale Architecture Contract from previous run.`);
        }
      }
    }

    const promptLower = userPrompt.toLowerCase();

    // ── FRONTEND resolution with provenance ─────────────────────────────────
    let frontendFramework = "React-Vite";
    let frontendProvenance: ProvenanceSource = "default";

    if (promptLower.includes("next.js") || promptLower.includes("nextjs")) {
      frontendFramework = "Next.js";
      frontendProvenance = "user";
    } else if (promptLower.includes("vite") || promptLower.includes("react")) {
      frontendFramework = "React-Vite";
      frontendProvenance = "user";
    } else if (canonicalSpec.lockedStack?.frontend) {
      frontendFramework = canonicalSpec.lockedStack.frontend;
      frontendProvenance = "inferred";
    } else if (rawSpec.frontend) {
      frontendFramework = rawSpec.frontend;
      frontendProvenance = "inferred";
    }

    // ── BACKEND resolution with provenance ──────────────────────────────────
    let backendFramework = "Express";
    let backendProvenance: ProvenanceSource = "default";

    if (promptLower.includes("next.js api") || promptLower.includes("next api")) {
      backendFramework = "Next.js API Routes";
      backendProvenance = "user";
    } else if (promptLower.includes("express")) {
      backendFramework = "Express";
      backendProvenance = "user";
    } else if (promptLower.includes("fastify")) {
      backendFramework = "Fastify";
      backendProvenance = "user";
    } else if (promptLower.includes("nestjs") || promptLower.includes("nest.js")) {
      backendFramework = "NestJS";
      backendProvenance = "user";
    } else if (canonicalSpec.lockedStack?.backend) {
      backendFramework = canonicalSpec.lockedStack.backend;
      backendProvenance = "inferred";
    } else if (rawSpec.backend) {
      backendFramework = rawSpec.backend;
      backendProvenance = "inferred";
    }

    // ── DATABASE resolution with provenance ─────────────────────────────────
    // CRITICAL: Default is PostgreSQL (source: "default").
    // ONLY the user's explicit prompt keywords can change this.
    // LLM-inferred values from rawSpec/canonicalSpec MUST NOT override it.
    let dbProvider = "PostgreSQL";
    let dbProvenance: ProvenanceSource = "default";

    if (promptLower.includes("postgres") || promptLower.includes("postgresql")) {
      dbProvider = "PostgreSQL";
      dbProvenance = "user";
    } else if (promptLower.includes("mongodb") || promptLower.includes("mongo")) {
      dbProvider = "MongoDB";
      dbProvenance = "user";
    } else if (promptLower.includes("sqlite")) {
      dbProvider = "SQLite";
      dbProvenance = "user";
    } else if (promptLower.includes("mysql")) {
      dbProvider = "MySQL";
      dbProvenance = "user";
    }
    // NOTE: We intentionally do NOT fall through to canonicalSpec.lockedStack.database
    // or rawSpec.database. Those values come from LLM inference and MUST NOT silently
    // change the configured default database.

    // ── ORM resolution with provenance ──────────────────────────────────────
    let orm = "Prisma";
    let ormProvenance: ProvenanceSource = "default";

    if (promptLower.includes("drizzle")) {
      orm = "Drizzle";
      ormProvenance = "user";
    } else if (promptLower.includes("mongoose")) {
      orm = "Mongoose";
      ormProvenance = "user";
    } else if (promptLower.includes("prisma")) {
      orm = "Prisma";
      ormProvenance = "user";
    } else if (promptLower.includes("typeorm")) {
      orm = "TypeORM";
      ormProvenance = "user";
    }

    // ── ORM / DB compatibility enforcement ──────────────────────────────────
    // Mongoose is only valid for MongoDB. Enforce this without user override.
    if (orm === "Mongoose" && dbProvider !== "MongoDB") {
      console.warn(
        `[ArchitectureResolver] ⚠️ ORM conflict: "Mongoose" is incompatible with database "${dbProvider}". Overriding ORM to "Prisma".`
      );
      orm = "Prisma";
      ormProvenance = "inferred";
    }

    // ── AUTH resolution ─────────────────────────────────────────────────────
    let auth = canonicalSpec.lockedStack?.auth || rawSpec.auth || "JWT";
    if (promptLower.includes("nextauth") || promptLower.includes("next-auth")) auth = "NextAuth.js";
    else if (promptLower.includes("jwt")) auth = "JWT";

    const hasUserInput = frontendProvenance === "user" || backendProvenance === "user" || dbProvenance === "user";

    return Object.freeze({
      version: 1,
      status: "locked",
      prompt: userPrompt,
      source: hasUserInput ? "user_prompt" : "canonical_spec",
      confidence: (frontendProvenance === "user" && backendProvenance === "user") ? 1.0 : 0.85,
      reason: `Contract locked by ArchitectureResolver. Frontend(${frontendProvenance}), Backend(${backendProvenance}), DB(${dbProvenance}), ORM(${ormProvenance})`,
      userSpecified: hasUserInput,
      inferred: !hasUserInput,
      overridden: false,
      frontend: Object.freeze({
        framework: frontendFramework,
        provenance: frontendProvenance,
      }),
      backend: Object.freeze({
        framework: backendFramework,
        provenance: backendProvenance,
      }),
      database: Object.freeze({
        provider: dbProvider,
        orm,
        provenance: dbProvenance,
        ormProvenance,
      }),
      language: canonicalSpec.lockedStack?.language || rawSpec.language || "TypeScript",
      styling: canonicalSpec.lockedStack?.styling || rawSpec.styling || "TailwindCSS",
      packageManager: canonicalSpec.lockedStack?.packageManager || rawSpec.packageManager || "pnpm",
      authentication: auth,
      requiredLibraries: canonicalSpec.inferredLibraries || rawSpec.inferredLibraries || [],
      requiredFeatures: canonicalSpec.features || rawSpec.features || [],
      requiredRoutes: canonicalSpec.userFlows || rawSpec.userFlows || [],
      requiredModels: canonicalSpec.dataModels || rawSpec.dataModels || [],
      projectStructure: Object.freeze({
        src: "Frontend source directory",
        server: "Backend server directory",
        prisma: "Database schema directory"
      })
    });
  }

  public static writeContract(outputDirectory: string, contract: ArchitectureContractV1): void {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    console.log(`[CONTRACT WRITE] caller: ArchitectureResolver, path: ${outputDirectory}, database: ${contract.database.provider}, frontend: ${contract.frontend.framework}, backend: ${contract.backend.framework}`);
    writeFileSync(join(aegisDir, "architecture-contract.json"), JSON.stringify(contract, null, 2), "utf8");
    console.log(
      `[ArchitectureResolver] 🔒 Locked Architecture Contract:\n` +
      `  Frontend:  ${contract.frontend.framework} [${contract.frontend.provenance}]\n` +
      `  Backend:   ${contract.backend.framework} [${contract.backend.provenance}]\n` +
      `  Database:  ${contract.database.provider} [${contract.database.provenance}]\n` +
      `  ORM:       ${contract.database.orm} [${contract.database.ormProvenance}]\n` +
      `  Auth:      ${contract.authentication}\n` +
      `  Language:  ${contract.language}`
    );
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

