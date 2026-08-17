/**
 * DynamicDataModelContract
 *
 * Derives the Prisma schema and model structure from the current DomainContract.
 *
 * This REPLACES the hardcoded Resume/Security domain branching in CanonicalDataModelContract.
 *
 * Rules:
 * - Models are derived from domainContract.entities — NOT hardcoded.
 * - The schema is generic and adapts to any domain.
 * - Caller passes in the DomainContract (which itself comes from ArchitectureContractV1).
 */

import type { DomainContract, DomainEntity } from "./domain-contract.js";

export interface DataField {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  validation?: string;
  sensitive?: boolean;
}

export interface DataModel {
  name: string;
  purpose: string;
  fields: DataField[];
  relations: string[];
  indexes: string[];
  constraints: string[];
  featureOwnership: string[];
}

export interface DerivedDataContract {
  /** The models derived from the domain contract */
  models: DataModel[];
  /** Full Prisma schema string for use in code generation */
  prismaSchema: string;
  /** Model names list (for validators) */
  modelNames: string[];
  /** Hash inputs (for ContractHashEngine) */
  hashInput: Array<{ name: string; fields: string[] }>;
}

export class DynamicDataModelContract {
  /**
   * Derive a complete data contract from a DomainContract.
   * This is the only entry point — never branch on domain name directly.
   */
  public static derive(domain: DomainContract, databaseProvider = "postgresql"): DerivedDataContract {
    const models = domain.entities.map(entity =>
      DynamicDataModelContract.entityToModel(entity, domain)
    );

    const prismaSchema = DynamicDataModelContract.buildPrismaSchema(models, databaseProvider);
    const modelNames = models.map(m => m.name);
    const hashInput = models.map(m => ({ name: m.name, fields: m.fields.map(f => f.name) }));

    return { models, prismaSchema, modelNames, hashInput };
  }

  // ── Entity → DataModel ────────────────────────────────────────────────────

  private static entityToModel(entity: DomainEntity, domain: DomainContract): DataModel {
    const fields = DynamicDataModelContract.buildFields(entity, domain);
    const relations = DynamicDataModelContract.buildRelations(entity, domain);

    return {
      name: entity.name,
      purpose: entity.purpose,
      fields,
      relations,
      indexes: ["id"],
      constraints: [],
      featureOwnership: domain.features
        .filter(f => f.entities.includes(entity.name))
        .map(f => f.featureId),
    };
  }

  private static buildFields(entity: DomainEntity, domain: DomainContract): DataField[] {
    const fields: DataField[] = [];

    // Always: id, createdAt, updatedAt
    fields.push(
      { name: "id", type: "String", nullable: false, default: "uuid()", validation: "@id @default(uuid())" },
      { name: "createdAt", type: "DateTime", nullable: false, default: "now()", validation: "@default(now())" },
      { name: "updatedAt", type: "DateTime", nullable: false, validation: "@updatedAt" },
    );

    // User entity: add auth fields
    if (entity.name === "User" || entity.kind === "infrastructure") {
      fields.push(
        { name: "email", type: "String", nullable: false, validation: "@unique", sensitive: true },
        { name: "passwordHash", type: "String", nullable: false, sensitive: true },
      );
      return fields;
    }

    // Domain entities: add userId FK + domain-specific text fields
    fields.push(
      { name: "userId", type: "String", nullable: false },
    );

    // Add name/title field (most entities have a primary label)
    const entityNameLower = entity.name.toLowerCase();
    if (!["analysisresult", "keywordmatch", "matchanalysis"].includes(entityNameLower)) {
      fields.push({ name: "name", type: "String", nullable: false });
    }

    // Add text/content field for entities that store document-like data
    const textEntitySignals = ["text", "content", "description", "body", "note", "log", "data"];
    const entityWords = entity.name.replace(/([A-Z])/g, " $1").trim().toLowerCase().split(/\s+/);
    const hasTextSignal = entityWords.some(w => textEntitySignals.some(s => w.includes(s)));
    if (hasTextSignal || entity.purpose.toLowerCase().includes("text") || entity.purpose.toLowerCase().includes("content")) {
      fields.push({ name: "content", type: "String", nullable: true, validation: "@db.Text" });
    }

    // Status field for entities that go through workflow states
    const statusSignals = ["scan", "analysis", "result", "report", "job", "task", "order", "payment"];
    const hasStatusSignal = entityWords.some(w => statusSignals.some(s => w.includes(s)));
    if (hasStatusSignal) {
      fields.push({ name: "status", type: "String", nullable: false, default: '"PENDING"' });
    }

    // Score/rating field for analysis/result entities
    const scoreSignals = ["result", "analysis", "score", "match", "rating", "metric"];
    const hasScoreSignal = entityWords.some(w => scoreSignals.some(s => w.includes(s)));
    if (hasScoreSignal) {
      fields.push({ name: "score", type: "Float", nullable: false, default: "0.0" });
    }

    return fields;
  }

