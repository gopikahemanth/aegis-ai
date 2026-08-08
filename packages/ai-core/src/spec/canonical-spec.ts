import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ProjectSpecification, DomainVocabulary } from "../architect/specification.js";

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
  domainVocabulary: DomainVocabulary;
}

export class SpecificationNormalizer {
  public static normalize(userPrompt: string, rawSpec: ProjectSpecification): CanonicalProjectSpecification {
    let combinedPrompt = userPrompt;
    if (userPrompt && (userPrompt.includes("/") || userPrompt.includes("\\"))) {
      try {
        const promptFile = join(userPrompt, ".aegis", "prompt.txt");
        if (existsSync(promptFile)) {
          combinedPrompt += " " + readFileSync(promptFile, "utf8");
        }
      } catch {}
    }
    const promptLower = combinedPrompt.toLowerCase();

    // 1. Detect Domain Category
    let domainCategory: CanonicalProjectSpecification["domainCategory"] = "general-dashboard";
    if (promptLower.includes("resume") || promptLower.includes("cv") || promptLower.includes("keyword scanner") || promptLower.includes("match score")) {
      domainCategory = "resume-scanner" as any;
    } else if (promptLower.includes("workout") || promptLower.includes("fitness") || promptLower.includes("gym") || promptLower.includes("exercise")) {
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

    // 2. Lock Stack based on explicit user directives
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

    // 4. Deterministically extract Domain Vocabulary from user prompt
    const domainVocabulary = SpecificationNormalizer.extractDomainVocabulary(promptLower, domainCategory);

    return {
      ...rawSpec,
      domainCategory,
      frontend,
      backend,
      database,
      auth,
      domainVocabulary,
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

  private static extractDomainVocabulary(
    promptLower: string,
    domainCategory: string
  ): DomainVocabulary {
    switch (domainCategory) {
      case "resume-scanner": {
        return {
          entityName: "ResumeScan",
          entityPlural: "ResumeScans",
          primaryMetrics: ["Match Score", "Matched Keywords", "Missing Skills Count"],
          actionVerbs: ["Upload Resume", "Upload Job Description", "Analyze Match", "Export Report"],
          domainPrefix: "scan"
        };
      }

      case "expense-tracker": {
        const primaryMetrics: string[] = [];
        if (promptLower.includes("income") || promptLower.includes("revenue")) primaryMetrics.push("Total Income");
        primaryMetrics.push("Total Expenses");
        if (promptLower.includes("budget")) primaryMetrics.push("Monthly Budget");
        primaryMetrics.push("Remaining Balance");
        if (promptLower.includes("categor")) primaryMetrics.push("Top Category");

        const actionVerbs: string[] = ["Add Expense"];
        if (promptLower.includes("income")) actionVerbs.push("Add Income");
        if (promptLower.includes("edit") || promptLower.includes("update")) actionVerbs.push("Edit");
        if (promptLower.includes("delete") || promptLower.includes("remov")) actionVerbs.push("Delete");
        if (promptLower.includes("export") || promptLower.includes("csv") || promptLower.includes("pdf")) actionVerbs.push("Export CSV", "Export PDF");
        if (promptLower.includes("filter")) actionVerbs.push("Filter by Date", "Filter by Category");

        return {
          entityName: promptLower.includes("transaction") ? "Transaction" : "Expense",
          entityPlural: promptLower.includes("transaction") ? "Transactions" : "Expenses",
          primaryMetrics,
          actionVerbs,
          domainPrefix: "expense"
        };
      }

      case "task-manager": {
        const primaryMetrics: string[] = ["Total Tasks", "Completed", "In Progress", "Overdue"];
        return {
          entityName: promptLower.includes("ticket") ? "Ticket" : "Task",
          entityPlural: promptLower.includes("ticket") ? "Tickets" : "Tasks",
          primaryMetrics,
          actionVerbs: ["Add Task", "Edit", "Delete", "Mark Complete", "Move to Column"],
          domainPrefix: "task"
        };
      }

      case "workout-fitness": {
        const primaryMetrics: string[] = ["Total Workouts"];
        if (promptLower.includes("calori")) primaryMetrics.push("Calories Burned");
        if (promptLower.includes("weight")) primaryMetrics.push("Total Volume (kg)");
        if (promptLower.includes("streak")) primaryMetrics.push("Current Streak");
        primaryMetrics.push("This Week");
        return {
          entityName: "Workout",
          entityPlural: "Workouts",
          primaryMetrics,
          actionVerbs: ["Log Workout", "Edit", "Delete", "View Progress"],
          domainPrefix: "workout"
        };
      }

      case "ecommerce": {
        return {
          entityName: "Product",
          entityPlural: "Products",
          primaryMetrics: ["Total Revenue", "Orders", "Avg. Order Value", "Stock Items"],
          actionVerbs: ["Add to Cart", "Buy Now", "Checkout", "Track Order"],
          domainPrefix: "product"
        };
      }

      case "blog": {
        return {
          entityName: "Post",
          entityPlural: "Posts",
          primaryMetrics: ["Total Posts", "Published", "Drafts", "Total Views"],
          actionVerbs: ["Write Post", "Edit", "Publish", "Delete"],
          domainPrefix: "post"
        };
      }

      case "art-gallery": {
        return {
          entityName: "Artwork",
          entityPlural: "Artworks",
          primaryMetrics: ["Total Artworks", "Collections", "Featured", "Recent Additions"],
          actionVerbs: ["Add Artwork", "Edit", "Remove", "Feature"],
          domainPrefix: "artwork"
        };
      }

      default: {
        // general-dashboard: infer from prompt keywords
        const entityName = promptLower.includes("user") ? "User"
          : promptLower.includes("order") ? "Order"
          : promptLower.includes("event") ? "Event"
          : promptLower.includes("report") ? "Report"
          : "Item";
        return {
          entityName,
          entityPlural: entityName + "s",
          primaryMetrics: ["Total " + entityName + "s", "Active", "Recent", "This Month"],
          actionVerbs: ["Add " + entityName, "Edit", "Delete", "Export"],
          domainPrefix: entityName.toLowerCase()
        };
      }
    }
  }
}
