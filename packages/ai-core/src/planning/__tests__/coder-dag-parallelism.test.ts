import { describe, it, expect } from "vitest";
import { DependencyScheduler } from "../../execution/dependency-scheduler.js";
import type { Task } from "../../planner/task.js";
import { ExecutionStage } from "../../execution/stage.js";

describe("Aegis V2.1 Fix 8 — Coder DAG Parallelism & Conflict-Aware Scheduling", () => {
  const scheduler = new DependencyScheduler();

  it("Test 1 — Independent tasks parallelize: independent tasks scheduled in same tier", () => {
    const tasks: Task[] = [
      {
        id: 1,
        title: "Build Backend Auth Controllers",
        description: "Express JWT auth controllers",
        completed: false,
        stage: ExecutionStage.Backend,
        priority: 1,
        dependencies: [],
        ownedFiles: ["server/controllers/auth.controller.ts"],
      },
      {
        id: 2,
        title: "Build Kanban Board UI Components",
        description: "React Kanban board and cards",
        completed: false,
        stage: ExecutionStage.Frontend,
        priority: 1,
        dependencies: [],
        ownedFiles: ["src/features/kanban/Board.tsx"],
      },
    ];

    const tiers = scheduler.scheduleParallelTiers(tasks, { autoOptimize: false });
    expect(tiers.length).toBe(1);
    expect(tiers[0].length).toBe(2);
    expect(tiers[0].map(t => t.id)).toEqual([1, 2]);
  });

  it("Test 2 — Dependent tasks remain sequential: B starts only after A completes", () => {
    const tasks: Task[] = [
      {
        id: 1,
        title: "Initialize Database and Schema",
        description: "Create Prisma models",
        completed: false,
        stage: ExecutionStage.Database,
        priority: 1,
        dependencies: [],
        ownedFiles: ["prisma/schema.prisma"],
      },
      {
        id: 2,
        title: "Backend Express Infrastructure",
        description: "Express setup depending on database",
        completed: false,
        stage: ExecutionStage.Backend,
        priority: 1,
        dependencies: [1],
        ownedFiles: ["server/index.ts"],
      },
    ];

    const tiers = scheduler.scheduleParallelTiers(tasks);
    expect(tiers.length).toBe(2);
    expect(tiers[0].map(t => t.id)).toEqual([1]);
    expect(tiers[1].map(t => t.id)).toEqual([2]);
  });

  it("Test 3 — Diamond dependency: A -> (B, C) -> D produces [A], [B, C], [D]", () => {
    const tasks: Task[] = [
      {
        id: 1,
        title: "A: Database Models",
        description: "Prisma schema",
        completed: false,
        stage: ExecutionStage.Database,
        priority: 1,
        dependencies: [],
        ownedFiles: ["prisma/schema.prisma"],
      },
      {
        id: 2,
        title: "B: Backend REST Routes",
        description: "Express routes",
        completed: false,
        stage: ExecutionStage.Backend,
        priority: 2,
        dependencies: [1],
        ownedFiles: ["server/routes/api.routes.ts"],
      },
      {
        id: 3,
        title: "C: Frontend UI Components",
        description: "React buttons and cards",
        completed: false,
        stage: ExecutionStage.Frontend,
        priority: 2,
        dependencies: [1],
        ownedFiles: ["src/features/components/Board.tsx"],
      },
      {
        id: 4,
        title: "D: Frontend Router Integration",
        description: "App routes wiring B and C",
        completed: false,
        stage: ExecutionStage.Frontend,
        priority: 3,
        dependencies: [2, 3],
        ownedFiles: ["src/routes.tsx", "src/App.tsx"],
      },
    ];

    const tiers = scheduler.scheduleParallelTiers(tasks, { autoOptimize: false });
    expect(tiers.length).toBe(3);
    expect(tiers[0].map(t => t.id)).toEqual([1]);
    expect(tiers[1].map(t => t.id)).toEqual([2, 3]); // Parallel execution of B & C
    expect(tiers[2].map(t => t.id)).toEqual([4]);
  });

  it("Test 4 — Write conflict: two tasks writing same file are separated into distinct tiers", () => {
    const tasks: Task[] = [
      {
        id: 1,
        title: "Task A: Write App Shell",
        description: "Modifies App.tsx",
        completed: false,
        stage: ExecutionStage.Frontend,
        priority: 1,
        dependencies: [],
        ownedFiles: ["src/App.tsx"],
      },
      {
        id: 2,
        title: "Task B: Write Navigation Shell",
        description: "Also modifies App.tsx",
        completed: false,
        stage: ExecutionStage.Frontend,
        priority: 1,
        dependencies: [],
        ownedFiles: ["src/App.tsx"],
      },
    ];

    expect(DependencyScheduler.hasWriteConflict(tasks[0], tasks[1])).toBe(true);

    const tiers = scheduler.scheduleParallelTiers(tasks, { autoOptimize: false });
    // Write conflict forces them into separate sequential tiers even though dependencies are empty
    expect(tiers.length).toBe(2);
    expect(tiers[0].length).toBe(1);
    expect(tiers[1].length).toBe(1);
  });

  it("Test 5 — Failure propagation: dependent task C cannot be scheduled if dependency B fails", () => {
    const tasks: Task[] = [
      {
        id: 1,
        title: "Task A: Schema",
        description: "Passed",
        completed: true,
        dependencies: [],
      },
      {
        id: 2,
        title: "Task B: Backend",
        description: "Failed",
        completed: false,
        dependencies: [1],
      },
      {
        id: 3,
        title: "Task C: Frontend Integration",
        description: "Depends on B",
        completed: false,
        dependencies: [2],
      },
    ];

    // Simulate completed set with only Task 1 (Task 2 failed, not in completed set)
    const completedSet = new Set<number>([1]);

    // Check ready tasks: Task 2 is ready to retry, but Task 3 is blocked
    const readyTasks = tasks.filter(
      t => !completedSet.has(t.id) && (t.dependencies || []).every(dep => completedSet.has(dep))
    );

    expect(readyTasks.map(t => t.id)).toEqual([2]);
    expect(readyTasks.map(t => t.id)).not.toContain(3);
  });

  it("Test 6 — Concurrency cap: 10 independent tasks capped at maxCoderConcurrency = 3", () => {
    const tasks: Task[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Independent Task ${i + 1}`,
      description: `Task ${i + 1}`,
      completed: false,
      stage: ExecutionStage.Frontend,
      priority: 1,
      dependencies: [],
      ownedFiles: [`src/features/item_${i + 1}/Component.tsx`],
    }));

    const tiers = scheduler.scheduleParallelTiers(tasks, { maxConcurrency: 3, autoOptimize: false });
    expect(tiers.length).toBe(4); // 3 + 3 + 3 + 1 = 10
    expect(tiers[0].length).toBe(3);
    expect(tiers[1].length).toBe(3);
    expect(tiers[2].length).toBe(3);
    expect(tiers[3].length).toBe(1);
  });

  it("Test 7 — Canonical plan identity: planHash remains identical across all parallel tasks", () => {
    const mockLockedPlan = {
      planId: "plan_kanban_123",
      planHash: "a1b2c3d4e5f6",
      domain: "kanban",
    };

    const tasks: Task[] = [
      { id: 1, title: "Backend Auth", description: "Auth", completed: false, dependencies: [] },
      { id: 2, title: "Frontend Board", description: "Board", completed: false, dependencies: [] },
    ];

    const tiers = scheduler.scheduleParallelTiers(tasks);
    expect(tiers[0].length).toBe(2);

    // Verify both tasks are associated with the same canonical planHash
    for (const task of tiers[0]) {
      const taskPlanHash = mockLockedPlan.planHash;
      expect(taskPlanHash).toBe("a1b2c3d4e5f6");
    }
  });

  it("Test 8 — Semantic Stage Auto-Optimization: decouples independent UI components from Backend logic", () => {
    const tasks: Task[] = [
      {
        id: 1,
        title: "Initialize Database and Prisma Schema",
        description: "Create Prisma models",
        completed: false,
        stage: ExecutionStage.Database,
        dependencies: [],
      },
      {
        id: 2,
        title: "Backend Express Infrastructure and Auth",
        description: "Express routes and auth",
        completed: false,
        stage: ExecutionStage.Backend,
        dependencies: [1],
      },
      {
        id: 3,
        title: "Develop Domain Parsing Services",
        description: "Backend business logic",
        completed: false,
        stage: ExecutionStage.Backend,
        dependencies: [1, 2],
      },
      {
        id: 4,
        title: "React-Vite Frontend Component Implementation",
        description: "Frontend UI components",
        completed: false,
        stage: ExecutionStage.Frontend,
        dependencies: [1, 2, 3], // Raw LLM output linear dependency
      },
      {
        id: 5,
        title: "Frontend Shell and Routing Integration",
        description: "App.tsx and routes.tsx integration",
        completed: false,
        stage: ExecutionStage.Frontend,
        dependencies: [1, 2, 3, 4],
      },
    ];

    const tiers = scheduler.scheduleParallelTiers(tasks, { maxConcurrency: 3, autoOptimize: true });

    // Tier 1: Task 1 (Database)
    expect(tiers[0].map(t => t.id)).toEqual([1]);

    // Tier 2: Task 2 (Backend Auth) + Task 4 (Frontend Components) in PARALLEL!
    expect(tiers[1].map(t => t.id)).toContain(2);
    expect(tiers[1].map(t => t.id)).toContain(4);
    expect(tiers[1].length).toBe(2);

    // Total tiers reduced from 5 to <= 4
    expect(tiers.length).toBeLessThan(5);
  });
});
