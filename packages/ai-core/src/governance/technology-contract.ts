/**
 * TechnologyContract
 *
 * Defines the authoritative technology stack for the project across 16 categories.
 * Includes server/client boundary classifications and environment variable security classifications.
 */

import { createHash } from "node:crypto";

export type TechnologyCategory =
  | "frontend"
  | "backend"
  | "language"
  | "runtime"
  | "database"
  | "orm"
  | "auth"
  | "styling"
  | "build"
  | "packageManager"
  | "testing"
  | "browserTesting"
  | "storage"
  | "cache"
  | "queue"
  | "aiProvider"
  | "deployment";

export type EnvVarScope = "PUBLIC" | "SERVER_ONLY" | "SECRET";

export interface EnvVarDefinition {
  name: string;
  scope: EnvVarScope;
  required: boolean;
  purpose: string;
  defaultValue?: string;
}

export interface TechnologyItem {
  technologyId: string;
  category: TechnologyCategory;
  name: string;
  versionConstraint?: string;
  purpose: string;
  required: boolean;
  source: "user_specified" | "existing_project" | "aegis_default" | "inferred";
  compatibility: "SUPPORTED" | "SUPPORTED_WITH_CONFIG" | "UNSUPPORTED";
  securityStatus: "SECURE" | "REQUIRES_AUDIT";
  alternatives?: string[];
  contractOwner: "FrontendAgent" | "BackendAgent" | "DatabaseAgent" | "DevOpsAgent" | "System";
}

export interface TechnologyContract {
  version: number;
  applicationType: string;
  architectureProfile: string;
  technologies: TechnologyItem[];
  environmentVariables: EnvVarDefinition[];
  serverOnlyModules: string[];
  browserForbiddenModules: string[];
  technologyHash: string;
  lockedAt: string;
}

