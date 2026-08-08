import { ArchitectureContractV1 } from "./architecture-resolver.js";
import { Task } from "../planner/task.js";

export interface PlannerConflictResult {
  hasConflict: boolean;
  taskId?: number;
  taskTitle?: string;
  expectedArchitecture?: string;
  detectedTechnology?: string;
  reason?: string;
  regeneratedTask?: Task;
}

export class PlannerArchitectureGuard {
  public static validateTask(task: Task, contract: ArchitectureContractV1): PlannerConflictResult {
    if (!contract || typeof contract !== "object") {
      throw new Error(`ARCHITECTURE_CONTRACT_MISSING: PlannerArchitectureGuard received undefined or invalid ArchitectureContract.`);
    }

    if (!contract.frontend || !contract.frontend.framework) {
      throw new Error(`ARCHITECTURE_CONTRACT_MISSING: ArchitectureContract is missing required 'frontend.framework' definition.`);
    }

    if (!contract.backend || !contract.backend.framework) {
      throw new Error(`ARCHITECTURE_CONTRACT_MISSING: ArchitectureContract is missing required 'backend.framework' definition.`);
    }

    if (!contract.database || !contract.database.provider) {
      throw new Error(`ARCHITECTURE_CONTRACT_MISSING: ArchitectureContract is missing required 'database.provider' definition.`);
    }

    if (!contract.database || !contract.database.orm) {
      throw new Error(`ARCHITECTURE_CONTRACT_MISSING: ArchitectureContract is missing required 'database.orm' definition.`);
    }

    const taskText = `${task.title} ${task.description}`.toLowerCase();
    const expFrontend = contract.frontend.framework.toLowerCase();
    const expBackend = contract.backend.framework.toLowerCase();
    const expDb = contract.database.provider.toLowerCase();
    const expOrm = contract.database.orm.toLowerCase();

    // 1. Frontend conflicts (e.g. Next.js App Router / Server Actions when contract is React-Vite)
    if (expFrontend.includes("vite") || expFrontend.includes("react")) {
      if (taskText.includes("next.js app router") || taskText.includes("next router") || taskText.includes("server actions") || taskText.includes("nextauth")) {
        return {
          hasConflict: true,
          taskId: task.id,
          taskTitle: task.title,
          expectedArchitecture: contract.frontend.framework,
          detectedTechnology: "Next.js App Router / Server Actions / NextAuth",
          reason: `Planner generated Next.js App Router/NextAuth task for locked ${contract.frontend.framework} contract.`
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

    // 3. Database conflicts (e.g. MongoDB task or forced SQLite substitution when contract is PostgreSQL)
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

  public static adaptTaskToArchitecture(task: Task, contract: ArchitectureContractV1): Task {
    const expFrontend = contract.frontend.framework;
    const expBackend = contract.backend.framework;
    const expDb = contract.database.provider;
    const expOrm = contract.database.orm;

    let updatedTitle = task.title;
    let updatedDesc = task.description;

    // Adapt Next.js / NextAuth / Server Actions to React + Express REST
    if (updatedTitle.toLowerCase().includes("nextauth") || updatedDesc.toLowerCase().includes("nextauth")) {
      updatedTitle = updatedTitle.replace(/NextAuth/gi, "Express JWT Auth");
      updatedDesc = updatedDesc.replace(/NextAuth/gi, "JWT Authentication using Express middleware and bcrypt");
    }

    if (updatedTitle.toLowerCase().includes("server actions") || updatedDesc.toLowerCase().includes("server actions")) {
      updatedTitle = updatedTitle.replace(/Server Actions/gi, "Express REST API Endpoints");
      updatedDesc = updatedDesc.replace(/server actions/gi, "Express REST endpoints and controller handlers");
    }

    if (updatedTitle.toLowerCase().includes("next.js app router") || updatedDesc.toLowerCase().includes("next.js app router")) {
      updatedTitle = updatedTitle.replace(/Next.js App Router/gi, `${expFrontend} Router`);
      updatedDesc = updatedDesc.replace(/Next.js App Router/gi, `${expFrontend} with React Router DOM`);
    }

    if (updatedTitle.toLowerCase().includes("next.js api routes") || updatedDesc.toLowerCase().includes("next.js api routes")) {
      updatedTitle = updatedTitle.replace(/Next.js API Routes/gi, `${expBackend} REST Controller Routes`);
      updatedDesc = updatedDesc.replace(/Next.js API Routes/gi, `${expBackend} Router Controllers`);
    }

    // Adapt database/ORM references to contract
    if (updatedTitle.toLowerCase().includes("mongodb") || updatedDesc.toLowerCase().includes("mongodb")) {
      updatedTitle = updatedTitle.replace(/MongoDB/gi, expDb);
      updatedDesc = updatedDesc.replace(/MongoDB/gi, expDb);
    }

    if (updatedTitle.toLowerCase().includes("drizzle") || updatedDesc.toLowerCase().includes("drizzle")) {
      updatedTitle = updatedTitle.replace(/Drizzle/gi, expOrm);
      updatedDesc = updatedDesc.replace(/Drizzle/gi, expOrm);
    }

    return {
      ...task,
      title: updatedTitle,
      description: updatedDesc
    };
  }

  public static filterTasks(tasks: Task[], contract: ArchitectureContractV1): Task[] {
    if (!contract) {
      throw new Error(`ARCHITECTURE_CONTRACT_MISSING: PlannerArchitectureGuard received undefined contract.`);
    }

    const validatedTasks: Task[] = [];

    for (const rawTask of tasks) {
      const initialCheck = this.validateTask(rawTask, contract);

      if (!initialCheck.hasConflict) {
        validatedTasks.push(rawTask);
      } else {
        console.warn(`[PlannerGuard] ⚠️ Architecture conflict detected in task #${rawTask.id} "${rawTask.title}": ${initialCheck.reason}`);
        console.log(`[PlannerGuard] 🔄 Regenerating task #${rawTask.id} to conform to locked ${contract.frontend.framework} + ${contract.backend.framework} + ${contract.database.provider} architecture...`);
        
        // Attempt task adaptation / regeneration to conform to locked contract
        const adaptedTask = this.adaptTaskToArchitecture(rawTask, contract);
        const recheck = this.validateTask(adaptedTask, contract);

        if (!recheck.hasConflict) {
          console.log(`[PlannerGuard] ✓ Task #${adaptedTask.id} successfully regenerated: "${adaptedTask.title}"`);
          validatedTasks.push(adaptedTask);
        } else {
          console.error(`[PlannerGuard] ❌ Regeneration failed for task #${rawTask.id}: Still conflicts with architecture (${recheck.reason})`);
          throw new Error(`PLANNING_FAILED: Task #${rawTask.id} "${rawTask.title}" could not be adapted to locked ${contract.frontend.framework} + ${contract.backend.framework} contract.`);
        }
      }
    }

    return validatedTasks;
  }
}
