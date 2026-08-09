import { Task } from "../planner/task.js";
import { CanonicalArchitectureState } from "./canonical-architecture-state.js";
import { TechnologyConstraintValidator } from "./technology-constraint-validator.js";
import { ArchitectureContractV1 } from "./architecture-resolver.js";

export interface PlanContractGateResult {
  valid: boolean;
  tasks: Task[];
  invalidTasksCount: number;
  rewrittenTasksCount: number;
  errors: string[];
}

export class PlanContractGate {
  public static verifyAndNormalize(tasks: Task[], contract: ArchitectureContractV1): PlanContractGateResult {
    const canonicalState = CanonicalArchitectureState.getInstance().getState();
    const canonicalHash = canonicalState.architectureHash;
    const errors: string[] = [];
    let invalidTasksCount = 0;
    let rewrittenTasksCount = 0;

    const sanitizedTasks: Task[] = tasks.map(task => {
      const clonedTask = { ...task };

      // 1. Hash Validation / Attachment
      if (clonedTask.architectureHash && clonedTask.architectureHash !== canonicalHash) {
        console.warn(`[PlanContractGate] ⚠️ Task #${clonedTask.id} hash (${clonedTask.architectureHash}) mismatched canonical (${canonicalHash}). Replacing.`);
        invalidTasksCount++;
      }
      clonedTask.architectureHash = canonicalHash;

      // 2. Text Normalization against Forbidden Tech
      let title = clonedTask.title;
      let desc = clonedTask.description || "";

      for (const forb of canonicalState.forbiddenTechnologies) {
        const regex = new RegExp(forb, "gi");
        if (regex.test(title) || regex.test(desc)) {
          invalidTasksCount++;
          rewrittenTasksCount++;

          if (forb.toLowerCase().includes("nextauth")) {
            title = title.replace(/NextAuth/gi, "Express JWT Auth");
            desc = desc.replace(/NextAuth/gi, "Express JWT Authentication");
          } else if (forb.toLowerCase().includes("next")) {
            title = title.replace(/Next\.js API Routes/gi, "Express REST API").replace(/Next\.js/gi, "React-Vite");
            desc = desc.replace(/Next\.js API Routes/gi, "Express REST API").replace(/Next\.js/gi, "React-Vite");
          } else if (forb.toLowerCase().includes("mongo")) {
            title = title.replace(/MongoDB/gi, "PostgreSQL").replace(/Mongoose/gi, "Prisma");
            desc = desc.replace(/MongoDB/gi, "PostgreSQL").replace(/Mongoose/gi, "Prisma");
          }
        }
      }

      clonedTask.title = title;
      clonedTask.description = desc;
      clonedTask.allowedTechnologies = canonicalState.requiredLibraries;
      clonedTask.forbiddenTechnologies = canonicalState.forbiddenTechnologies;

      return clonedTask;
    });

    console.log(`[PlanContractGate] ✓ Verified ${sanitizedTasks.length} tasks against Canonical Architecture (${canonicalHash}). Rewrote ${rewrittenTasksCount} tasks.`);

    return {
      valid: errors.length === 0,
      tasks: sanitizedTasks,
      invalidTasksCount,
      rewrittenTasksCount,
      errors
    };
  }
}
