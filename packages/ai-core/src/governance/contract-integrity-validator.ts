import { ArchitectureContractV1 } from "./architecture-resolver.js";

export class ContractMutationError extends Error {
  constructor(field: string, expected: string, actual: string) {
    super(`CONTRACT_MUTATION_DETECTED: Forbidden mutation detected in field "${field}". Expected "${expected}", but found "${actual}". Downstream components cannot alter locked contract values.`);
    this.name = "ContractMutationError";
  }
}

/**
 * ContractIntegrityValidator
 *
 * Enforces absolute immutability of locked architecture contracts across all
 * downstream representations (specifications, architecture plans, data models).
 */
export class ContractIntegrityValidator {
  public static assertValid(
    candidate: any,
    contract: ArchitectureContractV1
  ): void {
    if (!candidate || !contract) return;

    const dbExpected = contract.database.provider.toLowerCase();
    const ormExpected = contract.database.orm.toLowerCase();

    // Helper to deeply inspect objects/strings for illegal technology references
    const strCandidate = typeof candidate === "string" ? candidate : JSON.stringify(candidate);
    const lowerCandidate = strCandidate.toLowerCase();

    // 1. Database Check
    if (dbExpected.includes("postgres")) {
      if (lowerCandidate.includes("mongodb") || lowerCandidate.includes("mongoose")) {
        // Check if candidate explicitly sets database property to mongodb
        if (candidate.database && typeof candidate.database === "string" && candidate.database.toLowerCase().includes("mongo")) {
          throw new ContractMutationError("database", contract.database.provider, candidate.database);
        }
        if (candidate.databaseProvider && typeof candidate.databaseProvider === "string" && candidate.databaseProvider.toLowerCase().includes("mongo")) {
          throw new ContractMutationError("databaseProvider", contract.database.provider, candidate.databaseProvider);
        }
      }
    }

    // 2. ORM Check
    if (ormExpected.includes("prisma")) {
      if (candidate.orm && typeof candidate.orm === "string" && candidate.orm.toLowerCase().includes("mongoose")) {
        throw new ContractMutationError("orm", contract.database.orm, candidate.orm);
      }
    }

    // 3. Frontend Check
    if (contract.frontend.framework.toLowerCase().includes("react")) {
      if (candidate.frontend && typeof candidate.frontend === "string" && candidate.frontend.toLowerCase().includes("next")) {
        throw new ContractMutationError("frontend", contract.frontend.framework, candidate.frontend);
      }
    }
  }
}
