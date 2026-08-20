import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { BrownfieldWriteGuard } from "../brownfield-write-guard.js";
import { BrownfieldGitGuard } from "../brownfield-git-guard.js";
import { BrownfieldTransactionManager } from "../brownfield-transaction-manager.js";
import { BaselineRegressionValidator } from "../baseline-regression-validator.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-bf-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
  } catch {}
}

describe("Brownfield Safety & Regression Invariants", () => {
  it("WriteGuard: rejects CREATE on existing file and allows SURGICAL_PATCH", () => {
    const testDir = createTempDir("write-guard");
    try {
      writeFileSync(join(testDir, "existing.ts"), "const a = 1;", "utf8");

      const createCheck = BrownfieldWriteGuard.validateWrite(testDir, "existing.ts", "CREATE");
      expect(createCheck.allowed).toBe(false);
      expect(createCheck.reason).toContain("WRITE_BLOCKED");

      const patchCheck = BrownfieldWriteGuard.validateWrite(testDir, "existing.ts", "SURGICAL_PATCH");
      expect(patchCheck.allowed).toBe(true);

      const newFileCheck = BrownfieldWriteGuard.validateWrite(testDir, "new-service.ts", "CREATE");
      expect(newFileCheck.allowed).toBe(true);
    } finally {
      safeCleanup(testDir);
    }
  });

  it("GitGuard: blocks modification when target file has uncommitted user edits (GIT_DIRTY_TARGET)", () => {
    const testDir = createTempDir("git-dirty-target");
    try {
      execSync("git init", { cwd: testDir, stdio: "ignore" });
      execSync("git config user.name 'Test'", { cwd: testDir, stdio: "ignore" });
      execSync("git config user.email 'test@test.com'", { cwd: testDir, stdio: "ignore" });

      writeFileSync(join(testDir, "target.ts"), "initial content", "utf8");
      writeFileSync(join(testDir, "unrelated.ts"), "unrelated content", "utf8");
      execSync("git add target.ts unrelated.ts", { cwd: testDir, stdio: "ignore" });
      execSync('git commit -m "initial"', { cwd: testDir, stdio: "ignore" });

      // User modifies target.ts without committing
      writeFileSync(join(testDir, "target.ts"), "user modified content", "utf8");

      const preflight = BrownfieldGitGuard.evaluatePreflight(testDir, ["target.ts"]);
      expect(preflight.allowed).toBe(false);
      expect(preflight.status).toBe("DIRTY_TARGET_CONFLICT");
      expect(preflight.reason).toContain("GIT_DIRTY_TARGET");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("GitGuard: allows modification when only unrelated files are dirty (DIRTY_SAFE) and stages ONLY touched files", () => {
    const testDir = createTempDir("git-dirty-safe");
    try {
      execSync("git init", { cwd: testDir, stdio: "ignore" });
      execSync("git config user.name 'Test'", { cwd: testDir, stdio: "ignore" });
      execSync("git config user.email 'test@test.com'", { cwd: testDir, stdio: "ignore" });

      writeFileSync(join(testDir, "target.ts"), "initial target", "utf8");
      writeFileSync(join(testDir, "unrelated.ts"), "initial unrelated", "utf8");
      execSync("git add target.ts unrelated.ts", { cwd: testDir, stdio: "ignore" });
      execSync('git commit -m "initial"', { cwd: testDir, stdio: "ignore" });

      // User modifies unrelated.ts
      writeFileSync(join(testDir, "unrelated.ts"), "user edits in progress", "utf8");

      const preflight = BrownfieldGitGuard.evaluatePreflight(testDir, ["target.ts"]);
      expect(preflight.allowed).toBe(true);
      expect(preflight.status).toBe("DIRTY_SAFE");

      // Aegis modifies target.ts and commits ONLY touched files
      writeFileSync(join(testDir, "target.ts"), "aegis modified target", "utf8");
      const commitRes = BrownfieldGitGuard.commitTouchedFiles(testDir, ["target.ts"], "feat: update target");
      expect(commitRes).toBe(true);

      // Verify that unrelated.ts remains modified and uncommitted (preserved)
      const status = execSync("git status --porcelain", { cwd: testDir, encoding: "utf8" });
      expect(status).toContain("M unrelated.ts");
      expect(status).not.toContain("target.ts");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("TransactionManager: exact rollback restores modified file bytes and unlinks newly created files", () => {
    const testDir = createTempDir("tx-rollback");
    try {
      const origContent = "export const original = 42;\n// user comments";
      writeFileSync(join(testDir, "existing.ts"), origContent, "utf8");

      const tx = new BrownfieldTransactionManager();
      const chk = tx.createCheckpoint(testDir, ["existing.ts", "new-file.ts"]);

      // Apply mutations
      writeFileSync(join(testDir, "existing.ts"), "MUTATED CODE", "utf8");
      writeFileSync(join(testDir, "new-file.ts"), "NEW CODE", "utf8");

      expect(readFileSync(join(testDir, "existing.ts"), "utf8")).toBe("MUTATED CODE");
      expect(existsSync(join(testDir, "new-file.ts"))).toBe(true);

      // Rollback
      const rolledBack = tx.rollback(chk);
      expect(rolledBack).toBe(true);

      // Verify exact restoration
      expect(readFileSync(join(testDir, "existing.ts"), "utf8")).toBe(origContent);
      expect(existsSync(join(testDir, "new-file.ts"))).toBe(false);
    } finally {
      safeCleanup(testDir);
    }
  });

  it("RegressionValidator: detects regression when test pass rate decreases", () => {
    const baseline = {
      status: "PASS" as const,
      framework: "vitest" as const,
      totalTests: 10,
      passedTests: 10,
      failedTests: 0,
      skippedTests: 0,
      durationMs: 1000,
      failedTestNames: [],
      output: "",
    };

    const postPass = {
      status: "PASS" as const,
      framework: "vitest" as const,
      totalTests: 12,
      passedTests: 12,
      failedTests: 0,
      skippedTests: 0,
      durationMs: 1200,
      failedTestNames: [],
      output: "",
    };

    const report1 = BaselineRegressionValidator.evaluateRegression(baseline, postPass, 2);
    expect(report1.hasRegression).toBe(false);
    expect(report1.newTestsAdded).toBe(2);

    const postFail = {
      status: "FAIL" as const,
      framework: "vitest" as const,
      totalTests: 12,
      passedTests: 9,
      failedTests: 3,
      skippedTests: 0,
      durationMs: 1200,
      failedTestNames: ["test1", "test2", "test3"],
      output: "",
    };

    const report2 = BaselineRegressionValidator.evaluateRegression(baseline, postFail, 2);
    expect(report2.hasRegression).toBe(true);
    expect(report2.regressionMessage).toContain("REGRESSION_DETECTED");
  });
});
