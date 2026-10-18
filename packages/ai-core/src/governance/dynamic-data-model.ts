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

    // Domain entities: add userId FK
    fields.push({ name: "userId", type: "String", nullable: false });

    const entityNameLower = entity.name.toLowerCase();

    // ── Canonical Domain Field Registry ──────────────────────────────────────
    // Maps entity archetypes to their full, business-correct Prisma field sets.
    // Prevents PRISMA_SCHEMA_MISMATCH when LLM controllers reference domain
    // fields absent from a too-minimal schema.
    const DOMAIN_FIELD_REGISTRY: Record<string, DataField[]> = {
      // Restaurant / Food ordering
      menuitem: [
        { name: "name", type: "String", nullable: false },
        { name: "description", type: "String", nullable: true, validation: "@db.Text" },
        { name: "price", type: "Float", nullable: false, default: "0.0" },
        { name: "category", type: "String", nullable: true },
        { name: "image", type: "String", nullable: true },
        { name: "dietaryTags", type: "String", nullable: true },
        { name: "allergens", type: "String", nullable: true },
        { name: "isAvailable", type: "Boolean", nullable: false, default: "true", validation: "@default(true)" },
        { name: "preparationTime", type: "Int", nullable: true },
        { name: "isVegetarian", type: "Boolean", nullable: true },
        { name: "isVegan", type: "Boolean", nullable: true },
        { name: "spiceLevel", type: "String", nullable: true },
        { name: "calories", type: "Int", nullable: true },
      ],
      cartitem: [
        { name: "menuItemId", type: "String", nullable: true },
        { name: "productId", type: "String", nullable: true },
        { name: "name", type: "String", nullable: false },
        { name: "quantity", type: "Int", nullable: false, default: "1", validation: "@default(1)" },
        { name: "price", type: "Float", nullable: false, default: "0.0" },
        { name: "customizations", type: "String", nullable: true },
        { name: "sessionId", type: "String", nullable: true },
        { name: "notes", type: "String", nullable: true },
      ],
      orderitem: [
        { name: "menuItemId", type: "String", nullable: true },
        { name: "productId", type: "String", nullable: true },
        { name: "orderId", type: "String", nullable: true },
        { name: "name", type: "String", nullable: false },
        { name: "quantity", type: "Int", nullable: false, default: "1" },
        { name: "price", type: "Float", nullable: false, default: "0.0" },
        { name: "customizations", type: "String", nullable: true },
      ],
      order: [
        { name: "name", type: "String", nullable: true },
        { name: "customerName", type: "String", nullable: true },
        { name: "customerEmail", type: "String", nullable: true },
        { name: "customerPhone", type: "String", nullable: true },
        { name: "status", type: "String", nullable: false, default: '"PENDING"', validation: '@default("PENDING")' },
        { name: "totalAmount", type: "Float", nullable: false, default: "0.0" },
        { name: "orderType", type: "String", nullable: true },
        { name: "deliveryAddress", type: "String", nullable: true },
        { name: "notes", type: "String", nullable: true },
        { name: "paymentMethod", type: "String", nullable: true },
        { name: "paymentStatus", type: "String", nullable: true },
        { name: "deliveryFee", type: "Float", nullable: true },
        { name: "items", type: "String", nullable: true, validation: "@db.Text" },
      ],
      reservation: [
        { name: "name", type: "String", nullable: false },
        { name: "email", type: "String", nullable: true },
        { name: "phone", type: "String", nullable: true },
        { name: "date", type: "String", nullable: true },
        { name: "time", type: "String", nullable: true },
        { name: "partySize", type: "Int", nullable: false, default: "2", validation: "@default(2)" },
        { name: "status", type: "String", nullable: false, default: '"PENDING"', validation: '@default("PENDING")' },
        { name: "zone", type: "String", nullable: true },
        { name: "specialNotes", type: "String", nullable: true },
        { name: "specialRequests", type: "String", nullable: true },
        { name: "tableNumber", type: "String", nullable: true },
      ],
      review: [
        { name: "name", type: "String", nullable: true },
        { name: "author", type: "String", nullable: true },
        { name: "rating", type: "Int", nullable: false, default: "5" },
        { name: "comment", type: "String", nullable: true, validation: "@db.Text" },
        { name: "menuItemId", type: "String", nullable: true },
        { name: "orderId", type: "String", nullable: true },
        { name: "location", type: "String", nullable: true },
        { name: "isVerified", type: "Boolean", nullable: true },
      ],
      contactmessage: [
        { name: "name", type: "String", nullable: false },
        { name: "email", type: "String", nullable: false },
        { name: "subject", type: "String", nullable: true },
        { name: "message", type: "String", nullable: false, validation: "@db.Text" },
        { name: "phone", type: "String", nullable: true },
        { name: "status", type: "String", nullable: true },
        { name: "data", type: "String", nullable: true, validation: "@db.Text" },
      ],
      // E-commerce / Bookstore
      product: [
        { name: "name", type: "String", nullable: false },
        { name: "description", type: "String", nullable: true, validation: "@db.Text" },
        { name: "price", type: "Float", nullable: false, default: "0.0" },
        { name: "category", type: "String", nullable: true },
        { name: "image", type: "String", nullable: true },
        { name: "sku", type: "String", nullable: true },
        { name: "stock", type: "Int", nullable: false, default: "0" },
        { name: "isAvailable", type: "Boolean", nullable: false, default: "true", validation: "@default(true)" },
        { name: "rating", type: "Float", nullable: true },
        { name: "brand", type: "String", nullable: true },
        { name: "tags", type: "String", nullable: true },
      ],
      book: [
        { name: "title", type: "String", nullable: false },
        { name: "author", type: "String", nullable: false },
        { name: "isbn", type: "String", nullable: true },
        { name: "description", type: "String", nullable: true, validation: "@db.Text" },
        { name: "price", type: "Float", nullable: false, default: "0.0" },
        { name: "genre", type: "String", nullable: true },
        { name: "coverImage", type: "String", nullable: true },
        { name: "publishedYear", type: "Int", nullable: true },
        { name: "publisher", type: "String", nullable: true },
        { name: "stock", type: "Int", nullable: false, default: "0" },
        { name: "rating", type: "Float", nullable: true },
        { name: "isAvailable", type: "Boolean", nullable: false, default: "true", validation: "@default(true)" },
      ],
      // Healthcare
      appointment: [
        { name: "name", type: "String", nullable: true },
        { name: "patientName", type: "String", nullable: false },
        { name: "patientEmail", type: "String", nullable: true },
        { name: "patientPhone", type: "String", nullable: true },
        { name: "providerId", type: "String", nullable: true },
        { name: "date", type: "String", nullable: false },
        { name: "time", type: "String", nullable: false },
        { name: "status", type: "String", nullable: false, default: '"SCHEDULED"', validation: '@default("SCHEDULED")' },
        { name: "notes", type: "String", nullable: true },
        { name: "duration", type: "Int", nullable: true },
        { name: "type", type: "String", nullable: true },
      ],
      provider: [
        { name: "name", type: "String", nullable: false },
        { name: "specialty", type: "String", nullable: true },
        { name: "bio", type: "String", nullable: true, validation: "@db.Text" },
        { name: "image", type: "String", nullable: true },
        { name: "acceptingPatients", type: "Boolean", nullable: true },
        { name: "rating", type: "Float", nullable: true },
        { name: "phone", type: "String", nullable: true },
        { name: "email", type: "String", nullable: true },
      ],
      patient: [
        { name: "name", type: "String", nullable: false },
        { name: "email", type: "String", nullable: true },
        { name: "phone", type: "String", nullable: true },
        { name: "dateOfBirth", type: "String", nullable: true },
        { name: "gender", type: "String", nullable: true },
        { name: "bloodGroup", type: "String", nullable: true },
        { name: "address", type: "String", nullable: true },
        { name: "allergies", type: "String", nullable: true },
      ],
      // Real estate
      property: [
        { name: "title", type: "String", nullable: false },
        { name: "description", type: "String", nullable: true, validation: "@db.Text" },
        { name: "price", type: "Float", nullable: false, default: "0.0" },
        { name: "type", type: "String", nullable: true },
        { name: "status", type: "String", nullable: false, default: '"AVAILABLE"', validation: '@default("AVAILABLE")' },
        { name: "address", type: "String", nullable: true },
        { name: "city", type: "String", nullable: true },
        { name: "bedrooms", type: "Int", nullable: true },
        { name: "bathrooms", type: "Int", nullable: true },
        { name: "area", type: "Float", nullable: true },
        { name: "images", type: "String", nullable: true },
        { name: "amenities", type: "String", nullable: true },
        { name: "isFeatured", type: "Boolean", nullable: true },
      ],
      // Education / LMS
      course: [
        { name: "title", type: "String", nullable: false },
        { name: "description", type: "String", nullable: true, validation: "@db.Text" },
        { name: "category", type: "String", nullable: true },
        { name: "level", type: "String", nullable: true },
        { name: "duration", type: "String", nullable: true },
        { name: "price", type: "Float", nullable: true },
        { name: "thumbnail", type: "String", nullable: true },
        { name: "instructor", type: "String", nullable: true },
        { name: "isPublished", type: "Boolean", nullable: false, default: "false", validation: "@default(false)" },
        { name: "enrolledCount", type: "Int", nullable: true },
      ],
      // Equipment maintenance
      asset: [
        { name: "name", type: "String", nullable: false },
        { name: "assetTag", type: "String", nullable: true },
        { name: "description", type: "String", nullable: true },
        { name: "category", type: "String", nullable: true },
        { name: "location", type: "String", nullable: true },
        { name: "status", type: "String", nullable: false, default: '"OPERATIONAL"', validation: '@default("OPERATIONAL")' },
        { name: "manufacturer", type: "String", nullable: true },
        { name: "model", type: "String", nullable: true },
        { name: "serialNumber", type: "String", nullable: true },
        { name: "purchaseDate", type: "String", nullable: true },
        { name: "lastMaintenanceDate", type: "String", nullable: true },
        { name: "nextMaintenanceDate", type: "String", nullable: true },
      ],
      workorder: [
        { name: "name", type: "String", nullable: true },
        { name: "title", type: "String", nullable: false },
        { name: "description", type: "String", nullable: true, validation: "@db.Text" },
        { name: "assetId", type: "String", nullable: true },
        { name: "assignedTo", type: "String", nullable: true },
        { name: "priority", type: "String", nullable: false, default: '"MEDIUM"', validation: '@default("MEDIUM")' },
        { name: "status", type: "String", nullable: false, default: '"OPEN"', validation: '@default("OPEN")' },
        { name: "type", type: "String", nullable: true },
        { name: "scheduledDate", type: "String", nullable: true },
        { name: "completedDate", type: "String", nullable: true },
        { name: "estimatedHours", type: "Float", nullable: true },
        { name: "actualHours", type: "Float", nullable: true },
        { name: "notes", type: "String", nullable: true, validation: "@db.Text" },
      ],
      // Portfolio
      project: [
        { name: "title", type: "String", nullable: false },
        { name: "description", type: "String", nullable: true, validation: "@db.Text" },
        { name: "technologies", type: "String", nullable: true },
        { name: "category", type: "String", nullable: true },
        { name: "githubUrl", type: "String", nullable: true },
        { name: "liveUrl", type: "String", nullable: true },
        { name: "image", type: "String", nullable: true },
        { name: "featured", type: "Boolean", nullable: true },
        { name: "year", type: "Int", nullable: true },
        { name: "status", type: "String", nullable: true },
      ],
      skill: [
        { name: "name", type: "String", nullable: false },
        { name: "category", type: "String", nullable: true },
        { name: "proficiency", type: "Int", nullable: true },
        { name: "icon", type: "String", nullable: true },
        { name: "yearsOfExperience", type: "Float", nullable: true },
      ],
      experience: [
        { name: "title", type: "String", nullable: false },
        { name: "company", type: "String", nullable: false },
        { name: "description", type: "String", nullable: true, validation: "@db.Text" },
        { name: "startDate", type: "String", nullable: false },
        { name: "endDate", type: "String", nullable: true },
        { name: "isCurrent", type: "Boolean", nullable: true },
        { name: "location", type: "String", nullable: true },
        { name: "type", type: "String", nullable: true },
      ],
      // Universal
      category: [
        { name: "name", type: "String", nullable: false },
        { name: "slug", type: "String", nullable: true },
        { name: "description", type: "String", nullable: true },
        { name: "icon", type: "String", nullable: true },
        { name: "color", type: "String", nullable: true },
        { name: "parentId", type: "String", nullable: true },
        { name: "image", type: "String", nullable: true },
      ],
      post: [
        { name: "title", type: "String", nullable: false },
        { name: "content", type: "String", nullable: true, validation: "@db.Text" },
        { name: "excerpt", type: "String", nullable: true },
        { name: "slug", type: "String", nullable: true },
        { name: "category", type: "String", nullable: true },
        { name: "tags", type: "String", nullable: true },
        { name: "image", type: "String", nullable: true },
        { name: "isPublished", type: "Boolean", nullable: false, default: "false", validation: "@default(false)" },
        { name: "publishedAt", type: "DateTime", nullable: true },
        { name: "views", type: "Int", nullable: true },
      ],
      payment: [
        { name: "name", type: "String", nullable: true },
        { name: "orderId", type: "String", nullable: true },
        { name: "amount", type: "Float", nullable: false, default: "0.0" },
        { name: "status", type: "String", nullable: false, default: '"PENDING"', validation: '@default("PENDING")' },
        { name: "method", type: "String", nullable: true },
        { name: "transactionId", type: "String", nullable: true },
        { name: "paidAt", type: "DateTime", nullable: true },
      ],
      notification: [
        { name: "title", type: "String", nullable: false },
        { name: "message", type: "String", nullable: false },
        { name: "type", type: "String", nullable: true },
        { name: "isRead", type: "Boolean", nullable: false, default: "false", validation: "@default(false)" },
        { name: "data", type: "String", nullable: true },
      ],
    };

    // Check registry for exact entity archetype match
    const registryFields = DOMAIN_FIELD_REGISTRY[entityNameLower];
    if (registryFields) {
      fields.push(...registryFields.filter(f => f.name !== "userId"));
      return fields;
    }

    // ── Semantic fallback for unrecognized entities ────────────────────────
    if (!["analysisresult", "keywordmatch", "matchanalysis"].includes(entityNameLower)) {
      fields.push({ name: "name", type: "String", nullable: false });
    }

    const entityWords = entity.name.replace(/([A-Z])/g, " $1").trim().toLowerCase().split(/\s+/);

    const statusSignals = ["scan", "analysis", "result", "report", "job", "task", "order", "payment", "request", "ticket", "workflow"];
    if (entityWords.some(w => statusSignals.some(s => w.includes(s)))) {
      fields.push({ name: "status", type: "String", nullable: false, default: '"PENDING"', validation: '@default("PENDING")' });
    }

    const textEntitySignals = ["text", "content", "description", "body", "note", "log", "data", "message", "comment"];
    const hasTextSignal = entityWords.some(w => textEntitySignals.some(s => w.includes(s)));
    if (hasTextSignal || entity.purpose.toLowerCase().includes("content")) {
      fields.push({ name: "content", type: "String", nullable: true, validation: "@db.Text" });
    }

    const scoreSignals = ["result", "analysis", "score", "match", "rating", "metric"];
    if (entityWords.some(w => scoreSignals.some(s => w.includes(s)))) {
      fields.push({ name: "score", type: "Float", nullable: false, default: "0.0" });
    }

    const dateSignals = ["schedule", "booking", "event", "slot", "shift", "session", "meeting"];
    if (entityWords.some(w => dateSignals.some(s => w.includes(s)))) {
      fields.push(
        { name: "date", type: "String", nullable: true },
        { name: "startTime", type: "String", nullable: true },
        { name: "endTime", type: "String", nullable: true },
        { name: "status", type: "String", nullable: true },
      );
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
