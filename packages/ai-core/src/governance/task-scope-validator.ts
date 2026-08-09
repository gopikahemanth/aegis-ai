import { SubsystemRole, FileOwnershipEntry } from "./file-ownership.js";

export interface TaskScopeRule {
  taskTitle: string;
  allowedPrefixes: string[];
  forbiddenPrefixes: string[];
}

export class TaskScopeValidator {
  public static getAllowedPrefixes(taskTitle: string, stage?: string): { allowed: string[]; forbidden: string[] } {
    const titleLower = taskTitle.toLowerCase();
    const stageLower = (stage || "").toLowerCase();

    // 1. Prisma / Database Setup Task
    if (titleLower.includes("prisma") || titleLower.includes("database setup") || stageLower.includes("database")) {
      return {
        allowed: ["prisma/", "server/lib/prisma.ts", "src/lib/prisma.ts", ".aegis/"],
        forbidden: ["src/features/", "src/components/", "server/controllers/", "server/routes/"]
      };
    }

    // 2. Backend Task
    if (stageLower.includes("backend") || titleLower.includes("express") || titleLower.includes("api endpoint")) {
      return {
        allowed: ["server/", "prisma/", "src/services/api.ts", ".aegis/"],
        forbidden: ["src/features/", "src/components/", "src/App.tsx"]
      };
    }

    // 3. Frontend Task
    if (stageLower.includes("frontend") || titleLower.includes("react") || titleLower.includes("ui") || titleLower.includes("dashboard")) {
      return {
        allowed: ["src/", "public/", ".aegis/"],
        forbidden: ["server/", "prisma/"]
      };
    }

    return {
      allowed: ["src/", "server/", "prisma/", "public/", ".aegis/"],
      forbidden: []
    };
  }

  public static validateTaskFileScope(taskTitle: string, proposedFile: string, stage?: string): { allowed: boolean; reason?: string } {
    const normalizedFile = proposedFile.replace(/\\/g, "/");
    const { allowed, forbidden } = this.getAllowedPrefixes(taskTitle, stage);

    for (const forb of forbidden) {
      if (normalizedFile.startsWith(forb)) {
        return {
          allowed: false,
          reason: `TASK_FILE_SCOPE_VIOLATION: Task "${taskTitle}" is forbidden from modifying "${proposedFile}" (Forbidden scope: ${forb}).`
        };
      }
    }

    const isAllowed = allowed.some(all => normalizedFile.startsWith(all) || normalizedFile === all);
    if (!isAllowed && allowed.length > 0) {
      return {
        allowed: false,
        reason: `TASK_FILE_SCOPE_VIOLATION: Proposed file "${proposedFile}" is outside task "${taskTitle}" allowed scope ([${allowed.join(", ")}]).`
      };
    }

    return { allowed: true };
  }
}
