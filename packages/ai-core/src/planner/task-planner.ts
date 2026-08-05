import { ExecutionStage } from "../execution/stage.js";

import type { AIProvider } from "../providers/base.js";
import type { ProjectSpecification } from "../architect/specification.js";
import type { Task } from "./task.js";
import { JsonExtractor } from "../utils/json-extractor.js";
import { PromptManager } from "../prompts/prompt-manager.js";
import { DependencyScheduler } from "../execution/dependency-scheduler.js";

export class TaskPlanner {
  private readonly extractor = new JsonExtractor();
  private readonly promptManager = new PromptManager();
  private readonly scheduler = new DependencyScheduler();

  constructor(
    private readonly provider: AIProvider,
  ) {}

  async plan(
    specification: ProjectSpecification,
  ): Promise<Task[]> {

    const response =
      await this.provider.chat([
        {
          role: "system",
          content: this.promptManager.getPlannerPrompt(specification),
        },
        {
          role: "user",
          content: JSON.stringify(
            specification,
            null,
            2,
          ),
        },
      ], { agentType: "planner" });

    console.log("========== RAW RESPONSE ==========");
    console.log(response);

    const json =
      this.extractor.extract(response);

    console.log("========== EXTRACTED JSON ==========");
    console.log(json);
    console.log("===================================");

    const rawTasks = JSON.parse(json) as Task[];
    const validTaskIds = new Set(rawTasks.map(t => Number(t.id)).filter(id => !isNaN(id)));

    let sanitizedTasks: Task[] = rawTasks.map((task) => {
      const id = Number(task.id);
      const priority = Number(task.priority ?? 1);
      const estimatedComplexity = Number(task.estimatedComplexity ?? 1);

      const rawDeps = task.dependencies ?? [];
      const dependencies = Array.isArray(rawDeps)
        ? rawDeps
            .map(d => Number(d))
            .filter(d => !isNaN(d) && d !== id && validTaskIds.has(d))
        : [];

      return {
        ...task,
        id,
        title: (task.title || "")
          .replace(/PostgreSQL|Postgres/gi, specification.database || "SQLite")
          .replace(/NextAuth/gi, "Express JWT Auth")
          .replace(/Next\.js 14|Next\.js/gi, specification.frontend || "React"),
        description: (task.description || "")
          .replace(/PostgreSQL|Postgres/gi, specification.database || "SQLite")
          .replace(/NextAuth/gi, "Express JWT Auth")
          .replace(/Next\.js 14|Next\.js/gi, specification.frontend || "React"),
        priority: isNaN(priority) ? 1 : priority,
        estimatedComplexity: isNaN(estimatedComplexity) ? 1 : estimatedComplexity,
        dependencies,
        completed: !!task.completed,
        stage:
          ExecutionStage[
            task.stage as keyof typeof ExecutionStage
          ] ??
          ExecutionStage.Implementation,
      };
    });

    try {
      this.scheduler.schedule(sanitizedTasks);
      console.log("[TaskPlanner] DAG dependency validation check successful.");
    } catch (error: any) {
      console.warn(
        `[TaskPlanner] Warning: Dependency validation failed (${error.message}). Falling back to dependency-free sequential execution.`
      );
      sanitizedTasks = sanitizedTasks.map((task) => ({
        ...task,
        dependencies: [],
      }));
    }

    return sanitizedTasks;
  }
}
