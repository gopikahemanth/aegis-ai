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

    // 1. Next.js / NextAuth / Server Actions -> React-Vite + Express REST
    if (/NextAuth/i.test(title) || /NextAuth/i.test(description)) {
      corrections.push({
        field: "title",
        from: title,
        to: title.replace(/NextAuth/gi, "Express JWT Auth"),
      });
      title = title.replace(/NextAuth/gi, "Express JWT Auth");
      description = description.replace(/NextAuth/gi, "Express JWT Authentication with bcrypt and jsonwebtoken");
    }

    if (/Server Actions/i.test(title) || /Server Actions/i.test(description)) {
      title = title.replace(/Server Actions/gi, "Express REST API Endpoints");
      description = description.replace(/server actions/gi, "Express REST endpoints and controller handlers");
    }

    if (/Next\.js\s+App\s+Router/i.test(title) || /Next\.js\s+App\s+Router/i.test(description)) {
      title = title.replace(/Next\.js\s+App\s+Router/gi, `${expFrontend} Router`);
      description = description.replace(/Next\.js\s+App\s+Router/gi, `${expFrontend} with React Router DOM`);
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

    if (/Drizzle/i.test(title) || /Drizzle/i.test(description)) {
      title = title.replace(/Drizzle/gi, expOrm);
      description = description.replace(/Drizzle/gi, expOrm);
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
}
