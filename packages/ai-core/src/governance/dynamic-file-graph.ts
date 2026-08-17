/**
 * DynamicCanonicalFileGraph
 *
 * Generates a project-specific canonical file graph from the locked contracts.
 *
 * This REPLACES the hardcoded 39-file Resume Scanner graph as the default.
 * The static CANONICAL_FILES list in canonical-file-graph.ts is now ONLY used
 * when a domain-specific override is explicitly registered.
 *
 * Generation order (CONTRACT-FIRST):
 *   ArchitectureContractV1 + DomainContract
 *     → Layer definitions (config, schema, backend, frontend)
 *     → Feature-aware page/component entries
 *     → Entity-aware service/controller entries
 *     → Graph with full allowedImports, requiredExports, and taskOwner
 *
 * The graph is locked in .aegis/file-graph.json after first generation.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ArchitectureContractV1 } from "./architecture-resolver.js";
import type { DomainContract } from "./domain-contract.js";
import type { CanonicalFileEntry, FileCategory } from "./canonical-file-graph.js";
import { ContractHashEngine } from "./contract-hash-engine.js";
import type { ContractHashes } from "./contract-hash-engine.js";

// ─── Enriched Entry with Contract Tracking ──────────────────────────────────

export interface DynamicFileEntry extends CanonicalFileEntry {
  /** Feature this file implements */
  featureId?: string;
  /** Domain entity this file operates on */
  entityName?: string;
  /** Semantic layer */
  layer: "config" | "schema" | "backend" | "frontend" | "shared";
  /** Domain this file belongs to */
  domain: string;
  /** Status */
  status: "required" | "optional";
}

export interface DynamicFileGraph {
  version: 1;
  contractHashes: ContractHashes;
  domainName: string;
  entries: DynamicFileEntry[];
  generatedAt: string;
}

// ─── DynamicCanonicalFileGraphBuilder ────────────────────────────────────────

