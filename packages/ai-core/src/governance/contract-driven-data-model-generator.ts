/**
 * ContractDrivenDataModelGenerator
 *
 * Authoritative generator and validator for database schemas and data models,
 * strictly driven by the resolved ArchitectureContractV1 and DomainContract.
 *
 * Rules:
 * - NO hardcoded domain branching (no "if not resume then security").
 * - Models are derived dynamically from contract.requiredModels, contract.requiredFeatures,
 *   and contract.domainVocabulary / domain entities.
 * - Enforces strict model validation: mismatches result in DATA_CONTRACT_VIOLATION.
 */

import type { ArchitectureContractV1 } from "./architecture-resolver.js";
import { DomainContractDeriver, type DomainContract, type DomainEntity } from "./domain-contract.js";
import { DynamicDataModelContract, type DerivedDataContract, type DataModel, type DataField } from "./dynamic-data-model.js";

export interface DataContractViolation {
  code: "DATA_CONTRACT_VIOLATION";
  message: string;
  expectedModels: string[];
  actualModels: string[];
  missingModels: string[];
  unexpectedModels: string[];
  sourceOfUnexpectedModels?: string;
}

export class ContractDrivenDataModelGenerator {
  /**
   * Generates a complete Prisma schema directly from an ArchitectureContractV1.
   */
  public static generatePrismaSchema(contract: ArchitectureContractV1, databaseProvider?: string): string {
    const domain = DomainContractDeriver.derive(contract, contract.architectureHash || "hash_v1");
    const provider = databaseProvider || (contract.database?.provider ?? "postgresql");
    const derived = DynamicDataModelContract.derive(domain, provider);
    return derived.prismaSchema;
  }

  /**
   * Generates dynamic data models for downstream tasks from an ArchitectureContractV1.
   */
  public static deriveDataContract(contract: ArchitectureContractV1, databaseProvider?: string): DerivedDataContract {
    const domain = DomainContractDeriver.derive(contract, contract.architectureHash || "hash_v1");
    const provider = databaseProvider || (contract.database?.provider ?? "postgresql");
    return DynamicDataModelContract.derive(domain, provider);
  }

  /**
   * Derives data models directly from a prompt or domain entities when full contract is building.
   */
  public static deriveFromPrompt(promptText: string, databaseProvider: string = "postgresql"): DerivedDataContract {
    // Extract candidate entities from prompt
    const words = promptText.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    const candidateModels: string[] = ["User"];
    
    // Domain signal mapping
    const promptLower = promptText.toLowerCase();
    const commonDomainKeywords: Record<string, string[]> = {
      gym: ["Membership", "Attendance", "Payment", "WorkoutPlan", "TrainerProfile"],
      study: ["Course", "Flashcard", "StudySession", "QuizResult", "Note"],
      ecommerce: ["Product", "Order", "OrderItem", "Category", "Cart"],
      saas: ["Organization", "Project", "Subscription", "ActivityLog"],
      portfolio: ["Project", "Skill", "ContactMessage", "BlogPost"],
      chat: ["ChatSession", "Message", "PromptTemplate", "ApiUsage"],
      task: ["Task", "BoardColumn", "Project"],
      kanban: ["Task", "BoardColumn", "Project"],
      restaurant: ["MenuItem", "TableOrder", "Reservation", "Ingredient"],
      resume: ["Resume", "JobDescription", "AnalysisResult", "KeywordMatch"],
      security: ["Repository", "Scan", "Vulnerability", "Remediation", "AnalysisResult"],
    };

    let matched = false;
    for (const [key, models] of Object.entries(commonDomainKeywords)) {
      if (promptLower.includes(key)) {
        for (const m of models) {
          if (!candidateModels.includes(m)) candidateModels.push(m);
        }
        matched = true;
      }
    }

    if (!matched) {
      // General heuristic: find capitalized noun patterns or key requirement tokens
      const nounSignals = ["item", "record", "entry", "profile", "plan", "event", "booking", "message", "report"];
      for (const w of words) {
        const wLower = w.toLowerCase();
        if (nounSignals.some(s => wLower.endsWith(s)) && w.length > 3) {
          const cap = w[0].toUpperCase() + w.slice(1);
          if (!candidateModels.includes(cap)) candidateModels.push(cap);
        }
      }
      if (candidateModels.length === 1) {
        candidateModels.push("Item", "Activity", "Setting");
      }
    }

    const entities: DomainEntity[] = candidateModels.map(name => ({
      name,
      purpose: `${name} entity for application domain`,
      kind: name === "User" ? "infrastructure" : "domain",
    }));

    const domain: DomainContract = {
      version: 1,
      domainHash: "prompt_derived",
      architectureHash: "prompt_arch",
      domainName: "Derived Application Domain",
      domainDescription: promptText.slice(0, 100),
      entities,
      features: candidateModels.map(m => ({
        featureId: m.toLowerCase(),
        name: `${m} Management`,
        description: `Manage ${m} records`,
        entities: [m],
      })),
      allowedTerminology: candidateModels.map(m => m.toLowerCase()),
      suspiciousTerminology: [],
      lockedAt: new Date().toISOString(),
    };

    return DynamicDataModelContract.derive(domain, databaseProvider);
  }