  private static buildRelations(entity: DomainEntity, domain: DomainContract): string[] {
    if (entity.name === "User") {
      // User owns all domain entities
      return domain.entities
        .filter(e => e.name !== "User" && e.kind === "domain")
        .map(e => `${e.name.toLowerCase()}s ${e.name}[]`);
    }

    // All non-User domain entities belong to User
    return ["user User @relation(fields: [userId], references: [id], onDelete: Cascade)"];
  }

  // ── Prisma Schema Builder ─────────────────────────────────────────────────

  private static buildPrismaSchema(models: DataModel[], databaseProvider: string): string {
    const provider = databaseProvider.toLowerCase().includes("sqlite") ? "sqlite"
      : databaseProvider.toLowerCase().includes("mysql") ? "mysql"
      : databaseProvider.toLowerCase().includes("mongo") ? "mongodb"
      : "postgresql";

    const urlEnv = provider === "sqlite" ? `env("DATABASE_URL")` : `env("DATABASE_URL")`;

    let schema = `// ============================================================
// CANONICAL DATA MODEL — Auto-derived by DynamicDataModelContract
// Generated from domain contract — DO NOT hardcode domain models.
// ============================================================
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = ${urlEnv}
}

`;

    for (const model of models) {
      schema += `model ${model.name} {\n`;

      for (const field of model.fields) {
        const attrs = field.validation || "";
        const nullable = field.nullable ? "?" : "";
        schema += `  ${field.name.padEnd(20)} ${field.type}${nullable}`;
        if (attrs) schema += `  ${attrs}`;
        schema += "\n";
      }

      // Relations
      for (const rel of model.relations) {
        schema += `  ${rel}\n`;
      }

      schema += "}\n\n";
    }

    return schema.trimEnd() + "\n";
  }

  // ── Validation ────────────────────────────────────────────────────────────

  /**
   * Validate that a Prisma schema string contains all required model definitions.
   * Uses models from DomainContract — not hardcoded names.
   */
  public static validateSchema(
    schemaContent: string,
    domain: DomainContract,
  ): { valid: boolean; missingModels: string[]; unexpectedModels: string[] } {
    const required = new Set(domain.entities.map(e => e.name));
    const missingModels: string[] = [];
    const unexpectedModels: string[] = [];

    for (const modelName of required) {
      const pattern = new RegExp(`model\\s+${modelName}\\s*\\{`, "m");
      if (!pattern.test(schemaContent)) {
        missingModels.push(modelName);
      }
    }

    // Check for models that don't belong to this domain
    const presentModels = [...schemaContent.matchAll(/^model\s+(\w+)\s*\{/gm)].map(m => m[1]);
    for (const present of presentModels) {
      if (!required.has(present)) {
        unexpectedModels.push(present);
      }
    }

    return {
      valid: missingModels.length === 0,
      missingModels,
      unexpectedModels,
    };
  }
}
