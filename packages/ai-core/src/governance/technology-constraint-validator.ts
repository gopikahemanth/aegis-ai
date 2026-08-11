import { ArchitectureContractV1 } from "./architecture-resolver.js";

export interface PackageJsonValidationResult {
  valid: boolean;
  forbiddenFound: string[];
  cleaned: { dependencies: Record<string, string>; devDependencies: Record<string, string> };
}

/**
 * TechnologyConstraintValidator
 *
 * Filters inferred libraries and validates package.json before and after generation.
 * Rejects packages that conflict with the locked architecture contract.
 *
 * CRITICAL: Any package in ABSOLUTE_FORBIDDEN is rejected regardless of contract.
 * These are packages that can NEVER be installed in a React-Vite + Express + Prisma project.
 */
export class TechnologyConstraintValidator {
  /**
   * Packages that are ALWAYS forbidden regardless of architecture contract.
   * These represent forbidden frameworks/ORMs that corrupt the canonical stack.
   */
  private static readonly ABSOLUTE_FORBIDDEN = new Set([
    // Next.js ecosystem
    "next",
    "next-auth",
    "@next/auth",
    "@auth/core",
    "@auth/prisma-adapter",
    // MongoDB ecosystem
    "mongoose",
    "mongodb",
    "mongodb-memory-server",
    "@mongodb-js/saslprep",
    // Drizzle ecosystem
    "drizzle-orm",
    "drizzle-kit",
    "@drizzle-team/studio",
    // Vercel/platform specific
    "@vercel/og",
    "@vercel/analytics",
    // AWS SDK (not needed for local deterministic keyword scanner)
    "aws-sdk",
    "@aws-sdk/client-s3",
    // OpenAI / AI providers — app uses deterministic local NLP, not LLM APIs
    "openai",
    "@anthropic-ai/sdk",
    "anthropic",
    "cohere-ai",
    "langchain",
    "@langchain/core",
    "ai", // Vercel AI SDK
  ]);

  /**
   * Additional forbidden when using PostgreSQL (non-Mongo ORMs only)
   */
  private static readonly FORBIDDEN_WITH_POSTGRES = new Set([
    "mongoose",
    "mongodb",
    "mongodb-memory-server",
    "next-auth",
    "@next/auth",
    "drizzle-orm",
    "drizzle-kit",
  ]);

  /**
   * Filter an array of library names against the canonical contract.
   * Returns { allowed, forbidden }.
   */
  public static filterLibraries(
    libraries: string[],
    contract: ArchitectureContractV1
  ): { allowed: string[]; forbidden: string[] } {
    const allowed: string[] = [];
    const forbidden: string[] = [];

    const dbProvider = (contract.database?.provider || "").toLowerCase();
    const isPostgresFamily =
      dbProvider.includes("postgres") ||
      dbProvider.includes("sqlite") ||
      dbProvider.includes("mysql");

    for (const lib of libraries) {
      const lower = lib.toLowerCase().trim();

      // Always forbidden check
      if (TechnologyConstraintValidator.ABSOLUTE_FORBIDDEN.has(lower)) {
        forbidden.push(lib);
        console.warn(
          `[DEPENDENCY-CONTRACT] 🚫 Rejected absolutely forbidden library "${lib}" (canonical stack violation).`
        );
        continue;
      }

      // Database-family-specific forbidden
      if (isPostgresFamily && TechnologyConstraintValidator.FORBIDDEN_WITH_POSTGRES.has(lower)) {
        forbidden.push(lib);
        console.warn(
          `[DEPENDENCY-CONTRACT] 🚫 Rejected forbidden library "${lib}" for ${contract.database.provider} stack.`
        );
        continue;
      }

      // Check for forbidden package prefixes
      const isForbiddenPrefix =
        lower.startsWith("@next/") ||
        lower.startsWith("@auth/") ||
        lower.startsWith("next-") ||
        (lower.startsWith("drizzle") && lower !== "drizzle") ||
        lower.startsWith("@vercel/");

      if (isForbiddenPrefix) {
        forbidden.push(lib);
        console.warn(
          `[DEPENDENCY-CONTRACT] 🚫 Rejected forbidden package prefix "${lib}".`
        );
        continue;
      }

      allowed.push(lib);
    }

    return { allowed, forbidden };
  }

  /**
   * Validate a parsed package.json object against the canonical contract.
   * Returns all forbidden packages found, and the cleaned version with them removed.
   */
  public static validatePackageJson(
    pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> },
    _contract?: ArchitectureContractV1
  ): PackageJsonValidationResult {
    const forbiddenFound: string[] = [];
    const cleanedDeps: Record<string, string> = { ...(pkg.dependencies || {}) };
    const cleanedDevDeps: Record<string, string> = { ...(pkg.devDependencies || {}) };

    const allEntries: [string, Record<string, string>][] = [
      ["dependencies", cleanedDeps],
      ["devDependencies", cleanedDevDeps],
    ];

    for (const [section, deps] of allEntries) {
      for (const pkgName of Object.keys(deps)) {
        const lower = pkgName.toLowerCase().trim();

        const isForbidden =
          TechnologyConstraintValidator.ABSOLUTE_FORBIDDEN.has(lower) ||
          lower.startsWith("@next/") ||
          lower.startsWith("@auth/") ||
          lower.startsWith("next-") ||
          (lower.startsWith("drizzle") && lower !== "drizzle") ||
          lower.startsWith("@vercel/");

        if (isForbidden) {
          forbiddenFound.push(pkgName);
          delete deps[pkgName];
          console.warn(
            `[DEPENDENCY-CONTRACT] FAIL — Forbidden dependency "${pkgName}" found in ${section}. Removing.`
          );
        }
      }
    }

    if (forbiddenFound.length === 0) {
      console.log(`[DEPENDENCY-CONTRACT] PASS — No forbidden dependencies in package.json.`);
    }

    return {
      valid: forbiddenFound.length === 0,
      forbiddenFound,
      cleaned: { dependencies: cleanedDeps, devDependencies: cleanedDevDeps },
    };
  }
}
