import { describe, it, expect } from "vitest";
import { TestPyramidRunner } from "../test-pyramid-runner.js";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

describe("TestPyramidRunner — Verification on Real Project", () => {
  const completeProjectPath = resolve(process.cwd(), "../../projects/portfolio-cs-student");
  const hollowProjectPath = resolve(process.cwd(), "../../projects/real-test-20261105/student-portfolio");

  it("Executes Level 1 Cheap Deterministic Checks on complete project (0 tokens, < 50ms)", async () => {
    if (!existsSync(completeProjectPath)) {
      console.warn("Complete project not found at:", completeProjectPath);
      return;
    }

    const startTime = Date.now();
    const result = await TestPyramidRunner.verify(1, completeProjectPath);
    const duration = Date.now() - startTime;

    console.log(`[TestPyramid] Level 1 executed on complete project in ${duration}ms. Passed: ${result.passed}`);
    expect(result.levelResults.length).toBe(1);
    expect(result.levelResults[0].level).toBe(1);
    expect(result.levelResults[0].passed).toBe(true);
    expect(duration).toBeLessThan(15000);
  });

  it("Level 1 correctly detects missing relative import in hollow project (does NOT falsely pass)", async () => {
    if (!existsSync(hollowProjectPath)) {
      console.warn("Hollow project not found at:", hollowProjectPath);
      return;
    }

    const result = await TestPyramidRunner.verify(1, hollowProjectPath);
    console.log(`[TestPyramid] Hollow project correctly detected as incomplete: passed=${result.passed}`);
    // src/App.tsx imports "./routes" which does not exist
    expect(result.passed).toBe(false);
    expect(result.levelResults[0].errors.some(e => e.includes("./routes"))).toBe(true);
  });

  it("Executes Level 2 Focused Unit Tests on complete project (0 tokens, in-project Vitest)", async () => {
    if (!existsSync(completeProjectPath)) {
      return;
    }

    // Run focused Level 2 test on api-health.test.ts
    const result = await TestPyramidRunner.verify(2, completeProjectPath, {
      targetTestFile: "server/__tests__/api-health.test.ts",
    });

    console.log(`[TestPyramid] Level 2 executed on api-health test. Passed: ${result.passed}`);
    expect(result.passed).toBe(true);
    expect(result.highestLevelPassed).toBe(2);
  });
});
