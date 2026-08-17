import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { TaskCacheManager } from "../task-cache.js";
import type { Task } from "../../planner/task.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_cache_phase5");

describe("TaskCacheManager — Deterministic Task Caching & Granular Invalidation", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
    TaskCacheManager.invalidateAll(TEST_DIR);
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("computes deterministic cache key for identical task inputs", () => {
    const task1: Task = {
      id: 1,
      title: "Task 1",
      description: "Do X",
      completed: false,
      ownedFiles: ["src/A.tsx"],
      allowedFiles: [],
      contractHashes: { architectureHash: "arch_100", domainHash: "dom_200" },
    };

    const task2: Task = {
      id: 1,
      title: "Task 1",
      description: "Do X",
      completed: false,
      ownedFiles: ["src/A.tsx"],
      allowedFiles: [],
      contractHashes: { architectureHash: "arch_100", domainHash: "dom_200" },
    };

    const key1 = TaskCacheManager.computeCacheKey(TEST_DIR, task1);
    const key2 = TaskCacheManager.computeCacheKey(TEST_DIR, task2);

    expect(key1).toBeTruthy();
    expect(key1).toBe(key2);
  });

  it("stores and retrieves cached task result on cache hit", () => {
    const task: Task = {
      id: 10,
      title: "Implement Service",
      description: "Build service",
      completed: false,
      ownedFiles: ["server/service.ts"],
      allowedFiles: [],
      contractHashes: { architectureHash: "arch_1" },
    };

    expect(TaskCacheManager.get(TEST_DIR, task)).toBeNull();

    TaskCacheManager.set(TEST_DIR, task, ["server/service.ts"]);
    const cached = TaskCacheManager.get(TEST_DIR, task);

    expect(cached).not.toBeNull();
    expect(cached?.taskId).toBe(10);
    expect(cached?.outputFiles).toEqual(["server/service.ts"]);
  });

  it("invalidates cache when contract changes", () => {
    const task: Task = {
      id: 20,
      title: "API Task",
      description: "Build API",
      completed: false,
      ownedFiles: ["server/api.ts"],
      allowedFiles: [],
      contractHashes: { apiHash: "api_v1" },
    };

    TaskCacheManager.set(TEST_DIR, task, ["server/api.ts"]);
    expect(TaskCacheManager.get(TEST_DIR, task)).not.toBeNull();

    // Invalidate API contract
    const count = TaskCacheManager.invalidateContract(TEST_DIR, "apiHash");
    expect(count).toBe(1);
    expect(TaskCacheManager.get(TEST_DIR, task)).toBeNull();
  });

  it("invalidates cache when owned input file content changes", () => {
    mkdirSync(join(TEST_DIR, "src"), { recursive: true });
    const inputFile = "src/Types.ts";
    writeFileSync(join(TEST_DIR, inputFile), "export type ID = string;", "utf8");


    const task: Task = {
      id: 30,
      title: "Component",
      description: "Build Component",
      completed: false,
      ownedFiles: ["src/Comp.tsx"],
      allowedFiles: [inputFile],
      contractHashes: {},
    };

    const keyBefore = TaskCacheManager.computeCacheKey(TEST_DIR, task);

    // Modify input file
    writeFileSync(join(TEST_DIR, inputFile), "export type ID = number;", "utf8");
    const keyAfter = TaskCacheManager.computeCacheKey(TEST_DIR, task);

    expect(keyBefore).not.toBe(keyAfter); // Cache key changes when input file changes!
  });
});
