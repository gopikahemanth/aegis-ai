import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { CanonicalProjectSpecification } from "../spec/canonical-spec.js";
import { ProjectSpecification } from "../architect/specification.js";
import { TechnologyContractBuilder, TechnologyContract } from "./technology-contract.js";
import { DependencyContractManager, DependencyContract } from "./dependency-contract.js";
import { ArchitectureDecisionManager } from "./architecture-decision-record.js";

export type ProvenanceSource = "user" | "default" | "inferred" | "existing_project";

export type ApplicationCategory =
  | "FULLSTACK_WEB_APPLICATION"
  | "SAAS_APPLICATION"
  | "STATIC_SITE"
  | "CLI_APPLICATION"
  | "DESKTOP_APPLICATION"
  | "API_SERVICE"
  | "AI_APPLICATION"
  | "DATA_APPLICATION";

export interface ArchitectureContractV1 {
  version: 1;
  status: "locked";
  prompt?: string;
  applicationType: ApplicationCategory;
  architectureProfile: string;
  source: "user_prompt" | "canonical_spec" | "system_default" | "existing_project";
  confidence: number;
  reason: string;
  userSpecified: boolean;
  inferred: boolean;
  overridden: boolean;
  frontend: {
    framework: string;
    provenance: ProvenanceSource;
  };
  backend: {
    framework: string;
    provenance: ProvenanceSource;
  };
  database: {
    provider: string;
    orm: string;
    provenance: ProvenanceSource;
    ormProvenance: ProvenanceSource;
  };
  language: string;
  styling: string;
  packageManager: "pnpm" | "npm" | "yarn";
  authentication: string;
  runtime?: string;
  apiStyle?: "REST" | "GraphQL" | "tRPC" | "None";
  buildTool?: string;
  testFramework?: string;
  browserTestFramework?: string;
  deploymentTarget?: string;
  storage?: string;
  cache?: string;
  queue?: string;
  realtime?: string;
  aiProvider?: string;
  securityRequirements?: string[];
  requiredLibraries: string[];
  requiredFeatures: string[];
  requiredRoutes: string[];
  requiredModels: string[];
  projectStructure: Record<string, string>;
  architectureHash?: string;
  technologyHash?: string;
  dependencyHash?: string;
}

export class ArchitectureResolver {
  public static resolve(
    userPrompt: string,
    rawSpec?: ProjectSpecification,
    canonicalSpec?: CanonicalProjectSpecification,
    outputDirectory?: string
  ): ArchitectureContractV1 {
    const raw = rawSpec || ({} as ProjectSpecification);
    const canonical = canonicalSpec || ({ lockedStack: {}, features: [], userFlows: [], dataModels: [], inferredLibraries: [] } as unknown as CanonicalProjectSpecification);
    const promptLower = (userPrompt || "").toLowerCase();

    // ── Priority 2: Existing Project Architecture Preservation ────────────────
    // If outputDirectory contains an existing project or locked contract, PRESERVE IT
    if (outputDirectory) {
      const existing = ArchitectureResolver.loadContract(outputDirectory);
      if (existing && existing.status === "locked") {
        const contractPrompt = (existing as any).prompt || "";
        const isIncrementalFeature = promptLower.includes("add ") || promptLower.includes("update ") || promptLower.includes("integrate ") || promptLower.includes("feature");

        // Preserve existing stack if prompts match OR if user is requesting a feature addition to existing project
        if (!contractPrompt || contractPrompt.trim().toLowerCase() === userPrompt.trim().toLowerCase() || isIncrementalFeature) {
          console.log(`[ArchitectureResolver] 🔒 Preserving existing project architecture (DB: ${existing.database.provider}, Frontend: ${existing.frontend.framework}, Backend: ${existing.backend.framework})`);
          return existing;
        } else {
          console.log(`[ArchitectureResolver] ⚠️ New prompt detected — invalidating stale Architecture Contract from previous run.`);
        }
      }

      // Check existing package.json on disk to avoid breaking existing stacks
      const pkgPath = join(outputDirectory, "package.json");
      if (existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
          const hasReact = !!(pkg.dependencies?.react || pkg.devDependencies?.react);
          const hasExpress = !!(pkg.dependencies?.express);
          const hasNext = !!(pkg.dependencies?.next);

          if (hasReact && hasExpress && !promptLower.includes("migrate") && !promptLower.includes("next")) {
            console.log(`[ArchitectureResolver] 📦 Preserving on-disk architecture: React + Express`);
          }
        } catch {}
      }
    }

