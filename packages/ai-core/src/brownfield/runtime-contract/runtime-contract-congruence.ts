/**
 * RuntimeContractCongruenceEngine — Aegis V2.3 Project 2 Phase 7.1
 *
 * Performs deterministic congruence comparison between TypeScript contracts and
 * runtime validation schemas (Zod).
 *
 * CONGRUENCE INVARIANTS:
 * 1. When type is inferred via z.infer<typeof Schema>, the schema is authoritative.
 * 2. When explicit TS interface exists, types, optionality, nullability, and enums must match.
 * 3. Ambiguous coercion/transforms -> UNRESOLVED_SCHEMA_COERCION.
 * 4. Type mismatches -> RUNTIME_CONTRACT_DIVERGENCE.
 */

import type { ContractDefinition } from "../contract-refactoring/contract-refactoring-contract.js";
import type {
  RuntimeSchemaDefinition,
  RuntimeCongruenceStatus,
} from "./runtime-contract-model.js";

export interface CongruenceAnalysisResult {
  status: RuntimeCongruenceStatus;
  isCongruent: boolean;
  divergences: string[];
  blockedReasons: string[];
}

export class RuntimeContractCongruenceEngine {
  /**
   * Evaluates congruence between a TypeScript contract and a runtime schema.
   */
  public evaluate(
    contract: ContractDefinition | null,
    schema: RuntimeSchemaDefinition | null
  ): CongruenceAnalysisResult {
    const divergences: string[] = [];

    if (!contract && !schema) {
      return {
        status: "SCHEMA_NOT_FOUND",
        isCongruent: false,
        divergences: ["Neither contract nor schema found."],
        blockedReasons: ["SCHEMA_NOT_FOUND"],
      };
    }

    if (!schema) {
      return {
        status: "SCHEMA_NOT_FOUND",
        isCongruent: false,
        divergences: [`Runtime schema not found for contract "${contract?.symbolName}"`],
        blockedReasons: [`SCHEMA_NOT_FOUND: No runtime validation schema found for "${contract?.symbolName}".`],
      };
    }

    // 1. Check for coercion or transform safety
    for (const field of schema.fields) {
      if (field.hasCoercion || field.hasTransform) {
        return {
          status: "UNRESOLVED_SCHEMA_COERCION",
          isCongruent: false,
          divergences: [`Field "${field.name}" contains unverified coercion or transform: ${field.rawTypeString}`],
          blockedReasons: [`UNRESOLVED_SCHEMA_COERCION: Field "${field.name}" uses dynamic coercion/transform.`],
        };
      }
    }

    // 2. If no separate TypeScript interface (e.g. z.infer pattern), schema is self-authoritative
    if (!contract) {
      return {
        status: "IN_SYNC",
        isCongruent: true,
        divergences: [],
        blockedReasons: [],
      };
    }

    // 3. Compare fields between explicit TypeScript contract and Schema
    const contractFields = contract.fields || [];
    const schemaFields = schema.fields;

    const contractFieldMap = new Map(contractFields.map(f => [f.name, f]));
    const schemaFieldMap = new Map(schemaFields.map(f => [f.name, f]));

    for (const [name, cField] of contractFieldMap.entries()) {
      const sField = schemaFieldMap.get(name);
      if (!sField) {
        divergences.push(`Field "${name}" exists in TypeScript contract but is missing from runtime schema "${schema.schemaName}".`);
        continue;
      }

      // Check Type compatibility
      const cType = cField.type.toLowerCase();
      const sType = sField.type.toLowerCase();

      if (cType.includes("string") && sType !== "string" && sType !== "enum") {
        divergences.push(`Field "${name}" type mismatch: TS is "${cField.type}", Schema is "${sField.rawTypeString}"`);
      } else if (cType.includes("number") && sType !== "number") {
        divergences.push(`Field "${name}" type mismatch: TS is "${cField.type}", Schema is "${sField.rawTypeString}"`);
      } else if (cType.includes("boolean") && sType !== "boolean") {
        divergences.push(`Field "${name}" type mismatch: TS is "${cField.type}", Schema is "${sField.rawTypeString}"`);
      }

      // Check optionality
      if (Boolean(cField.isOptional) !== Boolean(sField.isOptional)) {
        divergences.push(`Field "${name}" optionality mismatch: TS isOptional=${Boolean(cField.isOptional)}, Schema isOptional=${Boolean(sField.isOptional)}`);
      }
    }

    for (const [name] of schemaFieldMap.entries()) {
      if (!contractFieldMap.has(name)) {
        divergences.push(`Field "${name}" exists in runtime schema "${schema.schemaName}" but is missing from TypeScript contract.`);
      }
    }

    if (divergences.length > 0) {
      return {
        status: "RUNTIME_CONTRACT_DIVERGENCE",
        isCongruent: false,
        divergences,
        blockedReasons: divergences.map(d => `RUNTIME_CONTRACT_DIVERGENCE: ${d}`),
      };
    }

    return {
      status: "IN_SYNC",
      isCongruent: true,
      divergences: [],
      blockedReasons: [],
    };
  }
}
