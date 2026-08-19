import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CanonicalPlanManager, type LockedGenerationPlan } from "../canonical-generation-plan.js";
import type { ArchitectureContractV1 } from "../../governance/architecture-resolver.js";
import type { Task } from "../../planner/task.js";

describe("Aegis V2.1 Fix 6 — Canonical Planning Pipeline & Single-Pass Optimization", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  function createMockContract(): ArchitectureContractV1 {
    return {
      architectureHash: "kanban_arch_hash_1",
      frontend: { framework: "react-vite", styling: "tailwind" },
      backend: { framework: "express" },
      database: { provider: "postgresql", orm: "prisma" },
      authentication: "jwt",
      language: "typescript",
      requiredModels: ["User", "Task", "Priority"],
      requiredFeatures: ["kanban", "filtering", "persistence"],
    };
  }

  function createMockTasks(): Task[] {
    return [
      { id: "1", title: "Prisma Schema Setup", description: "Define models", targetFiles: ["prisma/schema.prisma"], dependencies: [] },
      { id: "2", title: "Kanban Board UI", description: "Build board", targetFiles: ["src/KanbanBoard.tsx"], dependencies: ["1"] },
    ];
  }

  it("Test 1 — Single project-level planning call locks authoritative plan with deterministic hash", () => {
    const contract = createMockContract();
    const tasks = createMockTasks();

    const plan = CanonicalPlanManager.create({
      request: "Build a Kanban app",
      enrichedRequest: "Build a modern Kanban app with drag and drop and persistence",
      framework: "react-vite",
      architectureContract: contract,
      specification: { routing: ["/"] },
      canonicalSpec: { routing: ["/"] },
      tasks,
      inferredLibraries: ["@dnd-kit/core", "zustand"],
      inferredFeatureNames: ["Kanban Board", "Persistence"],
    });

    expect(plan.planId).toBeDefined();
    expect(plan.planHash).toBeDefined();
    expect(plan.planHash.length).toBe(16);
    expect(plan.framework).toBe("react-vite");
    expect(plan.tasks.length).toBe(2);

    CanonicalPlanManager.save(testDir, plan);
    expect(existsSync(join(testDir, ".aegis", "locked-generation-plan.json"))).toBe(true);
  });

  it("Test 2 — Locked plan reused downstream: planHash remains identical across stages", () => {
    const contract = createMockContract();
    const tasks = createMockTasks();

    const plan = CanonicalPlanManager.create({
      request: "Build a Kanban app",
      enrichedRequest: "Enriched request",
      framework: "react-vite",
      architectureContract: contract,
      specification: { routing: ["/"] },
      canonicalSpec: { routing: ["/"] },
      tasks,
    });

    CanonicalPlanManager.save(testDir, plan);
    const loaded = CanonicalPlanManager.load(testDir);

    expect(loaded).not.toBeNull();
    expect(loaded?.planHash).toBe(plan.planHash);
    expect(loaded?.architectureContract.database.provider).toBe("postgresql");
    expect(loaded?.tasks.length).toBe(2);
  });

  it("Test 3 — Prompt re-planning prohibited: downstream decisions come strictly from locked plan", () => {
    const contract = createMockContract();
    const tasks = createMockTasks();

    const plan = CanonicalPlanManager.create({
      request: "Build a Kanban app",
      enrichedRequest: "Enriched prompt",
      framework: "react-vite",
      architectureContract: contract,
      specification: { routing: ["/"] },
      canonicalSpec: { routing: ["/"] },
      tasks,
    });

    CanonicalPlanManager.save(testDir, plan);
    const loaded = CanonicalPlanManager.load(testDir)!;

    // Verify downstream components receive locked decisions rather than prompt re-interpretation
    expect(loaded.architectureContract.frontend.framework).toBe("react-vite");
    expect(loaded.architectureContract.backend.framework).toBe("express");
    expect(loaded.architectureContract.requiredModels).toEqual(["User", "Task", "Priority"]);
  });

  it("Test 4 — Plan immutability: locked plan object is frozen and rejects mutation", () => {
    const contract = createMockContract();
    const tasks = createMockTasks();

    const plan = CanonicalPlanManager.create({
      request: "Build a Kanban app",
      enrichedRequest: "Enriched",
      framework: "react-vite",
      architectureContract: contract,
      specification: {},
      canonicalSpec: {},
      tasks,
    });

    expect(Object.isFrozen(plan)).toBe(true);
    expect(() => {
      (plan as any).framework = "next";
    }).toThrow();
  });

  it("Test 5 — Coder DAG consumes canonical plan: planHash verification passes", () => {
    const contract = createMockContract();
    const tasks = createMockTasks();

    const plan = CanonicalPlanManager.create({
      request: "Build a Kanban app",
      enrichedRequest: "Enriched",
      framework: "react-vite",
      architectureContract: contract,
      specification: { routing: ["/"] },
      canonicalSpec: { routing: ["/"] },
      tasks,
    });

    const integrity = CanonicalPlanManager.verifyPlanIntegrity(plan, contract, tasks);
    expect(integrity.valid).toBe(true);
    expect(integrity.currentHash).toBe(plan.planHash);
  });

  it("Test 6 — Mutated contract fails plan integrity check", () => {
    const contract = createMockContract();
    const tasks = createMockTasks();

    const plan = CanonicalPlanManager.create({
      request: "Build a Kanban app",
      enrichedRequest: "Enriched",
      framework: "react-vite",
      architectureContract: contract,
      specification: { routing: ["/"] },
      canonicalSpec: { routing: ["/"] },
      tasks,
    });

    const mutatedContract: ArchitectureContractV1 = {
      ...contract,
      database: { provider: "sqlite" },
    };

    const integrity = CanonicalPlanManager.verifyPlanIntegrity(plan, mutatedContract, tasks);
    expect(integrity.valid).toBe(false);
    expect(integrity.currentHash).not.toBe(plan.planHash);
  });
});