export class DynamicCanonicalFileGraphBuilder {
  /**
   * Build the canonical file graph for the given contracts.
   * Returns entries that should be treated as the authoritative list.
   */
  public static build(
    arch: ArchitectureContractV1,
    domain: DomainContract,
    archHash: string,
  ): DynamicFileGraph {
    const entries: DynamicFileEntry[] = [];

    // ── 1. Universal config files ─────────────────────────────────────────
    entries.push(...DynamicCanonicalFileGraphBuilder.buildConfigEntries(arch));

    // ── 2. Schema files (backend/database) ────────────────────────────────
    const hasDb = arch.database?.provider && !arch.database.provider.toLowerCase().includes("none");
    if (hasDb) {
      entries.push(...DynamicCanonicalFileGraphBuilder.buildSchemaEntries(arch));
    }

    // ── 3. Backend entries (controllers, routes, services per entity) ──────
    const isReactVite = arch.frontend?.framework?.toLowerCase().includes("react")
      || arch.frontend?.framework?.toLowerCase().includes("vite");
    const isNextJs = arch.frontend?.framework?.toLowerCase().includes("next");
    const hasExpressBackend = arch.backend?.framework?.toLowerCase().includes("express");

    if (hasExpressBackend) {
      entries.push(...DynamicCanonicalFileGraphBuilder.buildBackendEntries(arch, domain));
    }

    // ── 4. Frontend entries (pages, components per feature/entity) ─────────
    if (isReactVite) {
      entries.push(...DynamicCanonicalFileGraphBuilder.buildReactViteFrontendEntries(arch, domain));
    } else if (isNextJs) {
      entries.push(...DynamicCanonicalFileGraphBuilder.buildNextJsFrontendEntries(arch, domain));
    }

    // ── 5. Shared types ───────────────────────────────────────────────────
    entries.push(...DynamicCanonicalFileGraphBuilder.buildSharedEntries(domain));

    const fileGraphHash = ContractHashEngine.hashFileGraph(entries.map(e => e.canonicalPath));
    const contractHashes: ContractHashes = {
      architectureHash: ContractHashEngine.hashArchitecture(arch),
      // Use the domain's own stored hash — NOT recomputed — to ensure consistency
      domainHash: domain.domainHash,
      fileGraphHash,
    };

    return {
      version: 1,
      contractHashes,
      domainName: domain.domainName,
      entries,
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Config Entries ──────────────────────────────────────────────────────

  private static buildConfigEntries(arch: ArchitectureContractV1): DynamicFileEntry[] {
    const entries: DynamicFileEntry[] = [];
    const isNextJs = arch.frontend?.framework?.toLowerCase().includes("next");
    const isReactVite = !isNextJs;

    // package.json
    entries.push({
      canonicalPath: "package.json",
      semanticRole: "Package Manifest",
      semanticAliases: [],
      requiredExports: [],
      allowedImports: [],
      required: true,
      category: "config",
      layer: "config",
      domain: "infrastructure",
      status: "required",
    });

    // tsconfig.json
    entries.push({
      canonicalPath: "tsconfig.json",
      semanticRole: "TypeScript Config",
      semanticAliases: ["tsconfig.node.json"],
      requiredExports: [],
      allowedImports: [],
      required: true,
      category: "config",
      layer: "config",
      domain: "infrastructure",
      status: "required",
    });

    if (isReactVite) {
      entries.push({
        canonicalPath: "vite.config.ts",
        semanticRole: "Vite Config",
        semanticAliases: ["vite.config.js"],
        requiredExports: [],
        allowedImports: [],
        required: true,
        category: "config",
        layer: "config",
        domain: "infrastructure",
        status: "required",
      });
    }

    if (isNextJs) {
      entries.push({
        canonicalPath: "next.config.ts",
        semanticRole: "Next.js Config",
        semanticAliases: ["next.config.js", "next.config.mjs"],
        requiredExports: [],
        allowedImports: [],
        required: true,
        category: "config",
        layer: "config",
        domain: "infrastructure",
        status: "required",
      });
    }

    // Tailwind/PostCSS if applicable
    const hasTailwind = (arch.styling || "").toLowerCase().includes("tailwind");
    if (hasTailwind) {
      entries.push(
        {
          canonicalPath: "tailwind.config.ts",
          semanticRole: "Tailwind CSS Config",
          semanticAliases: ["tailwind.config.js"],
          requiredExports: [],
          allowedImports: [],
          required: true,
          category: "config",
          layer: "config",
          domain: "infrastructure",
          status: "required",
        },
        {
          canonicalPath: "postcss.config.js",
          semanticRole: "PostCSS Config",
          semanticAliases: ["postcss.config.ts", "postcss.config.cjs"],
          requiredExports: [],
          allowedImports: [],
          required: true,
          category: "config",
          layer: "config",
          domain: "infrastructure",
          status: "required",
        },
      );
    }

    // index.html for Vite
    if (isReactVite) {
      entries.push({
        canonicalPath: "index.html",
        semanticRole: "HTML Entry Point",
        semanticAliases: [],
        requiredExports: [],
        allowedImports: [],
        required: true,
        category: "config",
        layer: "config",
        domain: "infrastructure",
        status: "required",
      });
    }

    return entries;
  }

  // ── Schema Entries ──────────────────────────────────────────────────────

  private static buildSchemaEntries(arch: ArchitectureContractV1): DynamicFileEntry[] {
    const usesPrisma = (arch.database?.orm || "").toLowerCase().includes("prisma");
    if (!usesPrisma) return [];

    return [{
      canonicalPath: "prisma/schema.prisma",
      semanticRole: "Prisma Database Schema",
      semanticAliases: ["schema.prisma", "server/prisma/schema.prisma"],
      requiredExports: [],
      allowedImports: [],
      required: true,
      category: "schema",
      layer: "schema",
      domain: "infrastructure",
      status: "required",
    }];
  }

  // ── Backend Entries ─────────────────────────────────────────────────────

  private static buildBackendEntries(
    arch: ArchitectureContractV1,
    domain: DomainContract,
  ): DynamicFileEntry[] {
    const entries: DynamicFileEntry[] = [];
    const usesPrisma = (arch.database?.orm || "").toLowerCase().includes("prisma");

    // Server entry
    entries.push({
      canonicalPath: "server/index.ts",
      semanticRole: "Express Server Entry",
      semanticAliases: ["server/app.ts", "server/server.ts"],
      requiredExports: ["app"],
      allowedImports: ["server/routes/", "server/middleware/"],
      required: true,
      category: "backend-entry",
      layer: "backend",
      domain: "infrastructure",
      status: "required",
    });

    // Prisma client singleton
    if (usesPrisma) {
      entries.push({
        canonicalPath: "server/lib/prisma.ts",
        semanticRole: "Prisma Client Singleton",
        semanticAliases: ["server/db.ts", "server/prisma.ts", "server/lib/db.ts"],
        requiredExports: ["prisma"],
        allowedImports: [],
        forbiddenImporters: ["src/"],
        required: true,
        category: "backend-lib",
        layer: "backend",
        domain: "infrastructure",
        status: "required",
      });
    }

    // Auth middleware
    const hasJwt = (arch.authentication || "").toLowerCase().includes("jwt");
    if (hasJwt) {
      entries.push({
        canonicalPath: "server/middleware/auth.ts",
        semanticRole: "JWT Authentication Middleware",
        semanticAliases: ["server/middleware/authenticate.ts", "server/auth.ts"],
        requiredExports: ["authenticateToken"],
        allowedImports: [],
        required: true,
        category: "backend-middleware",
        layer: "backend",
        domain: "infrastructure",
        status: "required",
      });

      // Auth routes
      entries.push({
        canonicalPath: "server/routes/auth.ts",
        semanticRole: "Authentication Routes",
        semanticAliases: ["server/routes/auth.route.ts", "server/controllers/auth.ts"],
        requiredExports: ["router"],
        allowedImports: ["server/lib/prisma.ts", "server/middleware/auth.ts"],
        required: true,
        category: "backend-route",
        layer: "backend",
        domain: "infrastructure",
        status: "required",
      });
    }

    // Per-domain-entity routes and controllers
    for (const entity of domain.entities.filter(e => e.kind === "domain")) {
      const entitySlug = entity.name.toLowerCase().replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
      const entityCamel = entity.name.charAt(0).toLowerCase() + entity.name.slice(1);

      entries.push(
        {
          canonicalPath: `server/routes/${entitySlug}.ts`,
          semanticRole: `${entity.name} API Routes`,
          semanticAliases: [
            `server/routes/${entityCamel}.route.ts`,
            `server/controllers/${entityCamel}.ts`,
            `server/routes/${entityCamel}s.ts`,
          ],
          requiredExports: ["router"],
          allowedImports: [
            "server/lib/prisma.ts",
            "server/middleware/auth.ts",
            `server/services/${entitySlug}.ts`,
          ],
          required: true,
          category: "backend-route",
          layer: "backend",
          domain: entity.name,
          featureId: domain.features.find(f => f.entities.includes(entity.name))?.featureId,
          entityName: entity.name,
          status: "required",
        },
        {
          canonicalPath: `server/services/${entitySlug}.ts`,
          semanticRole: `${entity.name} Business Logic Service`,
          semanticAliases: [
            `server/services/${entityCamel}Service.ts`,
            `server/services/${entityCamel}.service.ts`,
          ],
          requiredExports: [`create${entity.name}`, `get${entity.name}s`],
          allowedImports: ["server/lib/prisma.ts"],
          required: false,
          category: "backend-service",
          layer: "backend",
          domain: entity.name,
          entityName: entity.name,
          status: "optional",
        },
      );
    }

    return entries;
  }

  // ── React/Vite Frontend Entries ──────────────────────────────────────────

  private static buildReactViteFrontendEntries(
    arch: ArchitectureContractV1,
    domain: DomainContract,
  ): DynamicFileEntry[] {
    const entries: DynamicFileEntry[] = [];

    // React entry points
    entries.push(
      {
        canonicalPath: "src/main.tsx",
        semanticRole: "React Application Entry",
        semanticAliases: ["src/main.ts", "src/index.tsx", "src/index.ts"],
        requiredExports: [],
        allowedImports: ["src/App.tsx", "src/index.css"],
        required: true,
        category: "config",
        layer: "frontend",
        domain: "infrastructure",
        status: "required",
      },
      {
        canonicalPath: "src/App.tsx",
        semanticRole: "Root Application Component",
        semanticAliases: ["src/App.ts"],
        requiredExports: ["App"],
        allowedImports: ["src/pages/", "src/components/", "src/lib/"],
        required: true,
        category: "frontend-component",
        layer: "frontend",
        domain: "infrastructure",
        status: "required",
      },
      {
        canonicalPath: "src/index.css",
        semanticRole: "Global Stylesheet",
        semanticAliases: ["src/styles/global.css", "src/styles/index.css"],
        requiredExports: [],
        allowedImports: [],
        required: true,
        category: "config",
        layer: "frontend",
        domain: "infrastructure",
        status: "required",
      },
      {
        canonicalPath: "src/services/api.ts",
        semanticRole: "HTTP API Client",
        semanticAliases: ["src/api.ts", "src/lib/api.ts", "src/services/index.ts"],
        requiredExports: ["api"],
        allowedImports: [],
        forbiddenImporters: [],
        required: true,
        category: "frontend-service",
        layer: "frontend",
        domain: "infrastructure",
        status: "required",
      },
    );

    // Auth pages
    const hasAuth = (arch.authentication || "jwt") !== "none";
    if (hasAuth) {
      entries.push(
        {
          canonicalPath: "src/pages/LoginPage.tsx",
          semanticRole: "Login Page",
          semanticAliases: ["src/pages/Login.tsx", "src/pages/auth/Login.tsx", "src/views/Login.tsx"],
          requiredExports: ["LoginPage"],
          allowedImports: ["src/services/api.ts", "src/components/"],
          required: true,
          category: "frontend-page",
          layer: "frontend",
          domain: "infrastructure",
          featureId: "auth",
          status: "required",
        },
        {
          canonicalPath: "src/pages/RegisterPage.tsx",
          semanticRole: "Registration Page",
          semanticAliases: ["src/pages/Register.tsx", "src/pages/auth/Register.tsx", "src/views/Register.tsx"],
          requiredExports: ["RegisterPage"],
          allowedImports: ["src/services/api.ts", "src/components/"],
          required: true,
          category: "frontend-page",
          layer: "frontend",
          domain: "infrastructure",
          featureId: "auth",
          status: "required",
        },
      );
    }

    // Dashboard page
    entries.push({
      canonicalPath: "src/pages/DashboardPage.tsx",
      semanticRole: "Main Dashboard Page",
      semanticAliases: ["src/pages/Dashboard.tsx", "src/pages/Home.tsx", "src/views/Dashboard.tsx"],
      requiredExports: ["DashboardPage"],
      allowedImports: ["src/services/api.ts", "src/components/", "src/hooks/"],
      required: true,
      category: "frontend-page",
      layer: "frontend",
      domain: "infrastructure",
      status: "required",
    });

    // Per-feature pages for domain entities
    for (const entity of domain.entities.filter(e => e.kind === "domain")) {
      const entitySlug = entity.name.replace(/([A-Z])/g, (m, i) => (i === 0 ? m : `-${m}`)).toLowerCase();
      const features = domain.features.filter(f => f.entities.includes(entity.name));
      const featureId = features[0]?.featureId;

      entries.push({
        canonicalPath: `src/features/${entitySlug}/index.tsx`,
        semanticRole: `${entity.name} Feature Module`,
        semanticAliases: [
          `src/pages/${entity.name}Page.tsx`,
          `src/pages/${entity.name}.tsx`,
          `src/features/${entitySlug}/${entity.name}Page.tsx`,
        ],
        requiredExports: [`${entity.name}Page`],
        allowedImports: [
          "src/services/api.ts",
          "src/components/",
          "src/hooks/",
          `src/features/${entitySlug}/`,
        ],
        required: true,
        category: "frontend-page",
        layer: "frontend",
        domain: entity.name,
        featureId,
        entityName: entity.name,
        status: "required",
      });
    }

    // Layout component
    entries.push({
      canonicalPath: "src/components/Layout.tsx",
      semanticRole: "Application Layout Shell",
      semanticAliases: ["src/layouts/Layout.tsx", "src/components/AppLayout.tsx"],
      requiredExports: ["Layout"],
      allowedImports: ["src/components/"],
      required: true,
      category: "frontend-component",
      layer: "frontend",
      domain: "infrastructure",
      status: "required",
    });

    return entries;
  }

  // ── Next.js Frontend Entries ──────────────────────────────────────────────

  private static buildNextJsFrontendEntries(
    _arch: ArchitectureContractV1,
    domain: DomainContract,
  ): DynamicFileEntry[] {
    const entries: DynamicFileEntry[] = [];

    entries.push(
      {
        canonicalPath: "app/layout.tsx",
        semanticRole: "Next.js Root Layout",
        semanticAliases: ["app/layout.ts"],
        requiredExports: ["RootLayout"],
        allowedImports: [],
        required: true,
        category: "frontend-component",
        layer: "frontend",
        domain: "infrastructure",
        status: "required",
      },
      {
        canonicalPath: "app/page.tsx",
        semanticRole: "Next.js Home Page",
        semanticAliases: ["app/index.tsx"],
        requiredExports: ["default"],
        allowedImports: [],
        required: true,
        category: "frontend-page",
        layer: "frontend",
        domain: "infrastructure",
        status: "required",
      },
    );

    // Per-entity app routes
    for (const entity of domain.entities.filter(e => e.kind === "domain")) {
      const entitySlug = entity.name.toLowerCase();
      entries.push({
        canonicalPath: `app/${entitySlug}/page.tsx`,
        semanticRole: `${entity.name} Next.js Page`,
        semanticAliases: [],
        requiredExports: ["default"],
        allowedImports: [],
        required: true,
        category: "frontend-page",
        layer: "frontend",
        domain: entity.name,
        entityName: entity.name,
        status: "required",
      });
    }

    return entries;
  }

  // ── Shared Entries ──────────────────────────────────────────────────────

  private static buildSharedEntries(domain: DomainContract): DynamicFileEntry[] {
    return [
      {
        canonicalPath: "src/types/index.ts",
        semanticRole: "Shared TypeScript Types",
        semanticAliases: ["src/types.ts", "src/interfaces/index.ts", "shared/types.ts"],
        requiredExports: domain.entities.map(e => `${e.name}Type`),
        allowedImports: [],
        required: true,
        category: "frontend-types",
        layer: "shared",
        domain: "infrastructure",
        status: "required",
      },
      {
        canonicalPath: "src/hooks/useAuth.ts",
        semanticRole: "Authentication React Hook",
        semanticAliases: ["src/hooks/auth.ts", "src/hooks/useUser.ts"],
        requiredExports: ["useAuth"],
        allowedImports: ["src/services/api.ts"],
        required: true,
        category: "frontend-hook",
        layer: "frontend",
        domain: "infrastructure",
        featureId: "auth",
        status: "required",
      },
    ];
  }
}

// ─── DynamicFileGraphManager ─────────────────────────────────────────────────

export class DynamicFileGraphManager {
  /**
   * Build, lock, and persist a DynamicFileGraph to .aegis/file-graph.json.
   * Idempotent: reuses if architecture + domain hashes haven't changed.
   */
  public static lock(
    arch: ArchitectureContractV1,
    domain: DomainContract,
    archHash: string,
    outputDirectory: string,
  ): DynamicFileGraph {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    const graphPath = join(aegisDir, "file-graph.json");

    if (existsSync(graphPath)) {
      try {
        const existing = JSON.parse(readFileSync(graphPath, "utf8")) as DynamicFileGraph;
        if (
          existing.contractHashes.architectureHash === archHash &&
          existing.contractHashes.domainHash === domain.domainHash
        ) {
          console.log(`[DynamicFileGraph] 🔒 Reusing locked file graph (${existing.entries.length} files, domain: "${existing.domainName}")`);
          return existing;
        }
        console.log(`[DynamicFileGraph] ⚠️  Contracts changed — regenerating file graph.`);
      } catch { /* recompute */ }
    }

    const graph = DynamicCanonicalFileGraphBuilder.build(arch, domain, archHash);
    writeFileSync(graphPath, JSON.stringify(graph, null, 2), "utf8");

    console.log(`[DynamicFileGraph] 🔒 Built file graph:`);
    console.log(`  Domain:    "${graph.domainName}"`);
    console.log(`  Files:     ${graph.entries.length} entries`);
    console.log(`  Required:  ${graph.entries.filter(e => e.status === "required").length}`);
    console.log(`  Hash:      ${graph.contractHashes.fileGraphHash}`);

    return graph;
  }

  public static load(outputDirectory: string): DynamicFileGraph | null {
    const graphPath = join(outputDirectory, ".aegis", "file-graph.json");
    if (!existsSync(graphPath)) return null;
    try {
      return JSON.parse(readFileSync(graphPath, "utf8")) as DynamicFileGraph;
    } catch {
      return null;
    }
  }

  /**
   * Validate a file graph for consistency:
   * - Every entry has a unique canonicalPath
   * - No duplicate semantic roles within same feature
   * - No domain entity references without contract backing
   */
  public static validate(
    graph: DynamicFileGraph,
    domain: DomainContract,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const seenPaths = new Set<string>();
    const seenRoles = new Map<string, string>();
    const knownEntities = new Set(domain.entities.map(e => e.name));

    for (const entry of graph.entries) {
      // Unique path
      if (seenPaths.has(entry.canonicalPath)) {
        errors.push(`DUPLICATE_PATH: "${entry.canonicalPath}" appears multiple times in graph.`);
      }
      seenPaths.add(entry.canonicalPath);

      // Unique role per feature scope
      const roleKey = `${entry.featureId || "shared"}:${entry.semanticRole}`;
      if (seenRoles.has(roleKey)) {
        errors.push(`DUPLICATE_SEMANTIC_ROLE: "${entry.semanticRole}" already assigned to "${seenRoles.get(roleKey)}" in feature "${entry.featureId || "shared"}".`);
      } else {
        seenRoles.set(roleKey, entry.canonicalPath);
      }

      // Entity references backed by contract
      if (entry.entityName && !knownEntities.has(entry.entityName)) {
        errors.push(`UNKNOWN_ENTITY: File "${entry.canonicalPath}" references entity "${entry.entityName}" not in domain contract.`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
