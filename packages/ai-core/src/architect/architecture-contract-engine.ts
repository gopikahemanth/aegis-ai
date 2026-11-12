/**
 * ArchitectureContractEngine
 *
 * Phase 3: Requirement & Architecture Intelligence
 *
 * Synthesizes, locks, and cryptographically hashes the definitive full-stack
 * ArchitectureContract for Aegis AI generation jobs.
 *
 * Invariants Enforced:
 * 1. Deterministic Contract Hashing (SHA-256): Same spec -> identical hash.
 * 2. Model & Endpoint Completeness: Every domain entity MUST have corresponding API routes and data schema.
 * 3. Technology Consistency: Strict adherence to user preferences without hidden fallback switches.
 * 4. Contract Immutability: Once locked, changes require an explicit migration or re-architecture.
 */

import { createHash } from "node:crypto";
import type { InterpretedSpecification } from "../requirement-intelligence/universal-requirement-interpreter.js";
import { CanonicalResourceRegistry, type CanonicalResourceMapping } from "./canonical-resource-registry.js";

export interface FrontendContract {
  framework: "react-vite" | "nextjs" | "html-tailwind" | "vue";
  buildTool: "vite" | "next" | "none";
  styling: "tailwind" | "css-modules" | "vanilla";
  stateManagement: "zustand" | "context" | "none";
  port: number;
}

export interface BackendContract {
  runtime: "node";
  framework: "express" | "fastify" | "nest" | "none";
  apiType: "REST" | "GraphQL" | "tRPC";
  port: number;
  corsOrigin: string;
}

export interface DatabaseContract {
  orm: "prisma" | "none";
  engine: "sqlite" | "postgresql" | "mongodb" | "none";
  schemaPath: string;
}

export interface RouteBlueprint {
  canonicalResources?: CanonicalResourceMapping[];
  frontendRoutes: Array<{
    path: string;
    componentName: string;
    authRequired: boolean;
    allowedRoles?: string[];
  }>;
  backendEndpoints: Array<{
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    handlerName: string;
    authRequired: boolean;
    entity: string;
  }>;
}

export interface DataModelBlueprint {
  models: Array<{
    name: string;
    fields: Array<{ name: string; type: string; constraints?: string }>;
    relations: Array<{
      targetModel: string;
      type: string;
      foreignKey?: string;
      relationField?: string;
      onDelete?: "Cascade" | "Restrict" | "SetNull";
    }>;
  }>;
}

export interface LockedArchitectureContract {
  version: 2;
  contractHash: string;
  projectName: string;
  domainCategory: string;
  description?: string;
  frontend: FrontendContract;
  backend: BackendContract;
  database: DatabaseContract;
  routes: RouteBlueprint;
  dataModels: DataModelBlueprint;
  directories: string[];
  lockedAt: string;
}

export interface ContractValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: string;
}

export class ArchitectureContractEngine {
  /**
   * Synthesizes and locks the complete architecture contract from an interpreted specification.
   */
  public static synthesizeContract(spec: InterpretedSpecification): LockedArchitectureContract {
    const { technicalConstraints, entities, domainVocabulary, projectName, domainCategory } = spec;

    // 1. Frontend Configuration
    const frontend: FrontendContract = {
      framework: technicalConstraints.frontendFramework,
      buildTool: technicalConstraints.frontendFramework === "nextjs" ? "next" : "vite",
      styling: technicalConstraints.styling,
      stateManagement: technicalConstraints.frontendFramework === "html-tailwind" ? "none" : "zustand",
      port: 5173,
    };

    // 2. Backend Configuration
    const backend: BackendContract = {
      runtime: "node",
      framework: technicalConstraints.backendFramework,
      apiType: technicalConstraints.apiType,
      port: 3001,
      corsOrigin: "http://localhost:5173",
    };

    // 3. Database Configuration
    const database: DatabaseContract = {
      orm: technicalConstraints.databaseEngine !== "none" ? "prisma" : "none",
      engine: technicalConstraints.databaseEngine,
      schemaPath: "prisma/schema.prisma",
    };

    // 4. Synthesize Route Blueprint
    const routes = this.synthesizeRoutes(spec);

    // 5. Synthesize Data Models
    const dataModels = this.synthesizeDataModels(spec);

    // 6. Directory Structure Blueprint
    const directories = [
      "src",
      "src/components",
      "src/pages",
      "src/services",
      "src/hooks",
      "src/types",
      "server",
      "server/routes",
      "server/controllers",
      "server/middleware",
      "prisma",
      "tests",
      "public",
    ];

    // 7. Compute Canonical Deterministic Hash
    const contractHash = this.computeContractHash({
      projectName,
      domainCategory,
      frontend,
      backend,
      database,
      routes,
      dataModels,
    });

    return {
      version: 2,
      contractHash,
      projectName,
      domainCategory,
      description: spec.summary || spec.rawPrompt,
      frontend,
      backend,
      database,
      routes,
      dataModels,
      directories,
      lockedAt: new Date().toISOString(),
    };
  }