    // ── Priority 3: Simple Project Rule (Static Site minimalism) ─────────────
    const isStaticRequest =
      (promptLower.includes("static") && (promptLower.includes("landing") || promptLower.includes("page") || promptLower.includes("site") || promptLower.includes("html"))) ||
      (promptLower.includes("simple") && promptLower.includes("landing page") && !promptLower.includes("database") && !promptLower.includes("auth"));

    const isCliRequest = promptLower.includes("cli") || promptLower.includes("command line tool") || promptLower.includes("terminal app");
    const isPythonRequest = promptLower.includes("fastapi") || promptLower.includes("django") || promptLower.includes("python");

    let applicationType: ApplicationCategory = "FULLSTACK_WEB_APPLICATION";
    if (isStaticRequest) applicationType = "STATIC_SITE";
    else if (isCliRequest) applicationType = "CLI_APPLICATION";
    else if (promptLower.includes("api") && !promptLower.includes("ui") && !promptLower.includes("frontend")) applicationType = "API_SERVICE";
    else if (promptLower.includes("saas")) applicationType = "SAAS_APPLICATION";

    // ── Priority 1: FRONTEND resolution ──────────────────────────────────────
    let frontendFramework = isStaticRequest ? "HTML5/Vanilla" : "React-Vite";
    let frontendProvenance: ProvenanceSource = isStaticRequest ? "user" : "default";

    if (promptLower.includes("next.js") || promptLower.includes("nextjs") || promptLower.includes("next 14") || promptLower.includes("next 15")) {
      frontendFramework = "Next.js";
      frontendProvenance = "user";
    } else if (promptLower.includes("vite") || promptLower.includes("react")) {
      frontendFramework = "React-Vite";
      frontendProvenance = "user";
    } else if (promptLower.includes("vue")) {
      frontendFramework = "Vue-Vite";
      frontendProvenance = "user";
    } else if (canonical.lockedStack?.frontend && !canonical.lockedStack.frontend.toLowerCase().includes("next")) {
      frontendFramework = canonical.lockedStack.frontend;
      frontendProvenance = "inferred";
    } else if (raw.frontend && !raw.frontend.toLowerCase().includes("next")) {
      frontendFramework = raw.frontend;
      frontendProvenance = "inferred";
    } else {
      frontendFramework = "React-Vite";
      frontendProvenance = "default";
    }

    // ── Priority 1: BACKEND resolution ───────────────────────────────────────
    let backendFramework = isStaticRequest ? "None" : (isPythonRequest ? "FastAPI" : "Express");
    let backendProvenance: ProvenanceSource = isStaticRequest ? "user" : (isPythonRequest ? "user" : "default");

    if (promptLower.includes("next.js api") || promptLower.includes("next api")) {
      backendFramework = "Next.js API Routes";
      backendProvenance = "user";
    } else if (promptLower.includes("express")) {
      backendFramework = "Express";
      backendProvenance = "user";
    } else if (promptLower.includes("fastify")) {
      backendFramework = "Fastify";
      backendProvenance = "user";
    } else if (promptLower.includes("nestjs") || promptLower.includes("nest.js")) {
      backendFramework = "NestJS";
      backendProvenance = "user";
    } else if (promptLower.includes("fastapi")) {
      backendFramework = "FastAPI";
      backendProvenance = "user";
    } else if (canonical.lockedStack?.backend && !canonical.lockedStack.backend.toLowerCase().includes("next")) {
      backendFramework = canonical.lockedStack.backend;
      backendProvenance = "inferred";
    } else if (raw.backend && !raw.backend.toLowerCase().includes("next")) {
      backendFramework = raw.backend;
      backendProvenance = "inferred";
    }

    // Stack alignment: React-Vite requires Express backend
    if (frontendFramework.toLowerCase().includes("vite") || frontendFramework.toLowerCase().includes("react")) {
      if (backendFramework.toLowerCase().includes("next")) {
        backendFramework = "Express";
        backendProvenance = "default";
      }
    }

    // ── Priority 1: DATABASE resolution ─────────────────────────────────────
    let dbProvider = isStaticRequest ? "None" : "PostgreSQL";
    let dbProvenance: ProvenanceSource = isStaticRequest ? "user" : "default";

