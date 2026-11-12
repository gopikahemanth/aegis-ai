import type { AIProvider } from "../providers/base.js";
import type { ProjectSpecification } from "./specification.js";
import { PromptManager } from "../prompts/prompt-manager.js";

export class SpecificationGenerator {
  private readonly promptManager = new PromptManager();

  constructor(
    private readonly provider: AIProvider,
  ) {}

  async generate(
    request: string,
    image?: { mimeType: string; data: string }
  ): Promise<ProjectSpecification> {

    const response =
      await this.provider.chat([
        {
          role: "system",
          content: this.promptManager.getSpecificationPrompt(),
        },
        {
          role: "user",
          content: request,
        },
      ], { agentType: "architect", image });


    const startIdx = response.indexOf("{");
    const endIdx = response.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      throw new Error(`Invalid JSON specification response: ${response}`);
    }
    const cleaned = response.substring(startIdx, endIdx + 1);
    const spec = JSON.parse(cleaned) as ProjectSpecification;

    // ── General-Purpose Stack Resolution ────────────────────────────────────
    // Trust the AI specification. Apply overrides ONLY when the user explicitly
    // specifies a conflicting technology in the prompt, or when a critical field
    // is missing and must be defaulted to something functional.
    const reqLower = request.toLowerCase();

    // Database: only override if the AI left it null/undefined
    if (!spec.database) {
      if (reqLower.includes("sqlite") || reqLower.includes("sqlite3")) {
        spec.database = "SQLite";
      } else if (reqLower.includes("mysql") || reqLower.includes("mariadb")) {
        spec.database = "MySQL";
      } else if (reqLower.includes("mongo")) {
        spec.database = "MongoDB";
      } else if (reqLower.includes("postgres")) {
        spec.database = "PostgreSQL";
      } else if (spec.type === "website" || spec.type === "frontend") {
        // Static/frontend-only sites don't need a database
        spec.database = undefined;
      } else {
        // Fullstack default: SQLite for portability in development
        spec.database = "SQLite";
      }
    } else if (reqLower.includes("sqlite") && !spec.database.toLowerCase().includes("sqlite")) {
      // User explicitly asked for SQLite but AI chose something else
      spec.database = "SQLite";
    } else if ((reqLower.includes("postgres") || reqLower.includes("postgresql")) && !spec.database.toLowerCase().includes("postgres")) {
      spec.database = "PostgreSQL";
    } else if (!reqLower.includes("postgres") && !reqLower.includes("postgresql") && !reqLower.includes("mysql") && !reqLower.includes("mongo")) {
      // Unless explicitly requested otherwise, default to SQLite so contract, schema, and runtime are unified
      spec.database = "SQLite";
    }

    // Backend: only override if the AI left it null/undefined and the project type needs one
    const needsBackend = spec.type === "fullstack" || spec.type === "saas" || spec.type === "app" || spec.type === "api" || spec.type === "backend";
    if (!spec.backend && needsBackend) {
      if (reqLower.includes("fastify")) {
        spec.backend = "Fastify";
      } else if (reqLower.includes("nestjs") || reqLower.includes("nest.js")) {
        spec.backend = "NestJS";
      } else if (reqLower.includes("express")) {
        spec.backend = "Express";
      } else if (reqLower.includes("next") || reqLower.includes("nextjs") || reqLower.includes("next.js")) {
        spec.backend = "Next.js";
      } else {
        // Default backend for fullstack apps
        spec.backend = "Express";
      }
    } else if (spec.backend && reqLower.includes("express") && !spec.backend.toLowerCase().includes("express")) {
      // User explicitly asked for Express but AI chose something else
      spec.backend = "Express";
    } else if (spec.backend && !reqLower.includes("next") && spec.backend.toLowerCase().includes("next")) {
      // User did not ask for Next.js backend, align with Express standard
      spec.backend = "Express";
    }

    // Frontend: only override if null and not a backend-only project
    if (!spec.frontend && spec.type !== "backend" && spec.type !== "api" && spec.type !== "cli") {
      if (reqLower.includes("vue") || reqLower.includes("vue.js")) {
        spec.frontend = "Vue";
      } else if (reqLower.includes("svelte")) {
        spec.frontend = "Svelte";
      } else if (reqLower.includes("angular")) {
        spec.frontend = "Angular";
      } else if (reqLower.includes("next") || reqLower.includes("nextjs") || reqLower.includes("next.js")) {
        spec.frontend = "Next.js";
      } else {
        // Default to React-Vite which is the core production engine
        spec.frontend = "React-Vite";
      }
    } else if (spec.frontend && reqLower.includes("vue") && !spec.frontend.toLowerCase().includes("vue")) {
      spec.frontend = "Vue";
    } else if (spec.frontend && reqLower.includes("svelte") && !spec.frontend.toLowerCase().includes("svelte")) {
      spec.frontend = "Svelte";
    } else if (spec.frontend && !reqLower.includes("next") && spec.frontend.toLowerCase().includes("next")) {
      // User did not ask for Next.js, align with React-Vite
      spec.frontend = "React-Vite";
    }

    // Auth: only set a default if undefined and the project type would logically need auth
    if (!spec.auth && (needsBackend || spec.type === "saas" || spec.type === "fullstack")) {
      if (reqLower.includes("oauth") || reqLower.includes("google auth") || reqLower.includes("github auth")) {
        spec.auth = "OAuth2";
      } else if (reqLower.includes("session") && !reqLower.includes("jwt")) {
        spec.auth = "session";
      } else if (reqLower.includes("no auth") || reqLower.includes("without auth") || reqLower.includes("no login")) {
        spec.auth = "none";
      } else if (reqLower.includes("jwt")) {
        spec.auth = "JWT";
      } else {
        spec.auth = "JWT";
      }
    } else if (!spec.auth) {
      spec.auth = "none";
    }

    return spec;
  }
}
