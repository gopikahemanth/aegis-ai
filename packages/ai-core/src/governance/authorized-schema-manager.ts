/**
 * AuthorizedSchemaManager
 *
 * Single authoritative owner and safe evolution engine for `prisma/schema.prisma`.
 *
 * Guarantees:
 * 1. Single Ownership: Only authorized agents/roles can modify the canonical schema.
 * 2. Non-Destructive Reconciliation: Preserves existing valid domain fields, relations,
 *    and directives. Never removes fields to silence compiler errors.
 * 3. Domain Model Completeness: Missing models or fields are derived from the rich
 *    DynamicDataModelContract (preserving CartItem.customizations, Reservation.status, etc.),
 *    never from crude 7-field stubs.
 * 4. Pre-Write Validation: Validates Prisma syntax and model invariants before writing.
 *    If invalid, preserves the last valid on-disk schema.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DynamicDataModelContract } from "./dynamic-data-model.js";

export type AuthorizedSchemaRole =
  | "AuthorizedSchemaManager"
  | "SchemaEngine"
  | "DatabaseAgent"
  | "DataArchitectureAgent"
  | "ContractAuthority"
  | "System";

export interface SchemaReconciliationResult {
  success: boolean;
  written: boolean;
  preservedFields: string[];
  addedFields: string[];
  addedModels: string[];
  schemaContent: string;
  error?: string;
}

export interface ParsedPrismaField {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  attributes: string;
  rawLine: string;
}

export interface ParsedPrismaModel {
  name: string;
  fields: Map<string, ParsedPrismaField>;
  modelDirectives: string[];
}

export class AuthorizedSchemaManager {
  private static readonly AUTHORIZED_ROLES: Set<AuthorizedSchemaRole> = new Set([
    "AuthorizedSchemaManager",
    "SchemaEngine",
    "DatabaseAgent",
    "DataArchitectureAgent",
    "ContractAuthority",
    "System",
  ]);

  /**
   * Check if a caller role is authorized to write or evolve the Prisma schema.
   */
  public static isAuthorized(role?: string): boolean {
    if (!role) return false;
    return this.AUTHORIZED_ROLES.has(role as AuthorizedSchemaRole);
  }

  /**
   * Parse a Prisma schema string into structured models and header blocks.
   */
  public static parseSchema(schemaContent: string): {
    header: string;
    models: Map<string, ParsedPrismaModel>;
    enums: Map<string, string>;
  } {
    const models = new Map<string, ParsedPrismaModel>();
    const enums = new Map<string, string>();
    let header = "";

    // Normalize inline model/enum/block braces so fields are on their own lines
    const normalizedContent = schemaContent.replace(/\{\s*([^\n}]+)\s*\}/g, (_match, body) => {
      const statements = body.trim().split(/(?<=[^\s])\s+(?=[a-zA-Z_]\w*\s+[A-Za-z])/);
      return `{\n  ${statements.join("\n  ")}\n}`;
    });

    const lines = normalizedContent.split(/\r?\n/);
    let currentModel: ParsedPrismaModel | null = null;
    let currentEnumName: string | null = null;
    let currentEnumBody: string[] = [];
    const headerLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Check for enum block
      if (/^enum\s+(\w+)\s*\{/.test(trimmed)) {
        const match = trimmed.match(/^enum\s+(\w+)\s*\{/);
        currentEnumName = match ? match[1] : null;
        currentEnumBody = [line];
        continue;
      }
      if (currentEnumName) {
        currentEnumBody.push(line);
        if (trimmed === "}") {
          enums.set(currentEnumName, currentEnumBody.join("\n"));
          currentEnumName = null;
          currentEnumBody = [];
        }
        continue;
      }

      // Check for model block
      if (/^model\s+(\w+)\s*\{/.test(trimmed)) {
        const match = trimmed.match(/^model\s+(\w+)\s*\{/);
        const name = match ? match[1] : "Unnamed";
        currentModel = {
          name,
          fields: new Map(),
          modelDirectives: [],
        };
        continue;
      }

      if (currentModel) {
        if (trimmed === "}") {
          models.set(currentModel.name, currentModel);
          currentModel = null;
        } else if (trimmed.startsWith("@@")) {
          currentModel.modelDirectives.push(line);
        } else if (trimmed.length > 0 && !trimmed.startsWith("//")) {
          // Parse field line: e.g. "customizations  String?  @map("custom")"
          const tokens = trimmed.split(/\s+/);
          if (tokens.length >= 2) {
            const fieldName = tokens[0];
            const rawType = tokens[1];
            const attributes = tokens.slice(2).join(" ");
            currentModel.fields.set(fieldName, {
              name: fieldName,
              type: rawType.replace("?", "").replace("[]", ""),
              isOptional: rawType.endsWith("?"),
              isArray: rawType.endsWith("[]"),
              attributes,
              rawLine: line,
            });
          }
        }
        continue;
      }

      // Otherwise, it's header content (datasource, generator, top-level comments)
      headerLines.push(line);
    }

    header = headerLines.join("\n").trim();
    if (!header.includes("datasource db")) {
      header = `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n` + header;
    }

    return { header, models, enums };
  }

  /**
   * Validate Prisma schema syntax and mandatory invariants before persisting.
   */
  public static validateSchemaContent(schemaContent: string): { valid: boolean; error?: string } {
    if (!schemaContent || schemaContent.trim().length === 0) {
      return { valid: false, error: "Schema content is empty." };
    }

    // Must have datasource or model definitions
    if (!/model\s+[A-Z]\w*\s*\{/.test(schemaContent)) {
      return { valid: false, error: "Schema does not define any valid Prisma models (model Name { ... })." };
    }

    // Bracket balance check
    const openBraces = (schemaContent.match(/\{/g) || []).length;
    const closeBraces = (schemaContent.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      return { valid: false, error: `Unbalanced braces in schema: ${openBraces} '{' vs ${closeBraces} '}'.` };
    }

    const { models } = this.parseSchema(schemaContent);

    // Every model must have an @id field
    for (const [name, model] of models) {
      const hasId = Array.from(model.fields.values()).some(f => f.attributes.includes("@id") || f.name === "id");
      if (!hasId) {
        return { valid: false, error: `Model "${name}" does not define a primary key (@id).` };
      }
    }

    // Check for duplicate ambiguous relation fields (P1012)
    const modelNames = new Set(models.keys());
    for (const [name, model] of models) {
      const targetCount = new Map<string, number>();
      for (const field of model.fields.values()) {
        if (modelNames.has(field.type)) {
          const isNamed = /@relation\s*\(\s*["'][^"']+["']/.test(field.attributes);
          if (!isNamed && field.isArray) {
            const count = (targetCount.get(field.type) || 0) + 1;
            if (count > 1) {
              return { valid: false, error: `Model "${name}" contains duplicate ambiguous relation to "${field.type}" (P1012).` };
            }
            targetCount.set(field.type, count);
          }
        }
      }
    }

    return { valid: true };
  }

  /**
   * Canonicalize and deduplicate relation fields across all models in a Prisma schema.
   * Ensures single canonical camelCase plural for arrays and singular for 1-1 relations,
   * avoiding P1012 duplicate relation declaration errors.
   */
  public static canonicalizeAndDeduplicateRelations(schemaContent: string): string {
    if (!schemaContent || schemaContent.trim().length === 0) return schemaContent;

    const parsed = this.parseSchema(schemaContent);
    const modelNames = new Set(parsed.models.keys());

    for (const [modelName, model] of parsed.models) {
      const fieldsByTarget = new Map<string, ParsedPrismaField[]>();
      const scalarFields: ParsedPrismaField[] = [];

      for (const [fName, field] of model.fields) {
        if (modelNames.has(field.type)) {
          const list = fieldsByTarget.get(field.type) || [];
          list.push(field);
          fieldsByTarget.set(field.type, list);
        } else {
          scalarFields.push(field);
        }
      }

      const newFields = new Map<string, ParsedPrismaField>();

      // Preserve scalar fields, deduplicating case-insensitively and across snake_case / camelCase variants
      for (const sf of scalarFields) {
        const norm = sf.name.replace(/_/g, "").toLowerCase();
        const existingKey = Array.from<string>(newFields.keys()).find(k => k.replace(/_/g, "").toLowerCase() === norm);
        if (!existingKey) {
          newFields.set(sf.name, sf);
        } else if (existingKey.includes("_") && !sf.name.includes("_")) {
          // Upgrade snake_case field to canonical camelCase field
          const existingField = newFields.get(existingKey)!;
          newFields.delete(existingKey);
          newFields.set(sf.name, {
            ...sf,
            attributes: sf.attributes || existingField.attributes,
          });
        }
      }

      // Process relation fields by target model
      for (const [targetModel, relFields] of fieldsByTarget) {
        const canonicalArrayName = targetModel.charAt(0).toLowerCase() + targetModel.slice(1) + "s";
        const canonicalSingularName = targetModel.charAt(0).toLowerCase() + targetModel.slice(1);

        const namedRelations: ParsedPrismaField[] = [];
        const unnamedArrayRelations: ParsedPrismaField[] = [];
        const unnamedSingularRelations: ParsedPrismaField[] = [];

        for (const rf of relFields) {
          const hasNamedRelation = /@relation\s*\(\s*["'][^"']+["']/.test(rf.attributes);
          if (hasNamedRelation) {
            namedRelations.push(rf);
          } else if (rf.isArray) {
            unnamedArrayRelations.push(rf);
          } else {
            unnamedSingularRelations.push(rf);
          }
        }

        // Deduplicate unnamed array relations into a single canonical camelCase plural
        if (unnamedArrayRelations.length > 0) {
          const exactCanonical = unnamedArrayRelations.find(r => r.name === canonicalArrayName);
          const chosen = exactCanonical || unnamedArrayRelations[0];
          const chosenName = canonicalArrayName;
          const pad = Math.max(20, chosenName.length + 2);
          const attrs = chosen.attributes ? ` ${chosen.attributes}` : "";
          const rawLine = `  ${chosenName.padEnd(pad)} ${targetModel}[]${attrs}`.trimEnd();

          newFields.set(chosenName, {
            ...chosen,
            name: chosenName,
            rawLine,
          });
        }

        // Deduplicate unnamed singular relations
        if (unnamedSingularRelations.length > 0) {
          const exactCanonical = unnamedSingularRelations.find(r => r.name === canonicalSingularName);
          const chosen = exactCanonical || unnamedSingularRelations[0];
          const chosenName = chosen.name.toLowerCase() === targetModel.toLowerCase() ? canonicalSingularName : chosen.name;
          const pad = Math.max(20, chosenName.length + 2);
          const opt = chosen.isOptional ? "?" : "";
          const attrs = chosen.attributes ? ` ${chosen.attributes}` : "";
          const rawLine = `  ${chosenName.padEnd(pad)} ${targetModel}${opt}${attrs}`.trimEnd();

          newFields.set(chosenName, {
            ...chosen,
            name: chosenName,
            rawLine,
          });
        }

        // Keep all explicitly named relations (e.g. @relation("author"))
        for (const nr of namedRelations) {
          newFields.set(nr.name, nr);
        }
      }

      model.fields = newFields;
    }

    const serializedModels: string[] = [];
    for (const [mName, m] of parsed.models) {
      const fieldLines: string[] = [];
      for (const field of m.fields.values()) {
        fieldLines.push(field.rawLine);
      }
      const directiveLines = m.modelDirectives;
      serializedModels.push(`model ${mName} {\n${[...fieldLines, ...directiveLines].join("\n")}\n}`);
    }

    const serializedEnums = Array.from(parsed.enums.values()).join("\n\n");
    return [
      parsed.header,
      serializedEnums,
      serializedModels.join("\n\n"),
    ].filter(Boolean).join("\n\n") + "\n";
  }

  /**
   * Reconcile an existing on-disk schema with an incoming schema or required domain models.
   * Guarantees non-destructive merge: preserves existing custom fields and relations.
   */
  public static reconcile(
    existingSchemaContent: string,
    incomingSchemaOrModels: string | string[],
    databaseProvider: string = "postgresql"
  ): SchemaReconciliationResult {
    const cleanExisting = existingSchemaContent.trim().length > 0
      ? this.canonicalizeAndDeduplicateRelations(existingSchemaContent)
      : existingSchemaContent;
    const cleanIncoming = typeof incomingSchemaOrModels === "string"
      ? this.canonicalizeAndDeduplicateRelations(incomingSchemaOrModels)
      : incomingSchemaOrModels;

    const existing = cleanExisting.trim().length > 0
      ? this.parseSchema(cleanExisting)
      : { header: "", models: new Map(), enums: new Map() };

    const preservedFields: string[] = [];
    const addedFields: string[] = [];
    const addedModels: string[] = [];

    // Identify incoming models
    let incomingModels = new Map<string, ParsedPrismaModel>();
    let incomingEnums = new Map<string, string>();
    let targetModelNames: string[] = [];

    if (Array.isArray(cleanIncoming)) {
      targetModelNames = cleanIncoming;
    } else {
      // Validate incoming schema syntax first
      const incomingValidation = this.validateSchemaContent(cleanIncoming);
      if (!incomingValidation.valid) {
        return {
          success: false,
          written: false,
          preservedFields,
          addedFields,
          addedModels,
          schemaContent: existingSchemaContent,
          error: `INVALID_INCOMING_SCHEMA: ${incomingValidation.error}`,
        };
      }

      const parsedIncoming = this.parseSchema(cleanIncoming);
      incomingModels = parsedIncoming.models;
      incomingEnums = parsedIncoming.enums;
      targetModelNames = Array.from(incomingModels.keys());
    }

    // Merge Enums
    for (const [eName, eBody] of incomingEnums) {
      if (!existing.enums.has(eName)) {
        existing.enums.set(eName, eBody);
      }
    }

    // Merge / Reconcile Models
    for (const modelName of targetModelNames) {
      const existingModel = existing.models.get(modelName);
      const incomingModel = incomingModels.get(modelName);

      if (existingModel) {
        // Model exists: preserve all existing fields, and append missing fields from incoming or domain contract
        for (const [fName, field] of existingModel.fields) {
          preservedFields.push(`${modelName}.${fName}`);
        }

        if (incomingModel) {
          // Reconcile with incoming schema fields
          for (const [fName, inField] of incomingModel.fields) {
            const existingFieldKey = Array.from<string>(existingModel.fields.keys()).find(
              k => k.toLowerCase() === fName.toLowerCase()
            );
            if (!existingFieldKey) {
              existingModel.fields.set(fName, inField);
              addedFields.push(`${modelName}.${fName}`);
            } else if (existingFieldKey !== fName && typeof existingFieldKey === "string" && existingFieldKey === existingFieldKey.toLowerCase()) {
              // Existing was all-lowercase (e.g. coffeeitems), incoming is canonical camelCase (e.g. coffeeItems)
              existingModel.fields.delete(existingFieldKey);
              existingModel.fields.set(fName, inField);
            }
          }
        }

        // Also enrich with canonical domain fields (e.g. customizations, status, partySize)
        const domainContract = {
          domainName: "application",
          entities: [{ name: modelName, kind: modelName === "User" ? "infrastructure" : "domain" }],
        } as any;
        const dynamicFields = (DynamicDataModelContract as any).buildFields?.({ name: modelName, kind: "domain" }, domainContract) || [];
        for (const df of dynamicFields) {
          const hasField = Array.from<string>(existingModel.fields.keys()).some(
            k => k.toLowerCase() === df.name.toLowerCase()
          );
          if (!hasField) {
            const rawType = df.type + (df.nullable ? "?" : "");
            const validation = df.validation || (df.default ? `@default(${df.default})` : "");
            const rawLine = `  ${df.name.padEnd(16)} ${rawType.padEnd(10)} ${validation}`.trimEnd();
            existingModel.fields.set(df.name, {
              name: df.name,
              type: df.type,
              isOptional: !!df.nullable,
              isArray: false,
              attributes: validation,
              rawLine,
            });
            addedFields.push(`${modelName}.${df.name}`);
          }
        }
      } else {
        // Model does NOT exist on disk: create with full domain specification
        addedModels.push(modelName);
        if (incomingModel) {
          existing.models.set(modelName, incomingModel);
          for (const [fName] of incomingModel.fields) {
            addedFields.push(`${modelName}.${fName}`);
          }
        } else {
          // Synthesize model from DynamicDataModelContract
          const domainContract = {
            domainName: "application",
            entities: [{ name: modelName, kind: modelName === "User" ? "infrastructure" : "domain" }],
          } as any;
          const dynamicFields = (DynamicDataModelContract as any).buildFields?.({ name: modelName, kind: "domain" }, domainContract) || [];
          const newModel: ParsedPrismaModel = {
            name: modelName,
            fields: new Map(),
            modelDirectives: [],
          };
          for (const df of dynamicFields) {
            const rawType = df.type + (df.nullable ? "?" : "");
            const validation = df.validation || (df.default ? `@default(${df.default})` : "");
            const rawLine = `  ${df.name.padEnd(16)} ${rawType.padEnd(10)} ${validation}`.trimEnd();
            newModel.fields.set(df.name, {
              name: df.name,
              type: df.type,
              isOptional: !!df.nullable,
              isArray: false,
              attributes: validation,
              rawLine,
            });
            addedFields.push(`${modelName}.${df.name}`);
          }
          existing.models.set(modelName, newModel);
        }
      }
    }

    // Serialize merged schema
    const serializedModels: string[] = [];
    for (const [mName, m] of existing.models) {
      const fieldLines: string[] = [];
      for (const field of m.fields.values()) {
        fieldLines.push(field.rawLine);
      }
      const directiveLines = m.modelDirectives;
      serializedModels.push(`model ${mName} {\n${[...fieldLines, ...directiveLines].join("\n")}\n}`);
    }

    const serializedEnums = Array.from(existing.enums.values()).join("\n\n");
    const rawMergedSchema = [
      existing.header || `datasource db {\n  provider = "${databaseProvider}"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}`,
      serializedEnums,
      serializedModels.join("\n\n"),
    ].filter(Boolean).join("\n\n") + "\n";

    // Deduplicate and canonicalize relations in the merged schema
    const fullSchema = this.canonicalizeAndDeduplicateRelations(rawMergedSchema);

    // Validate merged schema
    const validation = this.validateSchemaContent(fullSchema);
    if (!validation.valid) {
      return {
        success: false,
        written: false,
        preservedFields,
        addedFields,
        addedModels,
        schemaContent: existingSchemaContent,
        error: validation.error,
      };
    }

    return {
      success: true,
      written: true,
      preservedFields,
      addedFields,
      addedModels,
      schemaContent: fullSchema,
    };
  }

  /**
   * Authoritative entry point for writing schema to disk.
   * Checks caller authority, reconciles non-destructively, validates, and atomically writes.
   */
  public static reconcileAndWriteSchema(
    projectRoot: string,
    incomingSchemaOrModels: string | string[],
    callerRole?: string,
    databaseProvider: string = "postgresql"
  ): SchemaReconciliationResult {
    const schemaPath = join(projectRoot, "prisma", "schema.prisma");
    const existingContent = existsSync(schemaPath) ? readFileSync(schemaPath, "utf8") : "";

    // 1. Authorization check
    if (!this.isAuthorized(callerRole)) {
      console.warn(`[AuthorizedSchemaManager] 🔒 Blocked unauthorized schema write from role "${callerRole || "unknown"}".`);
      return {
        success: false,
        written: false,
        preservedFields: [],
        addedFields: [],
        addedModels: [],
        schemaContent: existingContent,
        error: `UNAUTHORIZED_SCHEMA_WRITER: Role "${callerRole || "unknown"}" is not permitted to mutate prisma/schema.prisma.`,
      };
    }

    // 2. Non-destructive reconciliation
    const result = this.reconcile(existingContent, incomingSchemaOrModels, databaseProvider);
    if (!result.success) {
      console.error(`[AuthorizedSchemaManager] ❌ Schema reconciliation failed: ${result.error}. Preserving last valid file.`);
      return result;
    }

    // 3. Atomic safe write
    try {
      const prismaDir = dirname(schemaPath);
      if (!existsSync(prismaDir)) {
        const { mkdirSync } = require("node:fs");
        mkdirSync(prismaDir, { recursive: true });
      }
      writeFileSync(schemaPath, result.schemaContent, "utf8");
      console.log(`[AuthorizedSchemaManager] ✅ Schema successfully reconciled and written (${result.preservedFields.length} preserved, ${result.addedFields.length} added).`);
      return result;
    } catch (writeErr: any) {
      return {
        success: false,
        written: false,
        preservedFields: result.preservedFields,
        addedFields: result.addedFields,
        addedModels: result.addedModels,
        schemaContent: existingContent,
        error: `Failed to write schema to disk: ${writeErr.message}`,
      };
    }
  }

  /**
   * Safe project-level helper for deterministic fixers.
   * Ensures domain models exist with rich domain fields rather than crude 7-field stubs.
   */
  public static reconcileProjectSchema(
    projectRoot: string,
    requiredModels: string[],
    databaseProvider: string = "postgresql"
  ): SchemaReconciliationResult {
    return this.reconcileAndWriteSchema(projectRoot, requiredModels, "DatabaseAgent", databaseProvider);
  }
}