  /**
   * Validate that a Prisma schema strictly matches the required models from the contract.
   * Throws or returns DataContractViolation if unexpected or missing models exist.
   */
  public static validateSchemaContract(
    schemaContent: string,
    contract: ArchitectureContractV1,
    options: { strict?: boolean } = { strict: true }
  ): { valid: boolean; violation?: DataContractViolation } {
    let expectedModels = contract.requiredModels && contract.requiredModels.length > 0 && !(contract.requiredModels.length === 1 && contract.requiredModels[0] === "User")
      ? [...new Set(["User", ...contract.requiredModels])]
      : (contract.prompt ? ContractDrivenDataModelGenerator.deriveFromPrompt(contract.prompt).modelNames : ["User"]);

    const presentModels = [...schemaContent.matchAll(/^model\s+(\w+)\s*\{/gm)].map(m => m[1]);
    const presentSet = new Set(presentModels);
    const expectedSet = new Set(expectedModels);

    const aliases: Record<string, string[]> = {
      BoardColumn: ["Column", "KanbanColumn", "BoardColumn"],
      Column: ["BoardColumn", "KanbanColumn", "Column"],
      Task: ["TaskItem", "Task", "TodoItem", "KanbanTask"],
      TaskItem: ["Task", "TaskItem", "TodoItem"],
      Board: ["KanbanBoard", "Board"],
      AnalysisResult: ["AnalysisResult", "ScanResult", "MatchAnalysis"],
    };

    const missingModels = expectedModels.filter(m => {
      if (presentSet.has(m)) return false;
      const mAliases = aliases[m] || [];
      return !mAliases.some(alias => presentSet.has(alias));
    });

    const unexpectedModels = presentModels.filter(m => {
      if (expectedSet.has(m)) return false;
      for (const exp of expectedModels) {
        const mAliases = aliases[exp] || [];
        if (mAliases.includes(m)) return false;
      }
      return true;
    });

    if (missingModels.length > 0 || (options.strict && unexpectedModels.length > 0)) {
      const violation: DataContractViolation = {
        code: "DATA_CONTRACT_VIOLATION",
        message: `Schema does not match Architecture Contract. Missing: [${missingModels.join(", ")}], Unexpected: [${unexpectedModels.join(", ")}]`,
        expectedModels,
        actualModels: presentModels,
        missingModels,
        unexpectedModels,
        sourceOfUnexpectedModels: unexpectedModels.length > 0 ? "Unauthorized model generation or template domain leakage" : undefined,
      };
      return { valid: false, violation };
    }

    return { valid: true };
  }

  /**
   * Returns model names for a given contract.
   */
  public static getModelNames(contract?: ArchitectureContractV1): string[] {
    if (contract?.requiredModels && contract.requiredModels.length > 0 && !(contract.requiredModels.length === 1 && contract.requiredModels[0] === "User")) {
      return [...new Set(["User", ...contract.requiredModels])];
    }
    if (contract?.prompt) {
      const derived = ContractDrivenDataModelGenerator.deriveFromPrompt(contract.prompt);
      return derived.modelNames;
    }
    return ["User", "Item", "Activity"];
  }
}
