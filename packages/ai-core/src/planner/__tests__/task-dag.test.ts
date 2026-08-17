import { describe, it, expect } from "vitest";
import { TaskDAG } from "../task-dag.js";
import type { Task } from "../task.js";

describe("TaskDAG — Preflight DAG Validation & Scheduling Structure", () => {
  it("validates a healthy acyclic task DAG with parallel tiers and critical path", () => {
    const tasks: Task[] = [
      { id: 1, title: "Database Schema", description: "Setup schema", completed: false, dependencies: [], ownedFiles: ["prisma/schema.prisma"] },
      { id: 2, title: "Design Tokens", description: "Setup CSS", completed: false, dependencies: [], ownedFiles: ["src/index.css"] },
      { id: 3, title: "Backend API Service", description: "Implement API", completed: false, dependencies: [1], ownedFiles: ["server/routes/api.ts"] },
      { id: 4, title: "Frontend Dashboard", description: "Implement UI", completed: false, dependencies: [2, 3], ownedFiles: ["src/pages/Dashboard.tsx"] },
    ];

    const dag = new TaskDAG(tasks);
    const res = dag.validate();

    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
    expect(res.parallelTiers.length).toBe(3); // Tier 1: [1, 2], Tier 2: [3], Tier 3: [4]
    expect(res.criticalPath).toEqual([1, 3, 4]);
  });

  it("detects circular dependency cycles", () => {
    const tasks: Task[] = [
      { id: 1, title: "Task 1", description: "", completed: false, dependencies: [3] },
      { id: 2, title: "Task 2", description: "", completed: false, dependencies: [1] },
      { id: 3, title: "Task 3", description: "", completed: false, dependencies: [2] },
    ];

    const dag = new TaskDAG(tasks);
    const res = dag.validate();

    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes("Circular dependency detected"))).toBe(true);
  });

  it("detects self-dependency", () => {
    const tasks: Task[] = [
      { id: 1, title: "Self Task", description: "", completed: false, dependencies: [1] },
    ];

    const dag = new TaskDAG(tasks);
    const res = dag.validate();

    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes("self-dependency"))).toBe(true);
  });

  it("detects missing / non-existent dependencies", () => {
    const tasks: Task[] = [
      { id: 1, title: "Orphan Child", description: "", completed: false, dependencies: [999] },
    ];

    const dag = new TaskDAG(tasks);
    const res = dag.validate();

    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes("non-existent Task #999"))).toBe(true);
  });

  it("detects conflicting file ownership between unordered tasks", () => {
    const tasks: Task[] = [
      { id: 1, title: "Task A", description: "", completed: false, dependencies: [], ownedFiles: ["src/App.tsx"] },
      { id: 2, title: "Task B", description: "", completed: false, dependencies: [], ownedFiles: ["src/App.tsx"] },
    ];

    const dag = new TaskDAG(tasks);
    const res = dag.validate();

    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes("FILE_OWNERSHIP_CONFLICT"))).toBe(true);
  });

  it("allows shared file ownership if explicit dependency ordering exists", () => {
    const tasks: Task[] = [
      { id: 1, title: "Create App Shell", description: "", completed: false, dependencies: [], ownedFiles: ["src/App.tsx"] },
      { id: 2, title: "Attach Routes to App", description: "", completed: false, dependencies: [1], ownedFiles: ["src/App.tsx"] },
    ];

    const dag = new TaskDAG(tasks);
    const res = dag.validate();

    expect(res.valid).toBe(true);
  });

  it("computes downstream dependents correctly for failure propagation", () => {
    const tasks: Task[] = [
      { id: 1, title: "Root", description: "", completed: false, dependencies: [] },
      { id: 2, title: "Middle", description: "", completed: false, dependencies: [1] },
      { id: 3, title: "Leaf", description: "", completed: false, dependencies: [2] },
      { id: 4, title: "Independent", description: "", completed: false, dependencies: [] },
    ];

    const dag = new TaskDAG(tasks);
    const dependents = dag.getDownstreamDependents(1);

    expect(dependents.sort()).toEqual([2, 3]);
  });
});
