import type { TaskContext } from "./task-context.js";
import type { TaskResult } from "./task-result.js";
import { ExecutionStage } from "./stage.js";
export interface ExecutionTask {
  id: number;

  title: string;

  stage?: ExecutionStage;

  priority?: number;

  dependencies?: number[];
}
import { DependencyScheduler } from "./dependency-scheduler.js";
import { RequirementsRunner } from "./requirements-runner.js";
import { ImplementationRunner } from "./implementation-runner.js";
import { StageDispatcher } from "./stage-dispatcher.js";
import { StageResolver } from "./stage-resolver.js";
import { ArchitectureRunner } from "./architecture-runner.js";
export class ExecutionLoop {
private readonly dispatcher =
  new StageDispatcher();
  private readonly resolver =
  new StageResolver();
  private readonly scheduler =
  new DependencyScheduler();
  constructor() {
    this.dispatcher.register(
      ExecutionStage.Requirements,
      new RequirementsRunner(),
    );
    this.dispatcher.register(
      ExecutionStage.Architecture,
      new ArchitectureRunner(),
    );
    this.dispatcher.register(
      ExecutionStage.Planning,
      new ImplementationRunner(),
    );
    this.dispatcher.register(
      ExecutionStage.DataModeling,
      new ImplementationRunner(),
    );
    this.dispatcher.register(
      ExecutionStage.ApiDesign,
      new ImplementationRunner(),
    );
    this.dispatcher.register(
      ExecutionStage.Database,
      new ImplementationRunner(),
    );
    this.dispatcher.register(
      ExecutionStage.Backend,
      new ImplementationRunner(),
    );
    this.dispatcher.register(
      ExecutionStage.Frontend,
      new ImplementationRunner(),
    );
    this.dispatcher.register(
      ExecutionStage.Implementation,
      new ImplementationRunner(),
    );
    this.dispatcher.register(
      ExecutionStage.Review,
      new ImplementationRunner(),
    );
    this.dispatcher.register(
      ExecutionStage.Validation,
      new ImplementationRunner(),
    );
    this.dispatcher.register(
      ExecutionStage.Healing,
      new ImplementationRunner(),
    );
  }
  async execute(
    context: TaskContext,
    tasks: ExecutionTask[],
   handler: (
  task: ExecutionTask,
  context: TaskContext,
) => Promise<TaskResult>,
): Promise<TaskResult[]> {

  const results: TaskResult[] = [];
tasks =
  this.scheduler.schedule(
    tasks,
  );
    console.log();
    console.log("========== EXECUTION ==========");

    for (const task of tasks) {
      console.log();
      console.log(`▶ ${task.title}`);
   context.currentStage =
  this.resolver.resolve(
    task,
  );
     await handler(
  task,
  context,
);

const runner =
  this.dispatcher.get(
    context.currentStage!,
  ) || new ImplementationRunner();
console.log(`[Execution] Running stage "${context.currentStage}" for task: "${task.title}"`);

const result =
  await runner.run(
    context,
    task,
  );

results.push(result);
context.results ??= [];
context.results.push(result);
if (result.success) {
  console.log(
    `✓ ${task.title}`,
  );
} else {
  console.log(
    `✗ ${task.title}`,
  );

  break;
}
    }

    console.log();
    console.log("========== COMPLETE ==========");
    console.log();

console.table(
  results.map((result) => ({
    Task: result.taskId,
    Status: result.success
      ? "SUCCESS"
      : "FAILED",
    Message: result.message,
  })),
);
    return results;
  }
}
