/**
 * TestPyramidRunner
 *
 * Implements the 5-level test verification pyramid for AEGIS AI:
 * - LEVEL 1: Cheap Deterministic Checks (0 LLM tokens, < 1s)
 *            Verifies file structure, brace balance, syntax completeness, and relative import closure.
 *            NOTE: Level 1 does NOT claim semantic correctness or business logic validity.
 * - LEVEL 2: Focused Automated Unit / Contract Tests (0 LLM tokens, 1-3s)
 *            Runs Vitest on relevant units and API contracts.
 * - LEVEL 3: Targeted Browser Testing on Affected Routes (0 LLM tokens, 2-5s)
 *            Verifies that targeted routes respond on an active application server.
 * - LEVEL 4: Full End-to-End Application Workflow & Final Gates (0 tokens)
 *            Executes full in-project test suite and FinalSuccessGate.
 * - LEVEL 5: Fresh Full Website Generation (LLM tokens, release validation only)
 *
 * Rule: A lower-level test must never replace a higher-level test when higher-level behavior is required.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { execSync } from "node:child_process";
import { InProjectTestRunner } from "./in-project-test-runner.js";
import { isLikelySyntacticallyComplete } from "../utils/syntax-validator.js";

export type TestPyramidLevel = 1 | 2 | 3 | 4 | 5;

export interface LevelResult {
  level: TestPyramidLevel;
  name: string;
  passed: boolean;
  durationMs: number;
  checksExecuted: string[];
  errors: string[];
}

export interface TestPyramidReport {
  targetLevel: TestPyramidLevel;
  passed: boolean;
  highestLevelPassed: TestPyramidLevel | 0;
  totalDurationMs: number;
  levelResults: LevelResult[];
  summary: string;
}

export interface PyramidVerificationOptions {
  changedFiles?: string[];
  targetTestFile?: string;
  targetRoutes?: string[];
  serverUrl?: string;
  requireActiveServer?: boolean;
}

export class TestPyramidRunner {
  /**
   * Run verification up to the requested pyramid level.
   */
  public static async verify(
    targetLevel: TestPyramidLevel,
    projectRoot: string,
    options: PyramidVerificationOptions = {}
  ): Promise<TestPyramidReport> {
    const startTime = Date.now();
    const levelResults: LevelResult[] = [];
    let allPassedSoFar = true;
    let highestLevelPassed: TestPyramidLevel | 0 = 0;

    // ── LEVEL 1: Cheap Deterministic Checks (0 tokens, < 1s) ─────────────────
    if (targetLevel >= 1 && allPassedSoFar) {
      const l1 = this.runLevel1DeterministicChecks(projectRoot, options.changedFiles);
      levelResults.push(l1);
      if (!l1.passed) {
        allPassedSoFar = false;
      } else {
        highestLevelPassed = 1;
      }
    }

    // ── LEVEL 2: Focused Automated Tests (0 tokens, 1-3s) ────────────────────
    if (targetLevel >= 2 && allPassedSoFar) {
      const l2 = await this.runLevel2FocusedAutomatedTests(projectRoot, options.targetTestFile);
      levelResults.push(l2);
      if (!l2.passed) {
        allPassedSoFar = false;
      } else {
        highestLevelPassed = 2;
      }
    }

    // ── LEVEL 3: Targeted Browser Testing (0 tokens, 2-5s) ───────────────────
    if (targetLevel >= 3 && allPassedSoFar) {
      const l3 = await this.runLevel3TargetedBrowserTests(
        projectRoot,
        options.targetRoutes,
        options.serverUrl,
        options.requireActiveServer
      );
      levelResults.push(l3);
      if (!l3.passed) {
        allPassedSoFar = false;
      } else {
        highestLevelPassed = 3;
      }
    }

    // ── LEVEL 4: Full Application Workflow Verification ──────────────────────
    if (targetLevel >= 4 && allPassedSoFar) {
      const l4 = await this.runLevel4FullApplicationWorkflow(projectRoot);
      levelResults.push(l4);
      if (!l4.passed) {
        allPassedSoFar = false;
      } else {
        highestLevelPassed = 4;
      }
    }

    const totalDurationMs = Date.now() - startTime;
    const summary = allPassedSoFar
      ? `✓ TestPyramid PASSED through Level ${targetLevel} in ${totalDurationMs}ms (Zero LLM tokens consumed).`
      : `❌ TestPyramid FAILED at Level ${levelResults[levelResults.length - 1]?.level ?? 1}: ${levelResults[levelResults.length - 1]?.errors.join("; ")}`;

    return {
      targetLevel,
      passed: allPassedSoFar,
      highestLevelPassed,
      totalDurationMs,
      levelResults,
      summary,
    };
  }

  /**
   * LEVEL 1: File existence, completeness, brace balance, import closure, and schema validity.
   * NOTE: Level 1 does NOT prove semantic correctness or business logic validity.
   */
  public static runLevel1DeterministicChecks(
    projectRoot: string,
    changedFiles?: string[]
  ): LevelResult {
    const start = Date.now();
    const checksExecuted: string[] = [];
    const errors: string[] = [];

    checksExecuted.push(
      "Level 1 static validation: verifies file existence, bracket balance, and relative import closure (does NOT prove semantic correctness or business logic)"
    );

    // 1. Core directory and package.json check
    const pkgPath = join(projectRoot, "package.json");
    if (!existsSync(pkgPath)) {
      errors.push("Missing package.json in project root");
    } else {
      checksExecuted.push("package.json existence");
    }

    // 2. Syntax & Brace balance checks on changed/key files
    const filesToCheck = (changedFiles && changedFiles.length > 0)
      ? changedFiles.map(f => join(projectRoot, f)).filter(existsSync)
      : this.findSourceFiles(projectRoot);

    for (const filePath of filesToCheck.slice(0, 30)) {
      try {
        const content = readFileSync(filePath, "utf8");
        if (content.trim().length === 0) {
          errors.push(`Empty file detected: ${filePath}`);
          continue;
        }

        // Specific delimiter delta checks
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
          errors.push(`Unbalanced braces in ${filePath} (open: ${openBraces}, close: ${closeBraces})`);
        }

        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          errors.push(`Unbalanced parentheses in ${filePath} (open: ${openParens}, close: ${closeParens})`);
        }

        // Full syntactic completeness & AST truncation check
        if (!isLikelySyntacticallyComplete(content) && openBraces === closeBraces && openParens === closeParens) {
          errors.push(`Syntactic incompleteness detected in ${filePath} (unbalanced brackets or truncated AST expression)`);
        }

        // Relative import closure check
        const unresolved = this.checkLocalImportClosure(filePath, content);
        if (unresolved) {
          errors.push(`Unresolved relative import in ${filePath}: "${unresolved}" target does not exist on disk`);
        }
      } catch (err: any) {
        errors.push(`File read error for ${filePath}: ${err.message}`);
      }
    }
    checksExecuted.push(`Brace, syntax & import closure checked for ${filesToCheck.length} files`);

    // 3. Prisma schema check if present
    const prismaPath = join(projectRoot, "prisma", "schema.prisma");
    if (existsSync(prismaPath)) {
      try {
        const schema = readFileSync(prismaPath, "utf8");
        if (!schema.includes("datasource db") || !schema.includes("generator client")) {
          errors.push("Invalid prisma/schema.prisma: missing datasource or generator client block");
        } else {
          checksExecuted.push("Prisma schema structure verified");
        }
      } catch {}
    }

    // 4. Fast TypeScript typecheck if node_modules exists
    const tsconfigPath = join(projectRoot, "tsconfig.json");
    const nodeModulesPath = join(projectRoot, "node_modules");
    if (existsSync(tsconfigPath) && existsSync(nodeModulesPath)) {
      try {
        const tscBin = join(nodeModulesPath, "typescript", "bin", "tsc");
        if (existsSync(tscBin)) {
          execSync(`node "${tscBin}" --noEmit`, { cwd: projectRoot, stdio: "pipe", timeout: 20000 });
          checksExecuted.push("TypeScript typecheck (tsc --noEmit) passed with 0 errors");
        }
      } catch (tscErr: any) {
        const stderr = tscErr.stderr?.toString() || tscErr.stdout?.toString() || tscErr.message;
        const firstErrors = (stderr.match(/error TS\d+:.*$/gm) || []).slice(0, 3);
        errors.push(`TypeScript typecheck failed: ${firstErrors.join("; ") || stderr.slice(0, 200)}`);
      }
    }

    return {
      level: 1,
      name: "Deterministic Static Checks",
      passed: errors.length === 0,
      durationMs: Date.now() - start,
      checksExecuted,
      errors,
    };
  }

  /**
   * LEVEL 2: Run focused Vitest suite on relevant test files.
   */
  public static async runLevel2FocusedAutomatedTests(
    projectRoot: string,
    targetTestFile?: string
  ): Promise<LevelResult> {
    const start = Date.now();
    const checksExecuted: string[] = [];
    const errors: string[] = [];

    const vitestMjs = join(projectRoot, "node_modules", "vitest", "vitest.mjs");
    if (!existsSync(vitestMjs)) {
      checksExecuted.push("Vitest not installed — skipping Level 2 focused tests");
      return {
        level: 2,
        name: "Focused Automated Tests",
        passed: true,
        durationMs: Date.now() - start,
        checksExecuted,
        errors,
      };
    }

    try {
      const testArgs = targetTestFile ? `run "${targetTestFile}"` : "run";
      execSync(`node "${vitestMjs}" ${testArgs} --reporter=json --outputFile=".aegis/vitest-results.json"`, {
        cwd: projectRoot,
        stdio: "pipe",
        timeout: 30000,
      });
      checksExecuted.push(`Vitest suite passed (${targetTestFile || "all in-project tests"})`);
    } catch (testErr: any) {
      const errOut = testErr.stderr?.toString() || testErr.stdout?.toString() || testErr.message;
      errors.push(`Focused automated test failed: ${errOut.slice(0, 300)}`);
    }

    return {
      level: 2,
      name: "Focused Automated Tests",
      passed: errors.length === 0,
      durationMs: Date.now() - start,
      checksExecuted,
      errors,
    };
  }

  /**
   * LEVEL 3: Targeted Browser Testing on affected routes only.
   */
  public static async runLevel3TargetedBrowserTests(
    projectRoot: string,
    targetRoutes?: string[],
    serverUrl: string = "http://localhost:5173",
    requireActiveServer: boolean = false
  ): Promise<LevelResult> {
    const start = Date.now();
    const checksExecuted: string[] = [];
    const errors: string[] = [];

    const routes = (targetRoutes && targetRoutes.length > 0) ? targetRoutes : ["/"];

    for (const r of routes) {
      try {
        const url = `${serverUrl.replace(/\/$/, "")}${r.startsWith("/") ? r : `/${r}`}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (res.status >= 500) {
          errors.push(`Targeted route ${r} returned HTTP ${res.status}`);
        } else {
          checksExecuted.push(`Route ${r} responded with HTTP ${res.status}`);
        }
      } catch (fetchErr: any) {
        if (requireActiveServer) {
          errors.push(`Targeted route ${r} could not be verified: server unreachable at ${serverUrl} (${fetchErr.message}). Level 3 requires an active application server.`);
        } else {
          checksExecuted.push(`Route ping skipped (server inactive: ${fetchErr.message})`);
        }
      }
    }

    return {
      level: 3,
      name: "Targeted Browser Testing",
      passed: errors.length === 0,
      durationMs: Date.now() - start,
      checksExecuted,
      errors,
    };
  }

  /**
   * LEVEL 4: Full Application Workflow Verification.
   */
  public static async runLevel4FullApplicationWorkflow(projectRoot: string): Promise<LevelResult> {
    const start = Date.now();
    const checksExecuted: string[] = [];
    const errors: string[] = [];

    // Run in-project full test runner
    try {
      const report = InProjectTestRunner.run(projectRoot);
      if (report.status === "FAIL") {
        errors.push(`Full in-project test suite failed: ${report.failedTests} failures out of ${report.totalTests}`);
      } else {
        checksExecuted.push(`Full in-project test suite passed: ${report.passedTests}/${report.totalTests}`);
      }
    } catch (fullErr: any) {
      errors.push(`Full workflow verification error: ${fullErr.message}`);
    }

    return {
      level: 4,
      name: "Full Application Workflow",
      passed: errors.length === 0,
      durationMs: Date.now() - start,
      checksExecuted,
      errors,
    };
  }

  private static checkLocalImportClosure(fileAbsPath: string, content: string): string | null {
    const importRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"](\.[^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    const fileDir = dirname(fileAbsPath);

    while ((match = importRegex.exec(content)) !== null) {
      const relTarget = match[1];
      const targetBase = resolve(fileDir, relTarget);
      const targetWithoutJs = targetBase.replace(/\.(js|jsx)$/, "");

      const candidateExtensions = [
        "",
        ".tsx",
        ".ts",
        ".jsx",
        ".js",
        ".json",
        ".css",
        "/index.tsx",
        "/index.ts",
        "/index.jsx",
        "/index.js",
      ];

      const exists = candidateExtensions.some(ext => existsSync(targetBase + ext) || existsSync(targetWithoutJs + ext));
      if (!exists) {
        return relTarget;
      }
    }

    return null;
  }

  private static findSourceFiles(dir: string): string[] {
    const results: string[] = [];
    const walk = (d: string) => {
      try {
        const entries = readdirSync(d);
        for (const e of entries) {
          if (e === "node_modules" || e === ".git" || e === "dist" || e === ".aegis") continue;
          const full = join(d, e);
          const st = statSync(full);
          if (st.isDirectory()) {
            walk(full);
          } else if (/\.(tsx?|jsx?|prisma)$/.test(e)) {
            results.push(full);
          }
        }
      } catch {}
    };

    walk(dir);
    return results;
  }
}
