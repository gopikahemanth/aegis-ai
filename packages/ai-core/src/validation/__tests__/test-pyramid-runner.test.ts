import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { TestPyramidRunner } from "../test-pyramid-runner.js";

const TEST_DIR = join(process.cwd(), "test-pyramid-tmp");

describe("TestPyramidRunner — 5-Level Verification Pyramid", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(join(TEST_DIR, "src"), { recursive: true });
    writeFileSync(join(TEST_DIR, "package.json"), JSON.stringify({ name: "test-app", version: "1.0.0" }), "utf8");
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("Level 1: Passes when files are syntactically balanced", async () => {
    writeFileSync(join(TEST_DIR, "src", "App.tsx"), "export default function App() { return <div>Hello</div>; }\n", "utf8");
    const report = await TestPyramidRunner.verify(1, TEST_DIR, { changedFiles: ["src/App.tsx"] });
    expect(report.passed).toBe(true);
    expect(report.highestLevelPassed).toBe(1);
    expect(report.levelResults.length).toBe(1);
    expect(report.levelResults[0].errors.length).toBe(0);
  });

  it("Level 1: Fails immediately when brace imbalance exists without invoking any LLM", async () => {
    writeFileSync(join(TEST_DIR, "src", "Broken.tsx"), "export default function Broken() { return <div>Unbalanced;\n", "utf8");
    const report = await TestPyramidRunner.verify(1, TEST_DIR, { changedFiles: ["src/Broken.tsx"] });
    expect(report.passed).toBe(false);
    expect(report.highestLevelPassed).toBe(0);
    expect(report.levelResults[0].errors[0]).toContain("Unbalanced braces");
  });

  it("Level 2: Skips gracefully if Vitest is not installed in the dummy folder", async () => {
    writeFileSync(join(TEST_DIR, "src", "App.tsx"), "export default function App() { return <div>Hello</div>; }\n", "utf8");
    const report = await TestPyramidRunner.verify(2, TEST_DIR, { changedFiles: ["src/App.tsx"] });
    expect(report.passed).toBe(true);
    expect(report.highestLevelPassed).toBe(2);
    expect(report.levelResults.length).toBe(2);
  });
});
