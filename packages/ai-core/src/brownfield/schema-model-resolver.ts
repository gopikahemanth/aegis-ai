/**
 * SchemaModelResolver
 *
 * Parses Prisma schema files (e.g. schema.prisma) into structured models, fields,
 * attributes, relations, and enums.
 * Validates additive changes and safely halts on destructive column drops or data-loss migrations.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface PrismaFieldDefinition {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  hasDefault: boolean;
  defaultValue?: string;
  attributes: string[];
  isRelation: boolean;
  relationModel?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
  line: number;
}

export interface PrismaModelDefinition {
  name: string;
  filePath: string;
  fields: PrismaFieldDefinition[];
  attributes: string[];
  line: number;
}

export interface PrismaEnumDefinition {
  name: string;
  filePath: string;
  values: string[];
  line: number;
}

export interface SchemaUsageEdge {
  fromFile: string;
  fromEntity: string;
  toFile: string;
  fieldName?: string;
  edgeType: "MODELS_ENTITY" | "PERSISTS_FIELD";
  line: number;
}

export interface UnsafeSchemaPattern {
  filePath: string;
  modelName?: string;
  fieldName?: string;
  reason: string;
}

export class SchemaModelResolver {
  private readonly projectRoot: string;
  private readonly models: PrismaModelDefinition[] = [];
  private readonly enums: PrismaEnumDefinition[] = [];
  private readonly edges: SchemaUsageEdge[] = [];
  private readonly unsafePatterns: UnsafeSchemaPattern[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Scans and parses all .prisma schema files in the project.
   */
  public analyzeProject(): {
    models: PrismaModelDefinition[];
    enums: PrismaEnumDefinition[];
    edges: SchemaUsageEdge[];
    unsafePatterns: UnsafeSchemaPattern[];
  } {
    this.models.length = 0;
    this.enums.length = 0;
    this.edges.length = 0;
    this.unsafePatterns.length = 0;

    const schemaPaths = [
      "prisma/schema.prisma",
      "schema.prisma",
      "server/prisma/schema.prisma",
      "packages/database/prisma/schema.prisma",
    ];

    for (const relPath of schemaPaths) {
      const fullPath = resolve(this.projectRoot, relPath);
      if (existsSync(fullPath)) {
        this.parsePrismaFile(relPath, readFileSync(fullPath, "utf8"));
      }
    }

    this.linkSchemaEdges();

    return {
      models: this.models,
      enums: this.enums,
      edges: this.edges,
      unsafePatterns: this.unsafePatterns,
    };
  }

  /**
   * Finds all schema definitions related to a specific model or field.
   */
  public findModelTrace(
    modelName: string,
    fieldName?: string
  ): {
    model?: PrismaModelDefinition;
    field?: PrismaFieldDefinition;
    isDestructive: boolean;
    unsafeReasons: string[];
  } {
    const model = this.models.find(m => m.name.toLowerCase() === modelName.toLowerCase() || m.name === modelName);
    const field = fieldName && model ? model.fields.find(f => f.name === fieldName) : undefined;

    const unsafeReasons: string[] = [];
    let isDestructive = false;

    for (const u of this.unsafePatterns) {
      if (!u.modelName || u.modelName.toLowerCase() === modelName.toLowerCase()) {
        unsafeReasons.push(u.reason);
        if (u.reason.includes("DESTRUCTIVE")) {
          isDestructive = true;
        }
      }
    }

    return {
      model,
      field,
      isDestructive,
      unsafeReasons,
    };
  }

  /**
   * Validates requested schema changes against safety invariants.
   */
  public validateSchemaChange(
    modelName: string,
    changeType: "ADD_FIELD" | "RENAME_FIELD" | "DROP_FIELD" | "MODIFY_TYPE",
    fieldDef?: { name: string; type: string; isOptional?: boolean; defaultValue?: string }
  ): { safe: boolean; reason?: string } {
    if (changeType === "DROP_FIELD") {
      return {
        safe: false,
        reason: `DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED: Dropping field "${fieldDef?.name}" from model "${modelName}" is destructive and requires an explicit migration procedure.`,
      };
    }

    if (changeType === "ADD_FIELD" && fieldDef) {
      if (!fieldDef.isOptional && !fieldDef.defaultValue) {
        return {
          safe: false,
          reason: `DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED: Adding non-nullable field "${fieldDef.name}" without default value to existing model "${modelName}" may cause data integrity failures on existing rows.`,
        };
      }
    }

    return { safe: true };
  }

  public getModels(): PrismaModelDefinition[] {
    return this.models;
  }

  public getEnums(): PrismaEnumDefinition[] {
    return this.enums;
  }

  public getEdges(): SchemaUsageEdge[] {
    return this.edges;
  }

  public getUnsafePatterns(): UnsafeSchemaPattern[] {
    return this.unsafePatterns;
  }

  private parsePrismaFile(filePath: string, content: string) {
    const lines = content.split("\n");
    let currentModel: PrismaModelDefinition | null = null;
    let currentEnum: PrismaEnumDefinition | null = null;

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();
      const lineNum = i + 1;

      // Skip comments or blank lines
      if (!trimmed || trimmed.startsWith("//")) {
        continue;
      }

      // Check model start: model Task {
      const modelMatch = trimmed.match(/^model\s+([A-Za-z0-9_]+)\s*\{/);
      if (modelMatch) {
        currentModel = {
          name: modelMatch[1],
          filePath,
          fields: [],
          attributes: [],
          line: lineNum,
        };
        this.models.push(currentModel);
        continue;
      }

      // Check enum start: enum TaskStatus {
      const enumMatch = trimmed.match(/^enum\s+([A-Za-z0-9_]+)\s*\{/);
      if (enumMatch) {
        currentEnum = {
          name: enumMatch[1],
          filePath,
          values: [],
          line: lineNum,
        };
        this.enums.push(currentEnum);
        continue;
      }

      // Block end
      if (trimmed === "}") {
        currentModel = null;
        currentEnum = null;
        continue;
      }

      // Parse enum values
      if (currentEnum) {
        const val = trimmed.split(/\s+/)[0];
        if (val && !val.startsWith("@@")) {
          currentEnum.values.push(val);
        }
        continue;
      }

      // Parse model fields & model-level attributes
      if (currentModel) {
        if (trimmed.startsWith("@@")) {
          currentModel.attributes.push(trimmed);
          continue;
        }

        const fieldTokens = trimmed.split(/\s+/);
        if (fieldTokens.length >= 2) {
          const fieldName = fieldTokens[0];
          let fieldType = fieldTokens[1];
          const isOptional = fieldType.endsWith("?");
          const isArray = fieldType.endsWith("[]");
          const cleanType = fieldType.replace(/\?|\[\]/g, "");

          const attributes: string[] = fieldTokens.slice(2);
          let hasDefault = false;
          let defaultValue: string | undefined;
          const defMatch = trimmed.match(/@default\(([^)]+)\)/);
          if (defMatch) {
            hasDefault = true;
            defaultValue = defMatch[1].replace(/^["']|["']$/g, "");
          }

          // Relation detection: e.g. @relation(fields: [userId], references: [id])
          let isRelation = false;
          let relationModel: string | undefined;
          let relationFromFields: string[] | undefined;
          let relationToFields: string[] | undefined;

          // If type is not standard primitive
          const primitives = new Set(["String", "Int", "Float", "Boolean", "DateTime", "Json", "BigInt", "Decimal", "Bytes"]);
          if (!primitives.has(cleanType)) {
            isRelation = true;
            relationModel = cleanType;

            const relMatch = trimmed.match(/@relation\(([^)]+)\)/);
            if (relMatch) {
              const relContent = relMatch[1];
              const fieldsMatch = relContent.match(/fields:\s*\[([^\]]+)\]/);
              if (fieldsMatch) {
                relationFromFields = fieldsMatch[1].split(",").map(s => s.trim());
              }
              const refMatch = relContent.match(/references:\s*\[([^\]]+)\]/);
              if (refMatch) {
                relationToFields = refMatch[1].split(",").map(s => s.trim());
              }
            }
          }

          currentModel.fields.push({
            name: fieldName,
            type: cleanType,
            isOptional,
            isArray,
            hasDefault,
            defaultValue,
            attributes,
            isRelation,
            relationModel,
            relationFromFields,
            relationToFields,
            line: lineNum,
          });
        }
      }
    }
  }

  private linkSchemaEdges() {
    for (const model of this.models) {
      this.edges.push({
        fromFile: model.filePath,
        fromEntity: model.name,
        toFile: model.filePath,
        edgeType: "MODELS_ENTITY",
        line: model.line,
      });

      for (const field of model.fields) {
        this.edges.push({
          fromFile: model.filePath,
          fromEntity: model.name,
          toFile: model.filePath,
          fieldName: field.name,
          edgeType: "PERSISTS_FIELD",
          line: field.line,
        });
      }
    }
  }
}
