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

    if (typeof promptOrContract === "string" && promptOrContract.trim().length > 0) {
      const required = CanonicalDataModelContract.getModelNames(promptOrContract);
      const presentModels = new Set([...schemaContent.matchAll(/^model\s+(\w+)\s*\{/gm)].map(m => m[1]));
      const aliases: Record<string, string[]> = {
        BoardColumn: ["Column", "KanbanColumn", "BoardColumn"],
        Column: ["BoardColumn", "KanbanColumn", "Column"],
        Task: ["TaskItem", "Task", "TodoItem", "KanbanTask"],
        TaskItem: ["Task", "TaskItem", "TodoItem"],
        Board: ["KanbanBoard", "Board"],
        AnalysisResult: ["AnalysisResult", "ScanResult", "MatchAnalysis"],
      };
      const missingModels = required.filter(m => {
        if (presentModels.has(m)) return false;
        const mAliases = aliases[m] || [];
        return !mAliases.some(alias => presentModels.has(alias));
      });
      return { valid: missingModels.length === 0, missingModels };
    }

    // If no context is provided, ensure the schema is not empty and defines at least User model
    const hasUser = /model\s+User\s*\{/m.test(schemaContent);
    const presentModels = [...schemaContent.matchAll(/^model\s+(\w+)\s*\{/gm)].map(m => m[1]);
    
    if (presentModels.length > 0 && hasUser) {
      return { valid: true, missingModels: [] };
    }

    if (presentModels.length > 0 && !hasUser) {
      return { valid: false, missingModels: ["User"] };
    }

    return { valid: false, missingModels: ["User", "Item", "Activity"] };
  }
}

export class CanonicalPrismaModelRegistry {
  public static readonly MODEL_DELEGATES = [
    "user",
    "task",
    "boardColumn",
    "project",
    "resume",
    "jobDescription",
    "analysisResult",
    "item",
    "activity"
  ];
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