export class TechnologyContractBuilder {
  /**
   * Derive a comprehensive TechnologyContract from an ArchitectureContract or explicit stack parameters.
   */
  public static build(
    applicationType: string,
    stack: {
      frontend?: string;
      backend?: string;
      database?: string;
      orm?: string;
      auth?: string;
      language?: string;
      styling?: string;
      packageManager?: "pnpm" | "npm" | "yarn";
      aiProvider?: string;
    },
    provenance: {
      userSpecified?: boolean;
      existingProject?: boolean;
    } = {}
  ): TechnologyContract {
    const defaultSource = provenance.existingProject
      ? "existing_project"
      : provenance.userSpecified
      ? "user_specified"
      : "aegis_default";

    const technologies: TechnologyItem[] = [];
    const envVars: EnvVarDefinition[] = [];

    const isStatic = applicationType.toUpperCase().includes("STATIC");
    const hasDb = stack.database && !stack.database.toLowerCase().includes("none") && !isStatic;
    const hasBackend = stack.backend && !stack.backend.toLowerCase().includes("none") && !isStatic;
    const hasAuth = stack.auth && !stack.auth.toLowerCase().includes("none") && !isStatic;

    // 1. Language
    technologies.push({
      technologyId: "tech_lang",
      category: "language",
      name: stack.language || "TypeScript",
      versionConstraint: "^5.8.0",
      purpose: "Primary application programming language",
      required: true,
      source: defaultSource,
      compatibility: "SUPPORTED",
      securityStatus: "SECURE",
      contractOwner: "System",
    });

    // 2. Runtime
    technologies.push({
      technologyId: "tech_runtime",
      category: "runtime",
      name: "Node.js",
      versionConstraint: ">=20.0.0",
      purpose: "JavaScript/TypeScript execution runtime",
      required: true,
      source: defaultSource,
      compatibility: "SUPPORTED",
      securityStatus: "SECURE",
      contractOwner: "System",
    });

    // 3. Package Manager
    technologies.push({
      technologyId: "tech_pm",
      category: "packageManager",
      name: stack.packageManager || "pnpm",
      versionConstraint: ">=9.0.0",
      purpose: "Deterministic dependency management",
      required: true,
      source: defaultSource,
      compatibility: "SUPPORTED",
      securityStatus: "SECURE",
      contractOwner: "DevOpsAgent",
    });

    // 4. Frontend Framework
    const fe = stack.frontend || (isStatic ? "HTML5/Vanilla" : "React-Vite");
    technologies.push({
      technologyId: "tech_frontend",
      category: "frontend",
      name: fe,
      versionConstraint: fe.includes("React") ? "^19.0.0" : "^15.0.0",
      purpose: "User interface presentation layer",
      required: true,
      source: defaultSource,
      compatibility: "SUPPORTED",
      securityStatus: "SECURE",
      alternatives: ["React-Vite", "Next.js", "Vue-Vite", "HTML5/Vanilla"],
      contractOwner: "FrontendAgent",
    });

    // 5. Styling
    technologies.push({
      technologyId: "tech_styling",
      category: "styling",
      name: stack.styling || "TailwindCSS",
      purpose: "Component styling and design system",
      required: true,
      source: defaultSource,
      compatibility: "SUPPORTED",
      securityStatus: "SECURE",
      contractOwner: "FrontendAgent",
    });

    // 6. Backend Framework
    if (hasBackend) {
      technologies.push({
        technologyId: "tech_backend",
        category: "backend",
        name: stack.backend || "Express",
        versionConstraint: "^4.21.0",
        purpose: "REST API server and business logic",
        required: true,
        source: defaultSource,
        compatibility: "SUPPORTED",
        securityStatus: "SECURE",
        alternatives: ["Express", "Fastify", "Next.js API Routes", "NestJS"],
        contractOwner: "BackendAgent",
      });

      envVars.push({
        name: "PORT",
        scope: "SERVER_ONLY",
        required: false,
        purpose: "Backend HTTP server listening port",
        defaultValue: "3000",
      });
    }

    // 7. Database & ORM
    if (hasDb) {
      technologies.push({
        technologyId: "tech_db",
        category: "database",
        name: stack.database || "PostgreSQL",
        purpose: "Persistent relational data storage",
        required: true,
        source: defaultSource,
        compatibility: "SUPPORTED",
        securityStatus: "SECURE",
        alternatives: ["PostgreSQL", "SQLite", "MySQL", "MongoDB"],
        contractOwner: "DatabaseAgent",
      });

      technologies.push({
        technologyId: "tech_orm",
        category: "orm",
        name: stack.orm || "Prisma",
        versionConstraint: "^6.4.0",
        purpose: "Type-safe database schema and query ORM",
        required: true,
        source: defaultSource,
        compatibility: "SUPPORTED",
        securityStatus: "SECURE",
        alternatives: ["Prisma", "Drizzle", "TypeORM", "Mongoose"],
        contractOwner: "DatabaseAgent",
      });

      envVars.push({
        name: "DATABASE_URL",
        scope: "SECRET",
        required: true,
        purpose: "Database connection string with credentials",
      });
    }

    // 8. Authentication
    if (hasAuth) {
      technologies.push({
        technologyId: "tech_auth",
        category: "auth",
        name: stack.auth || "JWT",
        purpose: "User authentication and authorization sessions",
        required: true,
        source: defaultSource,
        compatibility: "SUPPORTED",
        securityStatus: "SECURE",
        contractOwner: "BackendAgent",
      });

      envVars.push({
        name: "JWT_SECRET",
        scope: "SECRET",
        required: true,
        purpose: "Cryptographic secret for signing and verifying JWT tokens",
      });
    }

    // 9. Testing
    technologies.push({
      technologyId: "tech_test",
      category: "testing",
      name: "Vitest",
      versionConstraint: "^3.0.0",
      purpose: "Unit and integration test runner",
      required: true,
      source: "aegis_default",
      compatibility: "SUPPORTED",
      securityStatus: "SECURE",
      contractOwner: "DevOpsAgent",
    });

    if (!isStatic) {
      technologies.push({
        technologyId: "tech_browser_test",
        category: "browserTesting",
        name: "Puppeteer",
        versionConstraint: "^24.0.0",
        purpose: "Headless browser verification and screenshot QA",
        required: true,
        source: "aegis_default",
        compatibility: "SUPPORTED",
        securityStatus: "SECURE",
        contractOwner: "DevOpsAgent",
      });
    }

    // Public Env Var for frontend
    envVars.push({
      name: "VITE_API_URL",
      scope: "PUBLIC",
      required: false,
      purpose: "Public URL of backend API server for frontend client",
      defaultValue: "http://localhost:3000",
    });

    // Modules forbidden from client/browser bundle
    const serverOnlyModules = [
      "@prisma/client",
      "prisma",
      "pg",
      "mysql2",
      "better-sqlite3",
      "mongoose",
      "jsonwebtoken",
      "bcrypt",
      "bcryptjs",
      "node:fs",
      "fs",
      "node:child_process",
      "child_process",
      "node:net",
      "net",
    ];

    const browserForbiddenModules = [...serverOnlyModules];

    // Compute deterministic technology hash
    const stablePayload = {
      applicationType,
      technologies: [...technologies].map(t => ({ id: t.technologyId, name: t.name, cat: t.category })).sort((a, b) => a.id.localeCompare(b.id)),
      envVars: [...envVars].map(e => ({ name: e.name, scope: e.scope, req: e.required })).sort((a, b) => a.name.localeCompare(b.name)),
      serverOnlyModules: [...serverOnlyModules].sort(),
    };

    const technologyHash = createHash("sha256").update(JSON.stringify(stablePayload)).digest("hex").slice(0, 12);

    let architectureProfile = "FULLSTACK_WEB_REACT_EXPRESS";
    if (isStatic) architectureProfile = "STATIC_SITE_VITE";
    else if (fe.toLowerCase().includes("next")) architectureProfile = "NEXTJS_FULLSTACK";
    else if (applicationType.toUpperCase().includes("CLI")) architectureProfile = "CLI_NODE";

    return {
      version: 1,
      applicationType,
      architectureProfile,
      technologies,
      environmentVariables: envVars,
      serverOnlyModules,
      browserForbiddenModules,
      technologyHash,
      lockedAt: new Date().toISOString(),
    };
  }
}