    if (promptLower.includes("postgres") || promptLower.includes("postgresql")) {
      dbProvider = "PostgreSQL";
      dbProvenance = "user";
    } else if (promptLower.includes("mongodb") || promptLower.includes("mongo")) {
      dbProvider = "MongoDB";
      dbProvenance = "user";
    } else if (promptLower.includes("sqlite")) {
      dbProvider = "SQLite";
      dbProvenance = "user";
    } else if (promptLower.includes("mysql")) {
      dbProvider = "MySQL";
      dbProvenance = "user";
    } else if (promptLower.includes("no database") || promptLower.includes("without database")) {
      dbProvider = "None";
      dbProvenance = "user";
    }

    // ── Priority 1: ORM resolution ──────────────────────────────────────────
    let orm = (isStaticRequest || dbProvider === "None") ? "None" : "Prisma";
    let ormProvenance: ProvenanceSource = (isStaticRequest || dbProvider === "None") ? "user" : "default";

    if (dbProvider !== "None") {
      if (promptLower.includes("drizzle")) {
        orm = "Drizzle";
        ormProvenance = "user";
      } else if (promptLower.includes("mongoose")) {
        orm = "Mongoose";
        ormProvenance = "user";
      } else if (promptLower.includes("prisma")) {
        orm = "Prisma";
        ormProvenance = "user";
      } else if (promptLower.includes("typeorm")) {
        orm = "TypeORM";
        ormProvenance = "user";
      }

      // ORM compatibility enforcement
      if (orm === "Mongoose" && dbProvider !== "MongoDB") {
        console.warn(`[ArchitectureResolver] ⚠️ ORM conflict: "Mongoose" requires MongoDB. Overriding ORM to "Prisma".`);
        orm = "Prisma";
        ormProvenance = "inferred";
      }
    }

    // ── AUTH resolution ─────────────────────────────────────────────────────
    let auth = isStaticRequest ? "None" : (canonical.lockedStack?.auth || raw.auth || "JWT");
    if (promptLower.includes("nextauth") || promptLower.includes("next-auth")) auth = "NextAuth.js";
    else if (promptLower.includes("jwt")) auth = "JWT";
    else if (promptLower.includes("no auth") || promptLower.includes("without auth")) auth = "None";

    const hasUserInput = frontendProvenance === "user" || backendProvenance === "user" || dbProvenance === "user";

    // ── Build Technology & Dependency Contracts ─────────────────────────────
    const techContract = TechnologyContractBuilder.build(applicationType, {
      frontend: frontendFramework,
      backend: backendFramework,
      database: dbProvider,
      orm,
      auth,
      language: canonical.lockedStack?.language || raw.language || (isPythonRequest ? "Python" : "TypeScript"),
      styling: canonical.lockedStack?.styling || raw.styling || "TailwindCSS",
      packageManager: canonical.lockedStack?.packageManager || raw.packageManager || "pnpm",
    }, { userSpecified: hasUserInput });

    const depContract = DependencyContractManager.build(techContract, techContract.technologies.find(t => t.category === "packageManager")?.name as any || "pnpm");

    // ── Compute Architecture Hash ───────────────────────────────────────────
    const archPayload = {
      frontend: { framework: frontendFramework },
      backend: { framework: backendFramework },
      database: { provider: dbProvider, orm },
      language: techContract.technologies.find(t => t.category === "language")?.name || "TypeScript",
      packageManager: depContract.packageManager,
      auth,
    };
    const architectureHash = createHash("sha256").update(JSON.stringify(archPayload)).digest("hex").slice(0, 12);

    // ── Route & Entity Extraction from User Prompt ──────────────────────────
    const explicitRoutes: string[] = [];
    const routeBlockMatch = userPrompt.match(/(?:Canonical routes|Required pages\/routes|Required routes|Pages\/routes|Canonical pages|Routes|Pages):\s*([\s\S]*?)(?:\n\n|\n[A-Z\s]{3,}:|$)/i);
    if (routeBlockMatch && routeBlockMatch[1]) {
      const tokens = routeBlockMatch[1].split(/[\s,\t\r\n]+/).map(t => t.trim().replace(/^[-*•\d.]+\s*/, "")).filter(Boolean);
      for (const token of tokens) {
        if (token.startsWith("/") && token.length > 1 && !token.includes(":") && !token.includes(".")) {
          const clean = token.toLowerCase();
          if (!explicitRoutes.includes(clean)) explicitRoutes.push(clean);
        } else if (/^[a-z0-9_-]+$/i.test(token) && !["none", "n/a", "etc", "core", "entities", "functional", "requirements"].includes(token.toLowerCase())) {
          const clean = `/${token.toLowerCase()}`;
          if (!explicitRoutes.includes(clean)) explicitRoutes.push(clean);
        }
      }
    }

