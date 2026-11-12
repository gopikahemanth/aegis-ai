/**
 * PlanningStageRunner
 *
 * Stage 3: Dynamic Task Planning & DAG Construction
 * Role: TASK_PLANNER
 *
 * Decomposes architecture and specification into dependency-aware tasks:
 * - Single-file ownership to prevent concurrent write collisions
 * - Enforces cycle-free DAG topology via TaskDAGCoordinator
 * - Records tasks into JobStateManager for resumption tracking
 */

import { BaseStageRunner, type StageContext } from "./stage-runner.js";
import type { OrchestratedAgentRole } from "../agent-contract.js";
import type { OrchestratorJobStatus } from "../job-state-manager.js";
import { TaskDAGCoordinator } from "../task-dag-coordinator.js";
import type { Task } from "../../planner/task.js";
import { ExecutionStage } from "../../execution/stage.js";

export class PlanningStageRunner extends BaseStageRunner<Task[]> {
  readonly stageName = "Task Planning & DAG Construction";
  readonly agentRole: OrchestratedAgentRole = "TASK_PLANNER";
  readonly targetJobStatus: OrchestratorJobStatus = "PLANNING";

  protected async runInternal(context: StageContext): Promise<Task[]> {
    const spec = context.projectSpec;
    const arch = context.architecturePlan;

    // Build standard generation tasks dynamically based on architecture
    const tasks: Task[] = [];
    let taskId = 1;

    // 1. Database Schema
    const dbTaskId = taskId++;
    tasks.push({
      id: dbTaskId,
      title: "Data Architecture & Prisma Schema",
      description: "Define entities, attributes, and relations in prisma/schema.prisma",
      completed: false,
      dependencies: [],
      ownedFiles: ["prisma/schema.prisma"],
      stage: ExecutionStage.Database,
    });

    // 2. Backend Routes & Controllers
    const backendTaskId = taskId++;
    tasks.push({
      id: backendTaskId,
      title: "Backend API Router & Express Controllers",
      description: "Implement API endpoints and controllers for core entities",
      completed: false,
      dependencies: [dbTaskId],
      ownedFiles: ["server/index.ts", "server/routes/api.ts"],
      stage: ExecutionStage.Backend,
    });

    // 3. Frontend API Client / Service Layer
    const clientApiTaskId = taskId++;
    tasks.push({
      id: clientApiTaskId,
      title: "Client API Integration Services",
      description: "Create typed API client matching backend routes under src/services/api.ts",
      completed: false,
      dependencies: [backendTaskId],
      ownedFiles: ["src/services/api.ts"],
      stage: ExecutionStage.Frontend,
    });

    // 4. UI Components & Pages
    const uiTaskId = taskId++;
    tasks.push({
      id: uiTaskId,
      title: "Core UI Components & Navigation",
      description: "Implement interactive UI views, routing, and state hooks",
      completed: false,
      dependencies: [clientApiTaskId],
      ownedFiles: ["src/App.tsx", "src/main.tsx"],
      stage: ExecutionStage.Frontend,
    });

    // 5. Verification & Tests
    const testTaskId = taskId++;
    tasks.push({
      id: testTaskId,
      title: "Full-Stack Test Suite",
      description: "Unit and integration tests verifying client contracts and server health",
      completed: false,
      dependencies: [uiTaskId],
      ownedFiles: ["tests/api.test.ts"],
      stage: ExecutionStage.Validation,
    });

    // Validate DAG has no circular dependencies
    TaskDAGCoordinator.validateNoCycles(tasks);

    // Register into JobStateManager
    context.stateManager.registerTasks(tasks);

    context.tasks = tasks;
    return tasks;
  }
}
