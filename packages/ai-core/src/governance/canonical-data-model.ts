/**
 * CanonicalDataModelContract
 *
 * Contract-driven data model interface for AEGIS generation.
 * Refactored in V2.1 to delegate dynamically to ContractDrivenDataModelGenerator
 * and DynamicDataModelContract, eliminating hardcoded domain branching.
 */

import { ContractDrivenDataModelGenerator } from "./contract-driven-data-model-generator.js";
import type { ArchitectureContractV1 } from "./architecture-resolver.js";

export class CanonicalDataModelContract {
  /**
   * Returns the Prisma schema dynamically based on the project contract or prompt text.
   * Never forces an arbitrary domain onto a project.
   */
  public static getPrismaSchema(promptOrContract?: string | ArchitectureContractV1, databaseProvider: string = "postgresql"): string {
    if (!promptOrContract) {
      // Default generic schema
      return ContractDrivenDataModelGenerator.deriveFromPrompt("", databaseProvider).prismaSchema;
    }

    if (typeof promptOrContract === "object") {
      return ContractDrivenDataModelGenerator.generatePrismaSchema(promptOrContract, databaseProvider);
    }

    return ContractDrivenDataModelGenerator.deriveFromPrompt(promptOrContract, databaseProvider).prismaSchema;
  }

  /**
   * Returns model names dynamically based on the prompt or contract.
   */
  public static getModelNames(promptOrContract?: string | ArchitectureContractV1): string[] {
    if (!promptOrContract) {
      return ["User", "Item", "Activity"];
    }

    if (typeof promptOrContract === "object") {
      return ContractDrivenDataModelGenerator.getModelNames(promptOrContract);
    }

    const derived = ContractDrivenDataModelGenerator.deriveFromPrompt(promptOrContract);
    return derived.modelNames;
  }

  /**
   * Validates that a Prisma schema string contains required model definitions for the contract/prompt.
   */
  public static validateSchema(
    schemaContent: string,
    promptOrContract?: string | ArchitectureContractV1
  ): { valid: boolean; missingModels: string[] } {
    if (typeof promptOrContract === "object") {
      const result = ContractDrivenDataModelGenerator.validateSchemaContract(schemaContent, promptOrContract, { strict: false });
      return {
        valid: result.valid,
        missingModels: result.violation?.missingModels || [],
      };
    }

    const required = CanonicalDataModelContract.getModelNames(promptOrContract);
    const missingModels: string[] = [];
    for (const model of required) {
      const pattern = new RegExp(`model\\s+${model}\\s*\\{`, "m");
      if (!pattern.test(schemaContent)) {
        missingModels.push(model);
      }
    }
    return { valid: missingModels.length === 0, missingModels };
  }
}

export class CanonicalPrismaModelRegistry {
  public static isValidDelegate(delegateName: string): boolean {
    // In contract-driven mode, any alphanumeric identifier can be a valid model delegate
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(delegateName);
  }
}

export class PrismaDelegateOperationRegistry {
  public static readonly OPERATIONS = [
    "findUnique",
    "findUniqueOrThrow",
    "findFirst",
    "findFirstOrThrow",
    "findMany",
    "create",
    "createMany",
    "createManyAndReturn",
    "update",
    "updateMany",
    "updateManyAndReturn",
    "upsert",
    "delete",
    "deleteMany",
    "count",
    "aggregate",
    "groupBy",
  ] as const;

  public static isValidOperation(operation: string): boolean {
    return (PrismaDelegateOperationRegistry.OPERATIONS as readonly string[]).includes(operation);
  }
}

export class CanonicalPrismaFieldRegistry {
  public static getFields(modelName: string): Set<string> | null {
    // Generic field registry: standard ID and timestamp fields are always valid
    return new Set(["id", "createdAt", "updatedAt", "userId", "name", "content", "status", "user"]);
  }
}