    const explicitModels: string[] = [];
    const modelBlockMatch = userPrompt.match(/(?:Core entities|Required entities|Entities|Models|Required models|Core models):\s*([\s\S]*?)(?:\n\n|\n[A-Z\s]{3,}:|$)/i);
    if (modelBlockMatch && modelBlockMatch[1]) {
      const items = modelBlockMatch[1].split(/[,\n]/).map(m => m.trim().replace(/^[-*•\d.]+\s*/, "")).filter(Boolean);
      for (const item of items) {
        const nameOnly = item.split(/[(\s:]/)[0].trim().replace(/[^a-zA-Z0-9]/g, "");
        if (nameOnly && nameOnly.length > 1 && !["none", "na", "user", "etc", "functional", "requirements"].includes(nameOnly.toLowerCase()) && !explicitModels.includes(nameOnly)) {
          explicitModels.push(nameOnly);
        }
      }
    }

    // Natural Language Entity Extraction from prose prompts (e.g. "manage vessels, expeditions, scientists, ...")
    if (explicitModels.length === 0) {
      const manageMatch = userPrompt.match(/(?:manage|manages|track|tracking|monitor|handling|coordinates|supporting)\s+([a-zA-Z0-9_,\s]+?)(?:\.|\n|The dashboard|Create appropriate|with persistent|Do not)/i);
      if (manageMatch && manageMatch[1]) {
        const words = manageMatch[1].split(/,| and |\s+and\s+/).map(w => w.trim()).filter(Boolean);
        for (const w of words) {
          const clean = w.replace(/^(research|oceanographic|scientific|active|live|stage|court|trial|guest)\s+/i, "").trim();
          const singular = clean.endsWith("ies") ? clean.slice(0, -3) + "y" : clean.replace(/s$/, "");
          const pascal = singular.split(/[\s_-]+/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
          if (pascal && pascal.length > 2 && !["User", "Record", "Item", "None", "System", "Operation", "Platform"].includes(pascal) && !explicitModels.includes(pascal)) {
            explicitModels.push(pascal);
          }
        }
      }
    }

    // Derive canonical routes from extracted models if explicit routes not provided
    if (explicitRoutes.length === 0 && explicitModels.length > 0) {
      explicitRoutes.push("/");
      for (const m of explicitModels) {
        const plural = toModelPlural(m);
        const slug = plural.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
        if (!explicitRoutes.includes(`/${slug}`)) {
          explicitRoutes.push(`/${slug}`);
        }
      }
    }

    let resolvedRoutes = explicitRoutes.length > 0
      ? explicitRoutes
      : (canonical.userFlows && canonical.userFlows.length > 0
        ? ["/", ...canonical.userFlows.map(f => f.startsWith("/") ? f : `/${f.replace(/^(manage|browse|track|view|handle|create|fulfill)-?/i, "").toLowerCase()}`)]
        : (raw.userFlows && raw.userFlows.length > 0
          ? ["/", ...raw.userFlows.map(f => f.startsWith("/") ? f : `/${f.replace(/^(manage|browse|track|view|handle|create|fulfill)-?/i, "").toLowerCase()}`)]
          : (isStaticRequest ? ["/"] : ["/", "/dashboard"])));
    resolvedRoutes = Array.from(new Set(resolvedRoutes));

    let resolvedModels = explicitModels.length > 0
      ? ["User", ...explicitModels]
      : (dbProvider === "None" ? [] : (canonical.dataModels || raw.dataModels || ["User"]));
    resolvedModels = Array.from(new Set(resolvedModels));

    const resolvedFeatures = canonical.features || raw.features || (explicitModels.length > 0
      ? explicitModels.map(m => {
          const plural = toModelPlural(m);
          return plural.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
        })
      : []);

    const contract: ArchitectureContractV1 = Object.freeze({
      version: 1,
      status: "locked",
      prompt: userPrompt,
      applicationType,
      architectureProfile: techContract.architectureProfile,
      source: hasUserInput ? "user_prompt" : "canonical_spec",
      confidence: (frontendProvenance === "user" && backendProvenance === "user") ? 1.0 : 0.85,
      reason: `Contract locked by ArchitectureResolver. Frontend(${frontendProvenance}), Backend(${backendProvenance}), DB(${dbProvenance}), ORM(${ormProvenance})`,
      userSpecified: hasUserInput,
      inferred: !hasUserInput,
      overridden: false,
      frontend: Object.freeze({
        framework: frontendFramework,
        provenance: frontendProvenance,
      }),
      backend: Object.freeze({
        framework: backendFramework,
        provenance: backendProvenance,
      }),
      database: Object.freeze({
        provider: dbProvider,
        orm,
        provenance: dbProvenance,
        ormProvenance,
      }),
      language: techContract.technologies.find(t => t.category === "language")?.name || "TypeScript",
      styling: techContract.technologies.find(t => t.category === "styling")?.name || "TailwindCSS",
      packageManager: depContract.packageManager,
      authentication: auth,
      runtime: "Node.js",
      apiStyle: backendFramework === "None" ? "None" : "REST",
      buildTool: frontendFramework.includes("Next") ? "Next.js" : (isStaticRequest ? "Vite" : "Vite"),
      testFramework: "Vitest",
      browserTestFramework: isStaticRequest ? "None" : "Puppeteer",
      deploymentTarget: "Docker",
      storage: "Local",
      cache: "In-Memory",
      queue: "None",
      realtime: "None",
      aiProvider: promptLower.includes("openai") ? "OpenAI" : "Gemini",
      securityRequirements: [
        "Server/Client Boundary Enforcement",
        "Secret Token Masking",
        "Input Sanitization",
      ],
      requiredLibraries: canonical.inferredLibraries || raw.inferredLibraries || [],
      requiredFeatures: resolvedFeatures,
      requiredRoutes: resolvedRoutes,
      requiredModels: resolvedModels,
      projectStructure: Object.freeze({
        src: "Frontend presentation layer",
        server: "Backend API and database services",
        prisma: "Database schemas and migrations",
      }),
      architectureHash,
      technologyHash: techContract.technologyHash,
      dependencyHash: depContract.dependencyHash,
    });

    if (outputDirectory) {
      ArchitectureDecisionManager.createRecord(contract, outputDirectory);
    }

    return contract;
  }

  public static writeContract(outputDirectory: string, contract: ArchitectureContractV1): void {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    writeFileSync(join(aegisDir, "architecture-contract.json"), JSON.stringify(contract, null, 2), "utf8");
    ArchitectureDecisionManager.createRecord(contract, outputDirectory);

    console.log(
      `[ArchitectureResolver] 🔒 Locked Architecture Contract (${contract.architectureProfile}):\n` +
      `  Application: ${contract.applicationType}\n` +
      `  Frontend:    ${contract.frontend.framework} [${contract.frontend.provenance}]\n` +
      `  Backend:     ${contract.backend.framework} [${contract.backend.provenance}]\n` +
      `  Database:    ${contract.database.provider} [${contract.database.provenance}]\n` +
      `  ORM:         ${contract.database.orm} [${contract.database.ormProvenance}]\n` +
      `  Auth:        ${contract.authentication}\n` +
      `  Hashes:      Arch[${contract.architectureHash}] Tech[${contract.technologyHash}] Dep[${contract.dependencyHash}]`
    );
  }

  public static loadContract(outputDirectory: string): ArchitectureContractV1 | null {
    const contractPath = join(outputDirectory, ".aegis", "architecture-contract.json");
    if (!existsSync(contractPath)) return null;
    try {
      return JSON.parse(readFileSync(contractPath, "utf8"));
    } catch {
      return null;
    }
  }
}

export function toModelPlural(name: string): string {
  const lower = name.toLowerCase();
  const uncountables = ["equipment", "information", "analytics", "telemetry", "research", "feedback", "software", "hardware", "inventory", "staff", "personnel"];
  if (uncountables.includes(lower)) return name;
  if (name.endsWith("y") && !name.endsWith("ey")) return `${name.slice(0, -1)}ies`;
  if (name.endsWith("s") || name.endsWith("sh") || name.endsWith("ch") || name.endsWith("x") || name.endsWith("z")) return `${name}es`;
  return `${name}s`;
}
