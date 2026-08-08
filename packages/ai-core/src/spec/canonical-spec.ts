import { ProjectSpecification } from "../architect/specification.js";

export interface CanonicalProjectSpecification extends ProjectSpecification {
  domainCategory: "expense-tracker" | "task-manager" | "workout-fitness" | "art-gallery" | "ecommerce" | "blog" | "general-dashboard";
  lockedStack: {
    frontend: string;
    backend: string;
    database: string;
    orm: string;
    auth: string;
    language: string;
    styling: string;
    packageManager: "pnpm" | "npm" | "yarn";
  };
  forbiddenPatterns: string[];
}

export class SpecificationNormalizer {
  public static normalize(userPrompt: string, rawSpec: ProjectSpecification): CanonicalProjectSpecification {
    const promptLower = userPrompt.toLowerCase();
    
    // 1. Detect Domain Category
    let domainCategory: CanonicalProjectSpecification["domainCategory"] = "general-dashboard";
    if (promptLower.includes("workout") || promptLower.includes("fitness") || promptLower.includes("gym") || promptLower.includes("exercise")) {
      domainCategory = "workout-fitness";
    } else if (promptLower.includes("expense") || promptLower.includes("spending") || promptLower.includes("budget") || promptLower.includes("transaction") || promptLower.includes("finance")) {
      domainCategory = "expense-tracker";
    } else if (promptLower.includes("kanban") || promptLower.includes("task") || promptLower.includes("project management") || promptLower.includes("todo")) {
      domainCategory = "task-manager";
    } else if (promptLower.includes("art") || promptLower.includes("gallery") || promptLower.includes("artwork") || promptLower.includes("exhibition")) {
      domainCategory = "art-gallery";
    } else if (promptLower.includes("ecommerce") || promptLower.includes("shop") || promptLower.includes("store") || promptLower.includes("product")) {
      domainCategory = "ecommerce";
    } else if (promptLower.includes("blog") || promptLower.includes("post") || promptLower.includes("article")) {
      domainCategory = "blog";
    }

    // 2. Lock Stack based on explicit user directives overriding AI inference
    let frontend = rawSpec.frontend || "React";
    if (promptLower.includes("react")) frontend = "React";
    if (promptLower.includes("next.js") || promptLower.includes("nextjs")) frontend = "Next.js";
    if (promptLower.includes("vite")) frontend = "React-Vite";

    let backend = rawSpec.backend || "Express";
    if (promptLower.includes("express")) backend = "Express";
    if (promptLower.includes("next.js api") || promptLower.includes("next api")) backend = "Next.js API Routes";

    let database = rawSpec.database || "SQLite";
    if (promptLower.includes("sqlite")) database = "SQLite";
    if (promptLower.includes("postgres") || promptLower.includes("postgresql")) database = "PostgreSQL";

    let orm = "Prisma";
    if (promptLower.includes("prisma")) orm = "Prisma";
    if (promptLower.includes("drizzle")) orm = "Drizzle";

    let auth = rawSpec.auth || "JWT";
    if (promptLower.includes("jwt")) auth = "JWT";
    if (promptLower.includes("nextauth")) auth = "NextAuth.js";

    // 3. Define Forbidden Domain Patterns
    const forbiddenPatterns: string[] = [];
    if (domainCategory === "expense-tracker") {
      forbiddenPatterns.push("Kanban", "KanbanBoard", "To Do", "In Progress", "Manage tasks", "task status");
    } else if (domainCategory === "task-manager") {
      forbiddenPatterns.push("Transactions", "Category Budgets", "Spending Analytics");
    } else if (domainCategory === "art-gallery") {
      forbiddenPatterns.push("Kanban", "Budget Limit", "Transaction Table");
    }

    return {
      ...rawSpec,
      domainCategory,
      frontend,
      backend,
      database,
      auth,
      lockedStack: {
        frontend,
        backend,
        database,
        orm,
        auth,
        language: rawSpec.language || "TypeScript",
        styling: rawSpec.styling || "TailwindCSS",
        packageManager: rawSpec.packageManager || "pnpm"
      },
      forbiddenPatterns
    };
  }
}
