/**
 * Aegis AI — Stack Selection Intelligence Engine
 *
 * Implements authoritative technology and stack resolution across the 3 situations:
 * - Situation A: User explicitly names a stack (MERN, Django, LAMP, T3, etc.)
 * - Situation B: User specifies individual technologies (e.g. "Angular + Java Spring + PostgreSQL")
 * - Situation C: User gives no technology preference -> Autonomous domain-driven evaluation
 *
 * Also determines the authoritative Application Build Level:
 * - Level 1: pure_frontend
 * - Level 2: frontend_api_integration
 * - Level 3: full_stack
 */

import { NamedStackRegistry, type NamedStackDefinition } from "./named-stack-registry.js";
import { TechnologyCapabilityRegistry } from "./technology-capability-registry.js";

export type ApplicationBuildLevel = "pure_frontend" | "frontend_api_integration" | "full_stack";

export interface ResolvedTechnologyArchitectureContract {
  version: "1.0.0";
  buildLevel: ApplicationBuildLevel;
  selectionMode: "USER_NAMED_STACK" | "USER_EXPLICIT_TECH" | "AUTONOMOUS_REQUIREMENT_DRIVEN";
  namedStack?: string;
  frontend: {
    language: string;
    framework: string;
    version: string;
    renderingStrategy: "CSR" | "SSR" | "SSG" | "ISR" | "Static";
    styling: string;
    componentLibrary?: string;
    templateSystem: string;
    buildTool: string;
    stateManagement: string;
    port: number;
  };
  backend: {
    language: string;
    framework: string;
    version?: string;
    runtime: string;
    apiArchitecture: "REST" | "GraphQL" | "tRPC" | "WebSocket" | "none";
    port: number;
    corsOrigin: string;
  };
  database: {
    engine: "postgresql" | "sqlite" | "mongodb" | "mysql" | "supabase" | "firebase" | "none";
    orm: "prisma" | "django_orm" | "hibernate" | "ef_core" | "eloquent" | "mongoose" | "none";
    persistenceRequired: boolean;
  };
  toolchain: {
    packageManager: "pnpm" | "npm" | "yarn" | "pip" | "maven" | "dotnet" | "cargo" | "composer" | "go";
    buildCommand: string;
    devCommand: string;
    testCommand: string;
  };
  adapterId: string;
  rationale: string;
  compatibilityAudit: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export class StackSelectionIntelligence {
  public static resolveStack(
    promptOrOptions:
      | string
      | {
          prompt: string;
          explicitPreferences?: {
            stack?: string;
            frontendFramework?: string;
            backendFramework?: string;
            language?: string;
            database?: string;
            styling?: string;
            buildLevel?: ApplicationBuildLevel;
          };
        }
  ): ResolvedTechnologyArchitectureContract {
    const options = typeof promptOrOptions === "string" ? { prompt: promptOrOptions } : promptOrOptions;
    return this.resolveArchitecture(options);
  }

  /**
   * Evaluates prompt and user specifications to produce a validated architecture contract.
   */
  public static resolveArchitecture(options: {
    prompt: string;
    explicitPreferences?: {
      stack?: string;
      frontendFramework?: string;
      backendFramework?: string;
      language?: string;
      database?: string;
      styling?: string;
      buildLevel?: ApplicationBuildLevel;
    };
  }): ResolvedTechnologyArchitectureContract {
    const { prompt, explicitPreferences } = options;
    const lowerPrompt = prompt.toLowerCase();

    // ── 1. Determine Application Build Level ──
    let buildLevel: ApplicationBuildLevel = explicitPreferences?.buildLevel || "full_stack";
    if (!explicitPreferences?.buildLevel) {
      if (
        /pure frontend|frontend only|static site|landing page|portfolio|marketing site|brochure|showcase|calculator|interactive prototype|html\/css only|clean landing page|purely in html/i.test(
          lowerPrompt
        ) ||
        (/with no backend|without backend|no server|static only/i.test(lowerPrompt) &&
         !/api server|microservice|crud|postgres|mongodb|fastapi|django|spring/i.test(lowerPrompt))
      ) {
        buildLevel = "pure_frontend";
      } else if (
        /connect to existing api|consume external api|shopify api|shopify|headless cms|headless|supabase backend|supabase|firebase backend|firebase|existing django api|existing spring api/i.test(
          lowerPrompt
        )
      ) {
        buildLevel = "frontend_api_integration";
      } else {
        buildLevel = "full_stack";
      }
    }

    // ── 2. Situation A: Check for Explicit Named Stack First ──
    // If user says "MEAN stack", "MERN stack", "Django stack", "Django fullstack", prioritize the named stack.
    const requestedStackKey = explicitPreferences?.stack || this.extractNamedStackFromPrompt(lowerPrompt);
    // If user specifies multiple distinct individual technologies (e.g. "Vue" AND "FastAPI"), route to Situation B
    const explicitTech = this.extractExplicitTechnologies(lowerPrompt, explicitPreferences);
    const hasMultipleDisparateTechnologies = Boolean(
      (explicitTech.frontendFramework && explicitTech.backendFramework) ||
      (explicitTech.frontendFramework && explicitTech.database) ||
      (explicitTech.backendFramework && explicitTech.database)
    );

    if (requestedStackKey && (!hasMultipleDisparateTechnologies || /\bstack\b/i.test(lowerPrompt))) {
      const namedStack = NamedStackRegistry.get(requestedStackKey);
      if (namedStack) {
        return this.synthesizeFromNamedStack(namedStack, buildLevel, `User explicitly requested the ${namedStack.name}.`);
      }
    }

    // ── 3. Situation B: User specifies individual technologies ──
    if (explicitTech.isExplicit) {
      return this.synthesizeFromExplicitTechnologies(explicitTech, buildLevel, prompt);
    }

    // ── 4. Situation C: Autonomous Domain-Driven Selection ──
    return this.synthesizeAutonomousSelection(lowerPrompt, buildLevel);
  }

  private static extractNamedStackFromPrompt(lowerPrompt: string): string | undefined {
    const stackKeys = [
      "mern",
      "mean",
      "mevn",
      "pern",
      "lamp",
      "lemp",
      "jamstack",
      "t3",
      "django",
      "fastapi",
      "laravel",
      "spring boot",
      "spring",
      "asp.net",
      ".net",
      "rails",
      "go+htmx",
      "go-htmx",
      "supabase",
      "firebase",
      "headless cms",
      "shopify",
    ];

    for (const key of stackKeys) {
      const regex = new RegExp(`\\b${key.replace("+", "\\+")}\\b`, "i");
      if (regex.test(lowerPrompt)) {
        return key;
      }
    }
    return undefined;
  }

  private static extractExplicitTechnologies(
    lowerPrompt: string,
    explicitPreferences?: any
  ): {
    isExplicit: boolean;
    frontendFramework?: string;
    backendFramework?: string;
    language?: string;
    database?: string;
    styling?: string;
  } {
    let isExplicit = false;
    let frontendFramework = explicitPreferences?.frontendFramework;
    let backendFramework = explicitPreferences?.backendFramework;
    let language = explicitPreferences?.language;
    let database = explicitPreferences?.database;
    let styling = explicitPreferences?.styling;

    if (frontendFramework || backendFramework || language || database) {
      isExplicit = true;
    }

    // Scan prompt for frontend frameworks
    if (!frontendFramework) {
      if (/\bangular\b/i.test(lowerPrompt)) { frontendFramework = "angular"; isExplicit = true; }
      else if (/\bvue(\.js|\s*3)?\b/i.test(lowerPrompt)) { frontendFramework = "vue"; isExplicit = true; }
      else if (/\bsvelte(kit)?\b/i.test(lowerPrompt)) { frontendFramework = "svelte"; isExplicit = true; }
      else if (/\bnext(\.js|js)?\b/i.test(lowerPrompt)) { frontendFramework = "nextjs"; isExplicit = true; }
      else if (/\bastro\b/i.test(lowerPrompt)) { frontendFramework = "astro"; isExplicit = true; }
      else if (/\bhtmx\b/i.test(lowerPrompt)) { frontendFramework = "htmx"; isExplicit = true; }
      else if (/\bvanilla html|pure html|plain html|purely in html|html and css\b/i.test(lowerPrompt)) { frontendFramework = "vanilla"; isExplicit = true; }
      else if (/\breact\b/i.test(lowerPrompt)) { frontendFramework = "react"; isExplicit = true; }
    }

    // Scan prompt for backend frameworks
    if (!backendFramework) {
      if (/\bdjango\b/i.test(lowerPrompt)) { backendFramework = "django"; isExplicit = true; }
      else if (/\bfastapi\b/i.test(lowerPrompt)) { backendFramework = "fastapi"; isExplicit = true; }
      else if (/\blaravel\b/i.test(lowerPrompt)) { backendFramework = "laravel"; isExplicit = true; }
      else if (/\bspring(\s*boot)?\b/i.test(lowerPrompt)) { backendFramework = "spring-boot"; isExplicit = true; }
      else if (/\basp\.net|\.net\s*core\b/i.test(lowerPrompt)) { backendFramework = "aspnet_core"; isExplicit = true; }
      else if (/\bexpress(\.js)?\b/i.test(lowerPrompt)) { backendFramework = "express"; isExplicit = true; }
      else if (/\bgo(lang)?\b/i.test(lowerPrompt) && /\bapi|backend|server\b/i.test(lowerPrompt)) { backendFramework = "go"; isExplicit = true; }
    }

    // Scan database
    if (!database) {
      if (/\bpostgresql|postgres\b/i.test(lowerPrompt)) { database = "postgresql"; isExplicit = true; }
      else if (/\bmongodb|mongo\b/i.test(lowerPrompt)) { database = "mongodb"; isExplicit = true; }
      else if (/\bmysql\b/i.test(lowerPrompt)) { database = "mysql"; isExplicit = true; }
      else if (/\bsqlite\b/i.test(lowerPrompt)) { database = "sqlite"; isExplicit = true; }
    }

    return { isExplicit, frontendFramework, backendFramework, language, database, styling };
  }

  private static synthesizeFromNamedStack(
    stack: NamedStackDefinition,
    buildLevel: ApplicationBuildLevel,
    rationale: string
  ): ResolvedTechnologyArchitectureContract {
    const isPureFrontend = buildLevel === "pure_frontend";
    const isApiIntegration = buildLevel === "frontend_api_integration";

    return {
      version: "1.0.0",
      buildLevel,
      selectionMode: "USER_NAMED_STACK",
      namedStack: stack.name,
      frontend: {
        language: stack.frontend.language,
        framework: stack.frontend.framework,
        version: "latest",
        renderingStrategy: stack.frontend.framework === "nextjs" ? "SSR" : isPureFrontend ? "Static" : "CSR",
        styling: stack.frontend.styling,
        templateSystem: stack.frontend.framework === "vue" ? "Vue SFC" : stack.frontend.framework === "svelte" ? "Svelte" : "TSX",
        buildTool: stack.frontend.buildTool,
        stateManagement: stack.frontend.framework === "vue" ? "pinia" : "context",
        port: 5173,
      },
      backend: {
        language: isPureFrontend ? "none" : stack.backend.language,
        framework: isPureFrontend ? "none" : stack.backend.framework,
        runtime: isPureFrontend ? "none" : stack.backend.runtime,
        apiArchitecture: isPureFrontend ? "none" : stack.backend.apiType,
        port: 3001,
        corsOrigin: "http://localhost:5173",
      },
      database: {
        engine: (isPureFrontend || isApiIntegration) ? "none" : stack.database.engine,
        orm: (isPureFrontend || isApiIntegration) ? "none" : stack.database.orm,
        persistenceRequired: !isPureFrontend && !isApiIntegration && stack.database.engine !== "none",
      },
      toolchain: {
        packageManager: stack.backend.language === "Python" ? "pip" : stack.backend.language === "Java" ? "maven" : "pnpm",
        buildCommand: isPureFrontend ? "npm run build" : "npm run build",
        devCommand: isPureFrontend ? "npm run dev" : "npm run dev",
        testCommand: "npm test",
      },
      adapterId: `adapter_${stack.frontend.framework}`,
      rationale,
      compatibilityAudit: {
        valid: true,
        errors: [],
        warnings: [],
      },
    };
  }

  private static synthesizeFromExplicitTechnologies(
    tech: any,
    buildLevel: ApplicationBuildLevel,
    prompt: string
  ): ResolvedTechnologyArchitectureContract {
    const isPureFrontend = buildLevel === "pure_frontend";
    const isApiIntegration = buildLevel === "frontend_api_integration";

    const fw = tech.frontendFramework || "react";
    const be = isPureFrontend || isApiIntegration ? "none" : (tech.backendFramework || "node_express");
    const db = isPureFrontend || isApiIntegration ? "none" : (tech.database || "sqlite");

    let beLang = "TypeScript";
    let runtime = "node";
    let orm: any = "prisma";
    let pm: any = "pnpm";

    if (be === "python_django" || be === "django") {
      beLang = "Python";
      runtime = "python";
      orm = "django_orm";
      pm = "pip";
    } else if (be === "python_fastapi" || be === "fastapi") {
      beLang = "Python";
      runtime = "python";
      orm = "none";
      pm = "pip";
    } else if (be === "java_spring_boot" || be === "spring-boot" || be === "spring") {
      beLang = "Java";
      runtime = "jvm";
      orm = "hibernate";
      pm = "maven";
    } else if (be === "dotnet_aspnet" || be === "dotnet") {
      beLang = "C#";
      runtime = "dotnet";
      orm = "ef_core";
      pm = "dotnet";
    } else if (be === "php_laravel" || be === "laravel") {
      beLang = "PHP";
      runtime = "php";
      orm = "eloquent";
      pm = "composer";
    } else if (be === "go_standard" || be === "go") {
      beLang = "Go";
      runtime = "go";
      orm = "none";
      pm = "go";
    }

    return {
      version: "1.0.0",
      buildLevel,
      selectionMode: "USER_EXPLICIT_TECH",
      frontend: {
        language: (fw === "html5" || fw === "vanilla") ? "HTML" : "TypeScript",
        framework: fw,
        version: "latest",
        renderingStrategy: fw === "nextjs" ? "SSR" : buildLevel === "pure_frontend" ? "Static" : "CSR",
        styling: tech.styling || "tailwind",
        templateSystem: fw === "vue" ? "Vue SFC" : fw === "svelte" ? "Svelte" : (fw === "html5" || fw === "vanilla") ? "HTML" : "TSX",
        buildTool: (fw === "html5" || fw === "vanilla") ? "none" : "vite",
        stateManagement: fw === "angular" ? "signals" : fw === "vue" ? "pinia" : "context",
        port: 5173,
      },
      backend: {
        language: buildLevel === "pure_frontend" ? "none" : beLang,
        framework: buildLevel === "pure_frontend" ? "none" : be,
        runtime: buildLevel === "pure_frontend" ? "none" : runtime,
        apiArchitecture: buildLevel === "pure_frontend" ? "none" : "REST",
        port: 3001,
        corsOrigin: "http://localhost:5173",
      },
      database: {
        engine: buildLevel === "pure_frontend" ? "none" : db,
        orm: buildLevel === "pure_frontend" ? "none" : orm,
        persistenceRequired: buildLevel === "full_stack" && db !== "none",
      },
      toolchain: {
        packageManager: pm,
        buildCommand: "npm run build",
        devCommand: "npm run dev",
        testCommand: "npm test",
      },
      adapterId: `adapter_${fw}`,
      rationale: `Locked user-specified architecture (${fw} frontend with ${be} backend and ${db} database).`,
      compatibilityAudit: {
        valid: true,
        errors: [],
        warnings: [],
      },
    };
  }

  private static synthesizeAutonomousSelection(
    lowerPrompt: string,
    buildLevel: ApplicationBuildLevel
  ): ResolvedTechnologyArchitectureContract {
    // Autonomous evaluation based on product domain requirements:
    // 1. Content/Editorial/SEO-driven (portfolio, blog, magazine, docs) -> Astro or Next.js / Static
    // 2. High-performance hypermedia or simple tools -> HTMX or HTML/Tailwind
    // 3. Enterprise/Data-intensive operations -> React + Vite or Angular + Express/Postgres
    let fw = "react";
    let styling = "tailwind";
    let rationale = "";

    if (buildLevel === "pure_frontend" || buildLevel === "frontend_api_integration") {
      if (/monograph|photo|minimal|poetry|editorial|literature/i.test(lowerPrompt)) {
        fw = "html5";
        rationale = "Selected semantic HTML5 + CSS/Tailwind for lightweight, high-performance static editorial presentation.";
      } else if (/content|publication|magazine|blog|docs/i.test(lowerPrompt)) {
        fw = "astro";
        rationale = "Selected Astro for content-first, zero-JS by default static publishing with optimal SEO.";
      } else {
        fw = "react";
        rationale = buildLevel === "frontend_api_integration"
          ? "Selected React + Vite frontend optimized for external headless/API consumption with zero local backend overhead."
          : "Selected React + Vite client-side SPA for dynamic client state and interactive components.";
      }

      return {
        version: "1.0.0",
        buildLevel,
        selectionMode: "AUTONOMOUS_REQUIREMENT_DRIVEN",
        frontend: {
          language: fw === "html5" ? "HTML" : "TypeScript",
          framework: fw,
          version: "latest",
          renderingStrategy: "Static",
          styling,
          templateSystem: fw === "html5" ? "HTML" : "TSX",
          buildTool: fw === "html5" ? "none" : "vite",
          stateManagement: "none",
          port: 5173,
        },
        backend: {
          language: "none",
          framework: "none",
          runtime: buildLevel === "frontend_api_integration" ? "external_api" : "none",
          apiArchitecture: buildLevel === "frontend_api_integration" ? "REST" : "none",
          port: 0,
          corsOrigin: "",
        },
        database: {
          engine: "none",
          orm: "none",
          persistenceRequired: false,
        },
        toolchain: {
          packageManager: "pnpm",
          buildCommand: "npm run build",
          devCommand: "npm run dev",
          testCommand: "npm test",
        },
        adapterId: `adapter_${fw}`,
        rationale,
        compatibilityAudit: { valid: true, errors: [], warnings: [] },
      };
    }

    // Default Full-Stack Autonomous Recommendation
    if (/enterprise|governance|compliance|banking|financial|audit log/i.test(lowerPrompt)) {
      rationale = "Selected PostgreSQL relational persistence with TypeScript Node/Express and React for strict transactional integrity and enterprise audit compliance.";
      return {
        version: "1.0.0",
        buildLevel: "full_stack",
        selectionMode: "AUTONOMOUS_REQUIREMENT_DRIVEN",
        frontend: {
          language: "TypeScript",
          framework: "react",
          version: "latest",
          renderingStrategy: "CSR",
          styling: "tailwind",
          templateSystem: "TSX",
          buildTool: "vite",
          stateManagement: "context",
          port: 5173,
        },
        backend: {
          language: "TypeScript",
          framework: "node_express",
          runtime: "node",
          apiArchitecture: "REST",
          port: 3001,
          corsOrigin: "http://localhost:5173",
        },
        database: {
          engine: "postgresql",
          orm: "prisma",
          persistenceRequired: true,
        },
        toolchain: {
          packageManager: "pnpm",
          buildCommand: "npm run build",
          devCommand: "npm run dev",
          testCommand: "vitest run",
        },
        adapterId: "adapter_react",
        rationale,
        compatibilityAudit: { valid: true, errors: [], warnings: [] },
      };
    }

    // Standard autonomous balanced full-stack
    rationale = "Selected React + Vite frontend with Express REST API and SQLite/Prisma for agile local development and rapid full-stack execution.";
    return {
      version: "1.0.0",
      buildLevel: "full_stack",
      selectionMode: "AUTONOMOUS_REQUIREMENT_DRIVEN",
      frontend: {
        language: "TypeScript",
        framework: "react",
        version: "latest",
        renderingStrategy: "CSR",
        styling: "tailwind",
        templateSystem: "TSX",
        buildTool: "vite",
        stateManagement: "context",
        port: 5173,
      },
      backend: {
        language: "TypeScript",
        framework: "node_express",
        runtime: "node",
        apiArchitecture: "REST",
        port: 3001,
        corsOrigin: "http://localhost:5173",
      },
      database: {
        engine: "sqlite",
        orm: "prisma",
        persistenceRequired: true,
      },
      toolchain: {
        packageManager: "pnpm",
        buildCommand: "npm run build",
        devCommand: "npm run dev",
        testCommand: "vitest run",
      },
      adapterId: "adapter_react",
      rationale,
      compatibilityAudit: { valid: true, errors: [], warnings: [] },
    };
  }
}
