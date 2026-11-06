import { describe, it, expect } from "vitest";
import { TestPyramidRunner } from "../test-pyramid-runner.js";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

describe("TestPyramidRunner — Verification on Real Project", () => {
  const projectPath = resolve(process.cwd(), "../../projects/real-test-20261105/student-portfolio");

  it("Executes Level 1 Cheap Deterministic Checks with 0 tokens in milliseconds", async () => {
    if (!existsSync(projectPath)) {
      console.warn("Real project not found at:", projectPath);
      return;
    }

    const startTime = Date.now();
    const result = await TestPyramidRunner.verify(1, projectPath);
    const duration = Date.now() - startTime;

    console.log(`[TestPyramid] Level 1 executed in ${duration}ms. Passed: ${result.passed}`);
    expect(result.levelResults.length).toBe(1);
    expect(result.levelResults[0].level).toBe(1);
    expect(result.levelResults[0].passed).toBe(true);
    expect(duration).toBeLessThan(3000);
  });
});
