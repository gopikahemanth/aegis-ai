import { ArchitectureContractV1 } from "./architecture-resolver.js";
import { Task } from "../planner/task.js";

export interface PlannerConflictResult {
  hasConflict: boolean;
  taskId?: number;
  taskTitle?: string;
  expectedArchitecture?: string;
  detectedTechnology?: string;
  reason?: string;
}

export class PlannerArchitectureGuard {
  public static validateTask(task: Task, contract: ArchitectureContractV1): PlannerConflictResult {
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    const expFrontend = contract.frontend.framework.toLowerCase();
    const expBackend = contract.backend.framework.toLowerCase();
    const expDb = contract.database.provider.toLowerCase();
    const expOrm = contract.database.orm.toLowerCase();

    // 1. Frontend conflicts (e.g. Next.js App Router when contract is React-Vite)
    if (expFrontend.includes("vite") || expFrontend.includes("react")) {
      if (taskText.includes("next.js app router") || taskText.includes("next router") || taskText.includes("server actions")) {
        return {
          hasConflict: true,
          taskId: task.id,
          taskTitle: task.title,
          expectedArchitecture: contract.frontend.framework,
          detectedTechnology: "Next.js App Router / Server Actions",
          reason: `Planner generated Next.js App Router task for locked ${contract.frontend.framework} contract.`
        };
      }
    }

    // 2. Backend conflicts (e.g. Next.js API Routes when contract is Express)
    if (expBackend.includes("express")) {
      if (taskText.includes("next.js api routes") || taskText.includes("next api routes")) {
        return {
          hasConflict: true,
          taskId: task.id,
          taskTitle: task.title,
          expectedArchitecture: contract.backend.framework,
          detectedTechnology: "Next.js API Routes",
          reason: `Planner generated Next.js API Routes task for locked ${contract.backend.framework} contract.`
        };
      }
    }

    // 3. Database conflicts (e.g. MongoDB or SQLite task when contract is PostgreSQL)
    if (expDb.includes("postgres")) {
      if (taskText.includes("mongodb") || taskText.includes("mongoose") || taskText.includes("sqlite database")) {
        return {
          hasConflict: true,
          taskId: task.id,
          taskTitle: task.title,
          expectedArchitecture: contract.database.provider,
          detectedTechnology: "MongoDB / SQLite",
          reason: `Planner generated incompatible database task for locked ${contract.database.provider} contract.`
        };
      }
    }

    // 4. ORM conflicts (e.g. Drizzle task when contract is Prisma)
    if (expOrm.includes("prisma")) {
      if (taskText.includes("drizzle schema") || taskText.includes("drizzle-orm")) {
        return {
          hasConflict: true,
          taskId: task.id,
          taskTitle: task.title,
          expectedArchitecture: contract.database.orm,
          detectedTechnology: "Drizzle ORM",
          reason: `Planner generated Drizzle ORM task for locked ${contract.database.orm} contract.`
        };
      }
    }

    return { hasConflict: false };
  }

  public static filterTasks(tasks: Task[], contract: ArchitectureContractV1): Task[] {
    const validTasks: Task[] = [];
    for (const task of tasks) {
      const check = this.validateTask(task, contract);
      if (check.hasConflict) {
        console.warn(`[PlannerGuard] ⚠️ Filtered out architecture-incompatible task #${check.taskId} "${check.taskTitle}": ${check.reason}`);
      } else {
        validTasks.push(task);
      }
    }
    return validTasks;
  }
}