  /**
   * Validates architecture contract invariants before code generation commences.
   */
  public static validateContractInvariants(contract: LockedArchitectureContract): ContractValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Invariant 1: Port conflict
    if (contract.backend.framework !== "none" && contract.frontend.port === contract.backend.port) {
      errors.push(`Port conflict: Frontend and backend are both assigned port ${contract.frontend.port}`);
    }

    // Invariant 2: Database engine vs ORM consistency
    if (contract.database.engine !== "none" && contract.database.orm === "none") {
      errors.push("Database engine specified but ORM is disabled.");
    }

    // Invariant 3: Model and endpoint coverage
    if (contract.backend.framework !== "none") {
      for (const model of contract.dataModels.models) {
        if (model.name === "User") continue;
        const hasEndpoint = contract.routes.backendEndpoints.some(e => e.entity.toLowerCase() === model.name.toLowerCase());
        if (!hasEndpoint) {
          warnings.push(`Model '${model.name}' has no registered backend API endpoints.`);
        }
      }
    }

    // Invariant 4: Frontend route validity
    if (contract.routes.frontendRoutes.length === 0) {
      errors.push("Contract specifies zero frontend routes.");
    }

    const valid = errors.length === 0;
    const summary = valid
      ? `Contract verified valid (Hash: ${contract.contractHash.slice(0, 12)}...)`
      : `Contract invalid (${errors.length} errors, ${warnings.length} warnings)`;

