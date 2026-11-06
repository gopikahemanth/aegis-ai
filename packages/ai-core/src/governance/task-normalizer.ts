import { ArchitectureContractV1 } from "./architecture-resolver.js";
import { Task } from "../planner/task.js";

export interface TaskNormalizationCorrection {
  field: "title" | "description";
  from: string;
  to: string;
}

export interface TaskNormalizationResult {
  normalizedTask: Task;
  corrections: TaskNormalizationCorrection[];
  violations: string[];
  valid: boolean;
}

/**
 * TaskNormalizer
 *
 * Deterministically validates and normalizes planned tasks against the locked
 * architecture contract. Zero LLM calls used for task corrections.
 */
export class TaskNormalizer {
  /**
   * Deterministically resolves or infers ownedRoutes for a task.
   * If task already specifies ownedRoutes, returns them.
   * Otherwise matches task title, description, and ownedFiles against known routes.
   * Falls back safely to ["/"] for shell/primary tasks.
   */
  public static resolveOwnedRoutes(task: Task, knownRoutes?: string[]): string[] {
    if (task.ownedRoutes && task.ownedRoutes.length > 0) {
      return [...task.ownedRoutes];
    }

    const titleLower = (task.title || "").toLowerCase();
    const descLower = (task.description || "").toLowerCase();
    const taskText = `${titleLower} ${descLower}`;
    const routes: string[] = [];

    const isShellTask =
      task.id === 1 ||
      titleLower.includes("shell") ||
      titleLower.includes("navigation") ||
      titleLower.includes("scaffold") ||
      titleLower.includes("layout");

    const isPolishTask =
      titleLower.includes("polish") ||
      titleLower.includes("accessibility") ||
      titleLower.includes("responsive");

    // Shell/Scaffold tasks own the auth/login gateway if mentioned; otherwise default to root "/"
    if (isShellTask) {
      const authTokens = ["login", "sign-in", "signin", "auth", "credential", "role-switching", "executive routing"];
      if (authTokens.some(tok => taskText.includes(tok))) {
        const loginRoute = (knownRoutes || []).find(r => r.includes("login") || r.includes("auth")) || "/executive-login";
        routes.push(loginRoute);
      } else {
        routes.push("/");
      }
      return routes;
    }

    // Cross-cutting polish tasks operate globally on root frame without claiming new pages
    if (isPolishTask) {
      return ["/"];
    }

    // Specific route discriminators to avoid broad false-positive substring matches
    const ROUTE_DISCRIMINATORS: Record<string, string[]> = {
      "/executive-login": ["login", "sign-in", "signin", "auth", "credential gateway"],
      "/liquidity-overview": ["liquidity-overview", "liquidity overview", "liquidity dashboard", "cash position", "working capital", "total liquidity"],
      "/analyze-burn-rate-forecast": ["burn-rate", "burn rate", "forecasting", "forecast", "runway projection", "scenario simulator"],
      "/execute-fund-transfer": ["fund-transfer", "fund transfer", "transfers", "transfer modal", "transfer workflow"],
      "/filter-export-ledger": ["ledger", "transaction ledger", "export ledger", "transaction history"],
      "/treasury-accounts": ["treasury-accounts", "treasury accounts", "account management", "account creation", "accounts view"],
      "/configure-budget-thresholds": ["budget-thresholds", "budget thresholds", "threshold alerts", "velocity alert", "budget variance"],
      "/audit-log": ["audit-log", "audit log", "audit trail", "event log"],
    };

    // Check task ownedFiles for direct route hints (e.g. src/pages/TreasuryAccounts.tsx)
    const candidateRoutes = knownRoutes && knownRoutes.length > 0
      ? knownRoutes
      : Object.keys(ROUTE_DISCRIMINATORS).concat(["/"]);

    if (task.ownedFiles && task.ownedFiles.length > 0) {
      for (const of of task.ownedFiles) {
        const ofLower = of.toLowerCase();
        for (const route of candidateRoutes) {
          if (route === "/") continue;
          const slug = route.replace(/^\//, "").toLowerCase();
          if (ofLower.includes(slug)) {
            if (!routes.includes(route)) routes.push(route);
          }
        }
      }
    }

    // Match task text against route discriminators
    for (const [route, tokens] of Object.entries(ROUTE_DISCRIMINATORS)) {
      if (candidateRoutes.includes(route) && tokens.some(t => taskText.includes(t))) {
        if (!routes.includes(route)) {
          routes.push(route);
        }
      }
    }

    // Generic multi-word slug matching for dynamic unknown routes
    const ACTION_VERBS = new Set(["analyze", "execute", "configure", "filter", "view", "manage", "inspect", "track"]);
    for (const route of candidateRoutes) {
      if (route === "/" || routes.includes(route)) continue;
      if (ROUTE_DISCRIMINATORS[route]) continue; // already checked above
      const rawWords = route.replace(/^\//, "").replace(/[-_]/g, " ").toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const substantiveWords = rawWords.filter(w => !ACTION_VERBS.has(w) && w.length > 3);
      const targetWords = substantiveWords.length > 0 ? substantiveWords : rawWords;

      // Stem plurals and gerunds (e.g. budgets -> budget, transfers -> transfer, forecasting -> forecast)
      const matchesSubstantive = targetWords.length > 0 && targetWords.every(w => {
        const stem = w.endsWith("ing") ? w.slice(0, -3) : (w.endsWith("s") ? w.slice(0, -1) : w);
        return taskText.includes(w) || taskText.includes(stem);
      });

      if (matchesSubstantive) {
        routes.push(route);
      }
    }

    // Root dashboard / workspace ownership
    if (
      titleLower.includes("dashboard") ||
      titleLower.includes("workspace") ||
      titleLower.includes("overview")
    ) {
      if (!routes.includes("/")) {
        routes.unshift("/");
      }
    }

    // Deterministic fallback: if nothing matched at all, default to ["/"]
    if (routes.length === 0) {
      routes.push("/");
    }

    return routes;
  }

  public static normalizeTask(task: Task, contract: ArchitectureContractV1): TaskNormalizationResult {
    const corrections: TaskNormalizationCorrection[] = [];
    const violations: string[] = [];

    const expFrontend = contract.frontend?.framework || "React-Vite";
    const expBackend = contract.backend?.framework || "Express";
    const expDb = contract.database?.provider || "PostgreSQL";
    const expOrm = contract.database?.orm || "Prisma";

    let title = task.title;
    let description = task.description || "";

    // 1. Next.js / NextAuth / Lucia Auth / Server Actions -> React-Vite + Express REST + JWT
    if (/NextAuth|Lucia Auth|OAuth2/i.test(title) || /NextAuth|Lucia Auth|OAuth2/i.test(description)) {
      corrections.push({ field: "title", from: title, to: title.replace(/NextAuth|Lucia Auth|OAuth2/gi, "Express JWT Auth") });
      title = title.replace(/NextAuth|Lucia Auth|OAuth2/gi, "Express JWT Auth");
      description = description.replace(/NextAuth|Lucia Auth|OAuth2/gi, "Express JWT Authentication with bcrypt and jsonwebtoken");
    }

    if (/Server Actions/i.test(title) || /Server Actions/i.test(description)) {
      title = title.replace(/Server Actions/gi, "Express REST API Endpoints");
      description = description.replace(/server actions/gi, "Express REST endpoints and controller handlers");
    }

    if (/Next\.js\s+API\s+route\s+handlers/i.test(title) || /Next\.js\s+API\s+route\s+handlers/i.test(description)) {
      title = title.replace(/Next\.js\s+API\s+route\s+handlers/gi, `${expBackend} REST API Route Handlers`);
      description = description.replace(/Next\.js\s+API\s+route\s+handlers/gi, `${expBackend} REST API Route Handlers and Controllers`);
    }

    if (/Next\.js\s+pages/i.test(title) || /Next\.js\s+pages/i.test(description)) {
      title = title.replace(/Next\.js\s+pages/gi, `${expFrontend} Pages & Views`);
      description = description.replace(/Next\.js\s+pages/gi, `${expFrontend} Pages and Component Views`);
    }

    if (/Next\.js\s+App\s+Router|Next\.js|Shadcn\s+UI/i.test(title) || /Next\.js\s+App\s+Router|Next\.js|Shadcn\s+UI/i.test(description)) {
      title = title.replace(/Next\.js\s+App\s+Router|Next\.js/gi, `${expFrontend}`);
      description = description.replace(/Next\.js\s+App\s+Router|Next\.js|Shadcn\s+UI/gi, `${expFrontend} with TailwindCSS`);
    }

    if (/Next\.js\s+API\s+Routes/i.test(title) || /Next\.js\s+API\s+Routes/i.test(description)) {
      title = title.replace(/Next\.js\s+API\s+Routes/gi, `${expBackend} REST Controller Routes`);
      description = description.replace(/Next\.js\s+API\s+Routes/gi, `${expBackend} Router Controllers`);
    }

    // 2. Database/ORM replacements
    if (/MongoDB/i.test(title) || /MongoDB/i.test(description)) {
      title = title.replace(/MongoDB/gi, expDb);
      description = description.replace(/MongoDB/gi, expDb);
    }

    if (/Mongoose/i.test(title) || /Mongoose/i.test(description)) {
      title = title.replace(/Mongoose/gi, expOrm);
      description = description.replace(/Mongoose/gi, expOrm);
    }

    if (/Drizzle|Drizzle\s+ORM/i.test(title) || /Drizzle|Drizzle\s+ORM/i.test(description)) {
      title = title.replace(/Drizzle\s+ORM|Drizzle/gi, expOrm);
      description = description.replace(/Drizzle\s+ORM|Drizzle/gi, expOrm);
    }

    // 3. Domain Model Normalization (ResumeScan / ScanResult -> AnalysisResult)
    if (/ResumeScan|ScanResult/i.test(title) || /ResumeScan|ScanResult/i.test(description)) {
      title = title.replace(/ResumeScan|ScanResult/gi, "AnalysisResult");
      description = description.replace(/ResumeScan|ScanResult/gi, "AnalysisResult");
    }

    const ownedRoutes = TaskNormalizer.resolveOwnedRoutes({ ...task, title, description });

    const normalizedTask: Task = {
      ...task,
      title,
      description,
      architectureHash: contract.architectureHash,
      ownedRoutes,
    };

    if (corrections.length > 0) {
      console.log(`[TaskNormalizer] 🔒 Normalized Task #${task.id}:`);
      for (const corr of corrections) {
        console.log(`  • [${corr.field}] "${corr.from}" → "${corr.to}"`);
      }
    }

    return {
      normalizedTask,
      corrections,
      violations,
      valid: violations.length === 0,
    };
  }

  /**
   * Normalizes a collection of planned tasks against the locked architecture contract.
   */
  public static normalizeTasks(tasks: Task[], contract: ArchitectureContractV1): Task[] {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.map(t => TaskNormalizer.normalizeTask(t, contract).normalizedTask);
  }

  /**
   * Deduplicates tasks by semantic role/category and caps at max 6 canonical tasks.
   */
  public static deduplicateAndCapTasks(tasks: Task[], maxTasks = 6): Task[] {
    const seenRoles = new Map<string, Task>();

    for (const task of tasks) {
      const titleOnly = (task.title || "").toLowerCase();
      const descOnly = (task.description || "").toLowerCase();
      let semanticRole = "";

      // 1. Primary classification by task title (highest semantic intent)
      if (/\b(?:integration|e2e|testing|end-to-end)\b/i.test(titleOnly) || (/\bvalidation\b/i.test(titleOnly) && /\b(?:integration|test|qa|verify|verification)\b/i.test(titleOnly))) {
        semanticRole = "INTEGRATION_VALIDATION";
      } else if (/database|schema|prisma\s+model|data\s+model/i.test(titleOnly)) {
        semanticRole = "DB_SCHEMA";
      } else if (/backend|server|express|infrastructure/i.test(titleOnly)) {
        semanticRole = "BACKEND_INFRASTRUCTURE";
      } else if (/domain\s+api|feature\s+api|business\s+logic|domain\s+route|controller|logic\s+&\s+controllers/i.test(titleOnly)) {
        semanticRole = "DOMAIN_API";
      } else if (/analysis|engine|parser|pdf|keyword|matcher|scorer/i.test(titleOnly)) {
        semanticRole = "ANALYSIS_ENGINE";
      } else if (/domain\s+feature|feature\s+ui|feature\s+integration|domain\s+ui/i.test(titleOnly)) {
        const slug = titleOnly.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
        semanticRole = `DOMAIN_FEATURE_UI:${slug}`;
      } else if (/\b(?:app\s+shell|global\s+shell|mission\s+control\s+shell|routing\s+scaffold|shell\s+scaffold|root\s+layout|layout\s+scaffold|navigation\s+shell|shell\s+and\s+navigation)\b/i.test(titleOnly) || (/\b(?:shell|scaffold)\b/i.test(titleOnly) && /\b(?:routing|navigation|router)\b/i.test(titleOnly))) {
        semanticRole = "FRONTEND_SHELL";
      } else if (task.stage?.toLowerCase() === "frontend" || /frontend|react|vite|ui|dashboard|page|client|catalog|portal|selector|builder|customization|manager|deck|planner|stream|visualizer|tree|scheduler|feed|replay|registry|console|matrix|workspace|inspector|monitor|view|display|chart|graph|control/i.test(titleOnly)) {
        // Disambiguate frontend tasks by their distinct feature slug so multiple domain feature tasks are preserved
        const slug = titleOnly.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
        semanticRole = `FRONTEND_APPLICATION:${slug}`;
      } else if (/api|route|endpoint/i.test(titleOnly)) {
        semanticRole = "API_LAYER";
      } else {
        // 2. Fallback to combined title + description
        const combined = (titleOnly + " " + descOnly).toLowerCase();
        if (/\b(?:integration\s+test|e2e\s+test|end-to-end\s+test|system\s+integration|testing\s+suite)\b/i.test(combined)) {
          semanticRole = "INTEGRATION_VALIDATION";
        } else if (/database|schema|prisma|model/i.test(combined)) {
          semanticRole = "DB_SCHEMA";
        } else if (/domain\s+api|feature\s+api|business\s+logic|domain\s+route/i.test(combined)) {
          semanticRole = "DOMAIN_API";
        } else if (/backend|server|express|infrastructure|middleware/i.test(combined)) {
          semanticRole = "BACKEND_INFRASTRUCTURE";
        } else if (/analysis|engine|parser|pdf|keyword|matcher|scorer/i.test(combined)) {
          semanticRole = "ANALYSIS_ENGINE";
        } else if (/domain\s+feature|feature\s+ui|feature\s+integration|domain\s+ui|feature\s+view/i.test(combined)) {
          const slug = titleOnly.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
          semanticRole = `DOMAIN_FEATURE_UI:${slug}`;
        } else if (/\b(?:app\s+shell|global\s+shell|routing\s+scaffold|shell\s+scaffold)\b/i.test(combined)) {
          semanticRole = "FRONTEND_SHELL";
        } else if (task.stage?.toLowerCase() === "frontend" || /frontend|react|vite|ui|dashboard|component|page/i.test(combined)) {
          const slug = titleOnly.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
          semanticRole = `FRONTEND_APPLICATION:${slug}`;
        } else if (/api|route|controller|endpoint/i.test(combined)) {
          semanticRole = "API_LAYER";
        }
      }

      if (!semanticRole) {
        const slug = titleOnly.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
        semanticRole = slug ? `FEATURE:${slug}` : `FEATURE:${task.id}`;
      }

      if (!seenRoles.has(semanticRole)) {
        seenRoles.set(semanticRole, task);
      } else {
        console.log(`[TaskNormalizer] ✂️ Deduplicated duplicate task #${task.id} "${task.title}" (semantic role: ${semanticRole})`);
      }
    }

    const taskList = Array.from(seenRoles.values());
    let deduplicated: Task[] = [];

    // If task count exceeds maxTasks, merge overflow tasks into the last task instead of silently dropping them
    if (taskList.length <= maxTasks) {
      deduplicated = taskList;
    } else {
      deduplicated = taskList.slice(0, maxTasks - 1);
      const targetTask = { ...taskList[maxTasks - 1] };
      const overflowTasks = taskList.slice(maxTasks - 1);

      const mergedTitles: string[] = [];
      const mergedDescriptions: string[] = [targetTask.description || ""];
      const allDeps = new Set<number>(targetTask.dependencies || []);

      for (let i = 1; i < overflowTasks.length; i++) {
        const ov = overflowTasks[i];
        mergedTitles.push(ov.title);
        mergedDescriptions.push(`• Also implements ${ov.title}: ${ov.description || ""}`);
        (ov.dependencies || []).forEach(d => allDeps.add(d));
      }

      if (mergedTitles.length > 0) {
        targetTask.title = `${targetTask.title} & ${mergedTitles.join(" & ")}`.slice(0, 100);
        targetTask.description = mergedDescriptions.join("\n");
        targetTask.dependencies = Array.from(allDeps);
      }
      deduplicated.push(targetTask);
    }

    // Re-index IDs to 1, 2, 3, ... and clean dependencies to be strictly < id
    return deduplicated.map((t, idx) => {
      const newId = idx + 1;
      const rawDeps = t.dependencies || [];
      const dependencies = rawDeps
        .map(d => Number(d))
        .filter(d => !isNaN(d) && d > 0 && d < newId);

      return {
        ...t,
        id: newId,
        dependencies,
      };
    });
  }
}

