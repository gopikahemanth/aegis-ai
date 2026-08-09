import { ArchitectureContractV1 } from "./architecture-resolver.js";

/**
 * TechnologyConstraintValidator
 *
 * Filters inferred libraries and dependencies before passing them to the
 * Planner or package.json generator. Rejects packages that conflict with
 * the locked architecture contract.
 */
export class TechnologyConstraintValidator {
  private static readonly FORBIDDEN_POSTGRES = new Set([
    "mongoose",
    "mongodb",
    "mongodb-memory-server",
    "next-auth",
    "@next/auth",
  ]);

  public static filterLibraries(
    libraries: string[],
    contract: ArchitectureContractV1
  ): { allowed: string[]; forbidden: string[] } {
    const allowed: string[] = [];
    const forbidden: string[] = [];

    const dbProvider = (contract.database?.provider || "").toLowerCase();

    for (const lib of libraries) {
      const lower = lib.toLowerCase().trim();

      if (dbProvider.includes("postgres") || dbProvider.includes("sqlite") || dbProvider.includes("mysql")) {
        if (TechnologyConstraintValidator.FORBIDDEN_POSTGRES.has(lower) || lower.startsWith("mongoose")) {
          forbidden.push(lib);
          console.warn(`[TechnologyConstraint] 🚫 Rejected forbidden library "${lib}" for ${contract.database.provider} + ${contract.database.orm} stack.`);
          continue;
        }
      }

      allowed.push(lib);
    }

    return { allowed, forbidden };
  }
}
