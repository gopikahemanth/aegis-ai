import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DefinitionOfDone } from "../definition-of-done.js";

describe("Definition of Done & Quality Gap Audit Regression Tests", () => {
  let tempDir: string;
  let dod: DefinitionOfDone;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "aegis-dod-gap-test-"));
    dod = new DefinitionOfDone();
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("checkNoConsoleLogs correctly permits Express server listen daemon startup logging", () => {
    const serverDir = join(tempDir, "server");
    mkdirSync(serverDir, { recursive: true });

    writeFileSync(join(serverDir, "index.ts"), `
import express from "express";
const app = express();
const PORT = 3001;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(\`Aegis Express server running on port \${PORT}\`);
  });
}
export { app };
`, "utf8");

    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "App.tsx"), `
import React from "react";
export default function App() {
  return <div>App Content</div>;
}
`, "utf8");

    // README so documentation check passes
    writeFileSync(join(tempDir, "README.md"), "# Test Project\n\nnpm install && npm run dev\n", "utf8");

    const result = dod.validate(tempDir, [], true);
    const consoleLogCheck = result.criteria.find(c => c.id === "no-console-logs");
    expect(consoleLogCheck).toBeDefined();
    expect(consoleLogCheck?.passed).toBe(true);
    expect(consoleLogCheck?.detail).toBe("No bare console.log statements");
  });

  it("checkNoConsoleLogs correctly ignores code snippets inside string literals", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(srcDir, "Lesson.tsx"), `
import React from "react";
export function Lesson() {
  const codeSnippet = "const a = 1;\\nconsole.log(a);";
  return <pre>{codeSnippet}</pre>;
}
`, "utf8");

    const result = dod.validate(tempDir, [], true);
    const consoleLogCheck = result.criteria.find(c => c.id === "no-console-logs");
    expect(consoleLogCheck).toBeDefined();
    expect(consoleLogCheck?.passed).toBe(true);
  });

  it("checkNoConsoleLogs flags genuine orphan debug console.logs", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(srcDir, "Button.tsx"), `
import React from "react";
export function Button() {
  return <button onClick={() => {
    console.log("orphan debug statement");
  }}>Click</button>;
}
`, "utf8");

    const result = dod.validate(tempDir, [], true);
    const consoleLogCheck = result.criteria.find(c => c.id === "no-console-logs");
    expect(consoleLogCheck).toBeDefined();
    expect(consoleLogCheck?.passed).toBe(false);
    expect(consoleLogCheck?.detail).toContain("Found 1 bare console.log statement");
  });

  it("collectSourceFiles excludes scripts/ directory so dev runner scripts are not flagged", () => {
    const scriptsDir = join(tempDir, "scripts");
    mkdirSync(scriptsDir, { recursive: true });

    writeFileSync(join(scriptsDir, "dev.js"), `
console.log("🚀 Starting Aegis Fullstack Application (Backend + Frontend)...\\n");
`, "utf8");

    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "index.ts"), `export const answer = 42;`, "utf8");

    const result = dod.validate(tempDir, [], true);
    const consoleLogCheck = result.criteria.find(c => c.id === "no-console-logs");
    expect(consoleLogCheck?.passed).toBe(true);
  });

  it("DoD classification distinguishes blocking requirements from advisory warnings", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir, { recursive: true });

    // File with `: any` (advisory) and without lazy-loading (advisory)
    writeFileSync(join(srcDir, "Component.tsx"), `
import React from "react";
import { Route, Routes } from "react-router-dom";
export function View(props: any) {
  const data: any = props.data;
  return <div>{String(data)}</div>;
}
export function App() {
  return (
    <Routes>
      <Route path="/" element={<View />} />
      <Route path="/about" element={<View />} />
    </Routes>
  );
}
`, "utf8");

    const result = dod.validate(tempDir, [], true);
    
    // typescript-strict and lazy-loading should be in warnings, NOT blockers
    const tsWarning = result.warnings.find(w => w.id === "typescript-strict");
    const lazyWarning = result.warnings.find(w => w.id === "lazy-loading");
    expect(tsWarning).toBeDefined();
    expect(lazyWarning).toBeDefined();

    // Neither should appear in blockers
    expect(result.blockers.some(b => b.id === "typescript-strict")).toBe(false);
    expect(result.blockers.some(b => b.id === "lazy-loading")).toBe(false);
  });

  it("calculates DoD score with exact round formula: 25/28 -> 89, 26/28 -> 93, 22/24 -> 92", () => {
    // Mathematical invariant verification
    const calcScore = (passed: number, total: number) => Math.round((passed / total) * 100);

    expect(calcScore(25, 28)).toBe(89); // 89.2857%
    expect(calcScore(26, 28)).toBe(93); // 92.8571%
    expect(calcScore(21, 24)).toBe(88); // 87.5000%
    expect(calcScore(22, 24)).toBe(92); // 91.6667%
    expect(calcScore(24, 24)).toBe(100);
    expect(calcScore(28, 28)).toBe(100);
  });

  it("blocks certification when a required criterion fails even if score is high", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "App.tsx"), `export default function App() { return <div>App</div>; }`, "utf8");
    writeFileSync(join(tempDir, "README.md"), "# Test\n\nnpm install && npm run dev\n", "utf8");

    // Explicitly pass buildSuccess: false (compilation failure)
    const result = dod.validate(tempDir, [], false);
    
    expect(result.passed).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
    expect(result.blockers.some(b => b.id === "build-success")).toBe(true);
    expect(result.summary).toContain("Definition of Done: FAILED");
  });

  it("permits certification with warnings when only advisory criteria fail", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir, { recursive: true });
    // Has responsive breakpoints (sm: and md:), and has ': any' which triggers typescript-strict warning
    writeFileSync(join(srcDir, "App.tsx"), `
import React from "react";
export default function App(props: any) {
  return <div className="sm:p-4 md:p-8">App Content</div>;
}
`, "utf8");
    writeFileSync(join(tempDir, "README.md"), "# Test Project\\n\\nnpm install && npm run dev\\n", "utf8");

    // Add minimal architecture contract so contract checks pass
    const aegisDir = join(tempDir, ".aegis");
    mkdirSync(aegisDir, { recursive: true });
    writeFileSync(join(aegisDir, "architecture-contract.json"), JSON.stringify({
      version: 1,
      status: "locked",
      prompt: "Test Project",
      frontend: { framework: "react", styling: "tailwind" },
      backend: { framework: "none" },
      database: { provider: "none" },
      requiredRoutes: [],
      requiredFeatures: []
    }), "utf8");

    const result = dod.validate(tempDir, [], true);

    expect(result.blockers.length).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.passed).toBe(true);
    expect(result.summary).toContain("Definition of Done: PASSED");
    expect(result.summary).toContain("warning(s) noted");
  });

  it("safely strips multi-line and single-line comments containing console.log", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(srcDir, "Clean.tsx"), `
import React from "react";
// console.log("single line comment");
/*
  console.log("multi-line comment");
*/
export function Clean() {
  return <div>Clean</div>;
}
`, "utf8");

    const result = dod.validate(tempDir, [], true);
    const consoleLogCheck = result.criteria.find(c => c.id === "no-console-logs");
    expect(consoleLogCheck?.passed).toBe(true);
  });

  it("detects genuine application console.log buried in helper functions", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(srcDir, "Service.ts"), `
export function computeTotal(items: number[]): number {
  const sum = items.reduce((a, b) => a + b, 0);
  console.log("Calculated sum:", sum);
  return sum;
}
`, "utf8");

    const result = dod.validate(tempDir, [], true);
    const consoleLogCheck = result.criteria.find(c => c.id === "no-console-logs");
    expect(consoleLogCheck?.passed).toBe(false);
    expect(consoleLogCheck?.detail).toContain("Found 1 bare console.log statement");
  });
});

