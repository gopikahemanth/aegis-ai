/**
 * Aegis V2.2 Project 1 — Automated In-Project Test Suite Generator Tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TestGeneratorAgent } from "../test-generator-agent.js";
import { InProjectTestRunner } from "../../validation/in-project-test-runner.js";
import { ArchitectureResolver } from "../../governance/architecture-resolver.js";
import { DomainContractDeriver } from "../../governance/domain-contract.js";
import { DynamicDataModelContract } from "../../governance/dynamic-data-model.js";

describe("Aegis V2.2 Project 1 — In-Project Test Suite Generator & Quality Suite", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `aegis-test-gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(tempDir, { recursive: true });
    mkdirSync(join(tempDir, "src"), { recursive: true });
    mkdirSync(join(tempDir, "server"), { recursive: true });

    // Mock initial package.json
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify(
        {
          name: "test-app",
          version: "1.0.0",
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
            express: "^4.19.0",
          },
          devDependencies: {
            typescript: "^5.0.0",
          },
          scripts: {
            build: "tsc",
          },
        },
        null,
        2
      ),
      "utf8"
    );

    // Mock App.tsx
    writeFileSync(
      join(tempDir, "src", "App.tsx"),
      `import React from "react";
export default function App() {
  return (
    <div>
      <h1>Task Dashboard</h1>
      <button onClick={() => console.log('clicked')}>Add Task</button>
    </div>
  );
}
`,
      "utf8"
    );
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("Test 1 — React component test generation: creates vitest.config.ts, test/setup.ts, and UI test", async () => {
    const arch = ArchitectureResolver.resolve("Build a Kanban task management app");
    const domain = DomainContractDeriver.derive(arch);

    const manifest = await TestGeneratorAgent.generate({
      projectRoot: tempDir,
      domainContract: domain,
      planHash: "hash_kanban_1",
    });

    expect(manifest.status).toBe("PASS");
    expect(manifest.framework).toBe("vitest");
    expect(existsSync(join(tempDir, "vitest.config.ts"))).toBe(true);
    expect(existsSync(join(tempDir, "test", "setup.ts"))).toBe(true);
    expect(existsSync(join(tempDir, "src", "__tests__", "app-flow.test.tsx"))).toBe(true);
  });

  it("Test 2 — User interaction test generation: UI tests verify button and heading existence", async () => {
    const arch = ArchitectureResolver.resolve("Build a modern task manager");
    const domain = DomainContractDeriver.derive(arch);

    const manifest = await TestGeneratorAgent.generate({
      projectRoot: tempDir,
      domainContract: domain,
      planHash: "hash_kanban_2",
    });

    const uiTestContent = readFileSync(join(tempDir, "src", "__tests__", "app-flow.test.tsx"), "utf8");
    expect(uiTestContent).toContain("UI Workflow");
    expect(uiTestContent).toContain("renders main dashboard interface and container");
    expect(manifest.testCases.some(tc => tc.type === "component")).toBe(true);
  });

  it("Test 3 — Express API test generation: server tests verify domain model integrity", async () => {
    const arch = ArchitectureResolver.resolve("Build a Task Management API");
    const domain = DomainContractDeriver.derive(arch);

    const manifest = await TestGeneratorAgent.generate({
      projectRoot: tempDir,
      domainContract: domain,
      planHash: "hash_kanban_3",
    });

    expect(existsSync(join(tempDir, "server", "__tests__", "api-health.test.ts"))).toBe(true);
    const serverTestContent = readFileSync(join(tempDir, "server", "__tests__", "api-health.test.ts"), "utf8");
    expect(serverTestContent).toContain("Backend API Verification");
    expect(manifest.testCases.some(tc => tc.type === "api")).toBe(true);
  });

  it("Test 4 — Validation and error test generation: verifies query parameter boundary handling", async () => {
    const arch = ArchitectureResolver.resolve("Build a Recipe application");
    const domain = DomainContractDeriver.derive(arch);

    await TestGeneratorAgent.generate({
      projectRoot: tempDir,
      domainContract: domain,
      planHash: "hash_recipe_4",
    });

    const serverTestContent = readFileSync(join(tempDir, "server", "__tests__", "api-health.test.ts"), "utf8");
    expect(serverTestContent).toContain("handles empty query parameters");
  });

  it("Test 5 — Feature-to-test mapping: manifest records structured feature coverage", async () => {
    const arch = ArchitectureResolver.resolve("Build an Expense Tracker");
    const domain = DomainContractDeriver.derive(arch);

    const manifest = await TestGeneratorAgent.generate({
      projectRoot: tempDir,
      domainContract: domain,
      planHash: "hash_expense_5",
    });

    expect(manifest.featureCoverage["dashboard"]).toBeDefined();
    expect(manifest.featureCoverage["navigation"]).toBeDefined();
    expect(manifest.featureCoverage["api-schema"]).toBeDefined();
  });

  it("Test 6 — Anti-trivial test quality check: rejects trivial assertions expect(true).toBe(true)", () => {
    const trivialTests = [
      `describe("Trivial", () => {
        it("trivial pass", () => {
          expect(true).toBe(true);
        });
      });`,
    ];

    const report = TestGeneratorAgent.auditTestQuality(trivialTests);
    expect(report.hasTrivialTests).toBe(true);
    expect(report.trivialViolations[0]).toContain("expect(true).toBe(true)");
  });

  it("Test 7 — Dependency integration: updates package.json with vitest and testing libraries", async () => {
    const arch = ArchitectureResolver.resolve("Build a Kanban application");
    const domain = DomainContractDeriver.derive(arch);

    await TestGeneratorAgent.generate({
      projectRoot: tempDir,
      domainContract: domain,
      planHash: "hash_deps_7",
    });

    const pkg = JSON.parse(readFileSync(join(tempDir, "package.json"), "utf8"));
    expect(pkg.scripts.test).toBe("vitest run");
    expect(pkg.devDependencies.vitest).toBeDefined();
    expect(pkg.devDependencies["@testing-library/react"]).toBeDefined();
    expect(pkg.devDependencies["@testing-library/jest-dom"]).toBeDefined();
  });

  it("Test 8 — Test command generation: exposes npm/pnpm test command", async () => {
    const arch = ArchitectureResolver.resolve("Build a Social Community application");
    const domain = DomainContractDeriver.derive(arch);

    await TestGeneratorAgent.generate({
      projectRoot: tempDir,
      domainContract: domain,
      planHash: "hash_social_8",
    });

    const pkg = JSON.parse(readFileSync(join(tempDir, "package.json"), "utf8"));
    expect(pkg.scripts.test).toBe("vitest run");
  });

  it("Test 9 — Structured runner parsing: handles non-testable projects with NOT_APPLICABLE status", () => {
    // Project without package.json test script
    const emptyDir = join(tmpdir(), `aegis-empty-${Date.now()}`);
    mkdirSync(emptyDir, { recursive: true });

    const report = InProjectTestRunner.run(emptyDir);
    expect(report.status).toBe("NOT_APPLICABLE");
    expect(report.totalTests).toBe(0);

    rmSync(emptyDir, { recursive: true, force: true });
  });

  it("Test 10 — Plan-hash consistency: throws error when input planHash does not match lockedPlan", async () => {
    const mockLockedPlan: any = {
      planHash: "canonical_hash_abc",
      tasks: [],
    };

    await expect(
      TestGeneratorAgent.generate({
        projectRoot: tempDir,
        lockedPlan: mockLockedPlan,
        planHash: "different_tampered_hash_xyz",
      })
    ).rejects.toThrow("PlanHash mismatch!");
  });
});
