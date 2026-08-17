import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ProjectGenerationLock } from "../project-generation-lock.js";

const LOCK_DIR = join(process.cwd(), ".tmp_test_gen_lock");

describe("ProjectGenerationLock", () => {
  beforeEach(() => {
    if (existsSync(LOCK_DIR)) rmSync(LOCK_DIR, { recursive: true, force: true });
    mkdirSync(LOCK_DIR, { recursive: true });
    ProjectGenerationLock.reset();
  });

  afterEach(() => {
    ProjectGenerationLock.reset();
    if (existsSync(LOCK_DIR)) rmSync(LOCK_DIR, { recursive: true, force: true });
  });

  it("acquires and releases exclusive lock for a generation", () => {
    const acquire1 = ProjectGenerationLock.acquireLock(LOCK_DIR, "gen_1", "proj_1", "Add search");
    expect(acquire1.acquired).toBe(true);
    expect(ProjectGenerationLock.isLocked(LOCK_DIR)).toBe(true);

    // Second generation on same project must be rejected
    const acquire2 = ProjectGenerationLock.acquireLock(LOCK_DIR, "gen_2", "proj_1", "Remove filter");
    expect(acquire2.acquired).toBe(false);
    expect(acquire2.error).toContain("PROJECT_GENERATION_LOCKED");

    // Release gen_1 lock
    const released = ProjectGenerationLock.releaseLock(LOCK_DIR, "gen_1");
    expect(released).toBe(true);
    expect(ProjectGenerationLock.isLocked(LOCK_DIR)).toBe(false);

    // Now gen_2 can acquire
    const acquire2Again = ProjectGenerationLock.acquireLock(LOCK_DIR, "gen_2", "proj_1", "Remove filter");
    expect(acquire2Again.acquired).toBe(true);
  });
});
