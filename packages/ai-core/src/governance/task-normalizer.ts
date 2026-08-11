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

    const normalizedTask: Task = {
      ...task,
      title,
      description,
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
   * Deduplicates tasks by semantic role/category and caps at max 6 canonical tasks.
   */
  public static deduplicateAndCapTasks(tasks: Task[], maxTasks = 6): Task[] {
    const seenRoles = new Map<string, Task>();

    for (const task of tasks) {
      const titleLower = (task.title + " " + (task.description || "")).toLowerCase();
      let semanticRole = "FEATURE";

      if (/database|schema|prisma|model/i.test(titleLower)) {
        semanticRole = "DB_SCHEMA";
      } else if (/backend|server|express|infrastructure|middleware/i.test(titleLower)) {
        semanticRole = "BACKEND_INFRASTRUCTURE";
      } else if (/analysis|engine|parser|pdf|keyword|matcher|scorer/i.test(titleLower)) {
        semanticRole = "ANALYSIS_ENGINE";
      } else if (/api|route|controller|endpoint/i.test(titleLower)) {
        semanticRole = "API_LAYER";
      } else if (/frontend|react|vite|ui|dashboard|component|page/i.test(titleLower)) {
        semanticRole = "FRONTEND_APPLICATION";
      } else if (/integration|validation|e2e|testing/i.test(titleLower)) {
        semanticRole = "INTEGRATION_VALIDATION";
      }

      if (!seenRoles.has(semanticRole)) {
        seenRoles.set(semanticRole, task);
      } else {
        console.log(`[TaskNormalizer] ✂️ Deduplicated duplicate task #${task.id} "${task.title}" (semantic role: ${semanticRole})`);
      }
    }

    const deduplicated = Array.from(seenRoles.values()).slice(0, maxTasks);

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

