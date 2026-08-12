import { ArchitectureContractV1 } from "./architecture-resolver.js";
import { Task } from "../planner/task.js";
import { createHash } from "node:crypto";

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
      // Mongoose/Sequelize are incompatible with Prisma
      if (taskText.includes("mongoose") || taskText.includes("mongoose schema") || taskText.includes("mongoose model")) {
        return {
          hasConflict: true,
          taskId: task.id,
          taskTitle: task.title,
          expectedArchitecture: contract.database.orm,
          detectedTechnology: "Mongoose",
          reason: `Planner generated Mongoose task but locked ORM is ${contract.database.orm}.`
        };
      }
      if (taskText.includes("sequelize")) {
        return {
          hasConflict: true,
          taskId: task.id,
          taskTitle: task.title,
          expectedArchitecture: contract.database.orm,
          detectedTechnology: "Sequelize",
          reason: `Planner generated Sequelize task but locked ORM is ${contract.database.orm}.`
        };
      }
    }

    // 5. Domain model guard: reject tasks introducing unauthorized models (e.g. Task, Item for resume scanner)
    const unauthorizedModels = ["task model", "kanban", "todo list", "shopping cart", "blog post model"];
    const contractModelNames = (contract.requiredModels || []).map(m => m.toLowerCase());
    const isGenericTaskModel = (
      taskText.includes("task model") ||
      (taskText.includes("create model") && taskText.includes("task") && !contractModelNames.some(m => m.includes("task")))
    );
    if (isGenericTaskModel && contractModelNames.length > 0) {
      return {
        hasConflict: true,
        taskId: task.id,
        taskTitle: task.title,
        expectedArchitecture: contract.requiredModels.join(", "),
        detectedTechnology: "Generic Task model",
        reason: `UNAUTHORIZED_DOMAIN_MODEL: Task introduces a generic 'Task' model not in contract.requiredModels [${contract.requiredModels.join(", ")}].`
      };
    }

    return { hasConflict: false };
  }

  public static adaptTaskToArchitecture(task: Task, contract: ArchitectureContractV1): Task {
    const expFrontend = (contract.frontend?.framework || "React").replace(/Next\.js(\s+App\s+Router)?/gi, "React").trim();
    const expBackend = (contract.backend?.framework || "Express").replace(/Next\.js(\s+API\s+Routes)?|NestJS/gi, "Express").trim();
    const expDb = contract.database?.provider || "PostgreSQL";
    const expOrm = contract.database?.orm || "Prisma";

    let updatedTitle = task.title;
    let updatedDesc = task.description;

    // Universal replacement for Next.js / NextAuth / App Router / Server Actions to locked contract
    updatedTitle = updatedTitle
      .replace(/NextAuth(\.js)?/gi, "Express JWT Auth")
      .replace(/Next\.js App Router/gi, `${expFrontend} Router`)
      .replace(/Next\.js API Route(s| handlers)?/gi, `${expBackend} REST Routes`)
      .replace(/Next\.js/gi, expFrontend)
      .replace(/NestJS/gi, expBackend)
      .replace(/Next/gi, expFrontend);

    updatedDesc = updatedDesc
      .replace(/NextAuth(\.js)?/gi, "JWT Authentication using Express middleware and bcrypt")
      .replace(/Next\.js App Router/gi, `${expFrontend} with React Router DOM`)
      .replace(/Next\.js API Route(s| handlers)?/gi, `${expBackend} Router Controllers`)
      .replace(/Next\.js/gi, expFrontend)
      .replace(/NestJS/gi, expBackend)
      .replace(/Next/gi, expFrontend);

    if (updatedTitle.toLowerCase().includes("server actions") || updatedDesc.toLowerCase().includes("server actions")) {
      updatedTitle = updatedTitle.replace(/Server Actions/gi, "Express REST API Endpoints");
      updatedDesc = updatedDesc.replace(/server actions/gi, "Express REST endpoints and controller handlers");
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

    // Compute architecture hash for task metadata injection
    const archHash = createHash("sha256").update(JSON.stringify({
      frontend: contract.frontend?.framework,
      backend: contract.backend?.framework,
      database: contract.database?.provider,
      orm: contract.database?.orm
    })).digest("hex").slice(0, 12);

    const validatedTasks: Task[] = [];

    for (const rawTask of tasks) {
      const initialCheck = this.validateTask(rawTask, contract);

      if (!initialCheck.hasConflict) {
        // Inject contract metadata into validated task
        validatedTasks.push({
          ...rawTask,
          contractVersion: 1,
          architectureHash: archHash,
          allowedTechnologies: [
            contract.frontend.framework,
            contract.backend.framework,
            contract.database.provider,
            contract.database.orm,
            contract.language
          ]
        } as Task);
      } else {
        console.warn(`[PlannerGuard] ⚠️ Architecture conflict detected in task #${rawTask.id} "${rawTask.title}": ${initialCheck.reason}`);

        // UNAUTHORIZED_DOMAIN_MODEL: Do not attempt adaptation — reject outright
        if (initialCheck.reason?.includes("UNAUTHORIZED_DOMAIN_MODEL")) {
          console.error(`[PlannerGuard] ❌ Skipping task #${rawTask.id} — unauthorized domain model detected. Task will not be executed.`);
          continue;
        }

        console.log(`[PlannerGuard] 🔄 Regenerating task #${rawTask.id} to conform to locked ${contract.frontend.framework} + ${contract.backend.framework} + ${contract.database.provider} architecture...`);
        
        // Attempt task adaptation / regeneration to conform to locked contract
        const adaptedTask = this.adaptTaskToArchitecture(rawTask, contract);
        const recheck = this.validateTask(adaptedTask, contract);

        if (!recheck.hasConflict) {
          console.log(`[PlannerGuard] ✓ Task #${adaptedTask.id} successfully regenerated: "${adaptedTask.title}"`);
          validatedTasks.push({
            ...adaptedTask,
            contractVersion: 1,
            architectureHash: archHash,
            allowedTechnologies: [
              contract.frontend.framework,
              contract.backend.framework,
              contract.database.provider,
              contract.database.orm,
              contract.language
            ]
          } as Task);
        } else {
          console.warn(`[PlannerGuard] ⚠️ Force-sanitizing remaining technology terms in task #${adaptedTask.id}`);
          const forceSanitizedTitle = adaptedTask.title.replace(/Next\.js|NextJS|NextAuth|App Router|NestJS|Nest|Server Actions|MongoDB|Drizzle/gi, "React/Express");
          const forceSanitizedDesc = adaptedTask.description.replace(/Next\.js|NextJS|NextAuth|App Router|NestJS|Nest|Server Actions|MongoDB|Drizzle/gi, "React/Express");
          validatedTasks.push({
            ...adaptedTask,
            title: forceSanitizedTitle,
            description: forceSanitizedDesc,
            contractVersion: 1,
            architectureHash: archHash,
            allowedTechnologies: [
              contract.frontend.framework,
              contract.backend.framework,
              contract.database.provider,
              contract.database.orm,
              contract.language
            ]
          } as Task);
        }
      }
    }

    return validatedTasks;
  }
}