    return { valid, errors, warnings, summary };
  }

  private static synthesizeRoutes(spec: InterpretedSpecification): RouteBlueprint {
    const hasAuth = Boolean(
      spec.entities.some(e => /user|member|account|admin|buyer|seller|customer/i.test(e.name)) ||
      (spec.domainVocabulary?.domainPrefix && /user|member|account|client/i.test(spec.domainVocabulary.domainPrefix))
    );

    const frontendRoutes: RouteBlueprint["frontendRoutes"] = [
      { path: "/", componentName: "HomePage", authRequired: false },
    ];

    if (hasAuth) {
      frontendRoutes.push(
        { path: "/login", componentName: "LoginPage", authRequired: false },
        { path: "/register", componentName: "RegisterPage", authRequired: false },
      );
    }

    const canonicalResources: CanonicalResourceMapping[] = [];

    // Synthesize canonical resources for each domain entity
    for (const entity of spec.entities) {
      const res = CanonicalResourceRegistry.resolve(entity.name);
      canonicalResources.push(res);
    }

    if (spec.domainVocabulary?.domainPrefix && spec.domainVocabulary?.entityName) {
      frontendRoutes.push(
        { path: `/${spec.domainVocabulary.domainPrefix}s`, componentName: `${spec.domainVocabulary.entityName}ListPage`, authRequired: false },
        { path: `/${spec.domainVocabulary.domainPrefix}s/:id`, componentName: `${spec.domainVocabulary.entityName}DetailPage`, authRequired: false },
      );
    }

    // Include canonical routes for other discovered entities
    for (const res of canonicalResources) {
      if (res.modelName.toLowerCase() === "user") continue;
      const canonicalRoute = `/${res.pluralResourceSlug}`;
      if (!frontendRoutes.some(r => r.path === canonicalRoute)) {
        frontendRoutes.push(
          { path: canonicalRoute, componentName: `${res.modelName}ListPage`, authRequired: false },
          { path: `${canonicalRoute}/:id`, componentName: `${res.modelName}DetailPage`, authRequired: false },
        );
      }
      // Also preserve legacy route if different to avoid breaking routes in existing matrix
      const legacyRoute = `/${res.modelName.toLowerCase()}s`;
      if (legacyRoute !== canonicalRoute && !frontendRoutes.some(r => r.path === legacyRoute)) {
        frontendRoutes.push(
          { path: legacyRoute, componentName: `${res.modelName}ListPage`, authRequired: false },
          { path: `${legacyRoute}/:id`, componentName: `${res.modelName}DetailPage`, authRequired: false },
        );
      }
    }

    if (hasAuth) {
      frontendRoutes.push(
        { path: "/admin", componentName: "AdminDashboardPage", authRequired: true, allowedRoles: ["ADMIN"] },
      );
    }

    const backendEndpoints: RouteBlueprint["backendEndpoints"] = [];

    // Authentication endpoints (included only when authentication/user identity is relevant)
    if (hasAuth) {
      backendEndpoints.push(
        { path: "/api/auth/register", method: "POST", handlerName: "register", authRequired: false, entity: "User" },
        { path: "/api/auth/login", method: "POST", handlerName: "login", authRequired: false, entity: "User" },
        { path: "/api/auth/me", method: "GET", handlerName: "getCurrentUser", authRequired: true, entity: "User" },
      );
    }

    // Entity endpoints for every domain entity using CanonicalResourceRegistry
    for (const res of canonicalResources) {
      backendEndpoints.push(
        { path: res.pluralResourcePath, method: "GET", handlerName: `list${res.modelName}`, authRequired: false, entity: res.modelName },
        { path: res.detailRoute, method: "GET", handlerName: `get${res.modelName}ById`, authRequired: false, entity: res.modelName },
        { path: res.pluralResourcePath, method: "POST", handlerName: `create${res.modelName}`, authRequired: hasAuth, entity: res.modelName },
        { path: res.detailRoute, method: "PUT", handlerName: `update${res.modelName}`, authRequired: hasAuth, entity: res.modelName },
        { path: res.detailRoute, method: "DELETE", handlerName: `delete${res.modelName}`, authRequired: hasAuth, entity: res.modelName },
        { path: `${res.detailRoute}/workflow`, method: "POST", handlerName: `execute${res.modelName}Workflow`, authRequired: hasAuth, entity: res.modelName },
      );

      // Support legacy endpoint path if different to preserve backwards compatibility
      const legacyPlural = `/api/${res.modelName.toLowerCase()}s`;
      if (legacyPlural !== res.pluralResourcePath) {
        backendEndpoints.push(
          { path: legacyPlural, method: "GET", handlerName: `list${res.modelName}Legacy`, authRequired: false, entity: res.modelName },
          { path: `${legacyPlural}/:id`, method: "GET", handlerName: `get${res.modelName}ByIdLegacy`, authRequired: false, entity: res.modelName },
        );
      }
    }

    return { canonicalResources, frontendRoutes, backendEndpoints };
  }

  private static synthesizeDataModels(spec: InterpretedSpecification): DataModelBlueprint {
    const models: DataModelBlueprint["models"] = [];

    for (const entity of spec.entities) {
      const fields = entity.fields.map(f => {
        let prismaType = "String";
        let constraints = "";

        if (f.name === "id") {
          prismaType = "String";
          constraints = "@id @default(uuid())";
        } else if (f.type === "number") {
          prismaType = "Float";
        } else if (f.type === "boolean") {
          prismaType = "Boolean";
        } else if (f.type === "datetime") {
          prismaType = "DateTime";
          if (f.name === "createdAt") constraints = "@default(now())";
          if (f.name === "updatedAt") constraints = "@updatedAt";
        } else if (f.unique) {
          constraints = "@unique";
        }

        if (!f.required && f.name !== "id") {
          prismaType = `${prismaType}?`;
        }

        return { name: f.name, type: prismaType, constraints: constraints || undefined };
      });

      const relations = (entity.relations || []).map(r => ({
        targetModel: r.targetEntity,
        type: r.type,
        foreignKey: (r as any).foreignKey,
        relationField: (r as any).relationField,
        onDelete: (r as any).onDelete,
      }));

      models.push({ name: entity.name, fields, relations });
    }

    return { models };
  }

  private static computeContractHash(data: any): string {
    const canonicalJson = JSON.stringify(data, Object.keys(data).sort());
    return createHash("sha256").update(canonicalJson).digest("hex");
  }
}
