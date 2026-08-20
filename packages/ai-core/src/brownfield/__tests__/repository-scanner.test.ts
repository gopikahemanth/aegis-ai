import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RepositoryScanner } from "../repository-scanner.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-bf-scan-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("RepositoryScanner — Mode Detection & Project Discovery", () => {
  it("detects GREENFIELD mode for an empty directory", () => {
    const testDir = createTempDir("greenfield");
    try {
      const mode = RepositoryScanner.detectMode(testDir);
      expect(mode).toBe("GREENFIELD");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("detects BROWNFIELD mode when package.json and source files exist", () => {
    const testDir = createTempDir("brownfield");
    try {
      writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "my-app", dependencies: { react: "^18.0.0" } }), "utf8");
      mkdirSync(join(testDir, "src"), { recursive: true });
      writeFileSync(join(testDir, "src", "App.tsx"), "export const App = () => <div>App</div>;", "utf8");

      const mode = RepositoryScanner.detectMode(testDir);
      expect(mode).toBe("BROWNFIELD");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("scans package manager, stack, entrypoints, and test inventory", () => {
    const testDir = createTempDir("full-scan");
    try {
      writeFileSync(join(testDir, "package.json"), JSON.stringify({
        name: "task-manager",
        dependencies: { react: "^18.3.1", express: "^4.19.2" },
        devDependencies: { vitest: "^1.6.0" },
        scripts: { test: "vitest run" }
      }), "utf8");
      writeFileSync(join(testDir, "pnpm-lock.yaml"), "lockfileVersion: 5.4", "utf8");
      writeFileSync(join(testDir, "tsconfig.json"), "{}", "utf8");

      mkdirSync(join(testDir, "src", "__tests__"), { recursive: true });
      writeFileSync(join(testDir, "src", "main.tsx"), "console.log('main');", "utf8");
      writeFileSync(join(testDir, "src", "routes.tsx"), 'export const routes = [{ path: "/tasks", element: null }];', "utf8");
      writeFileSync(join(testDir, "src", "__tests__", "app.test.tsx"), "describe('app', () => {});", "utf8");

      mkdirSync(join(testDir, "prisma"), { recursive: true });
      writeFileSync(join(testDir, "prisma", "schema.prisma"), "model Task {\n  id String @id\n  title String\n}", "utf8");

      const contract = RepositoryScanner.scan(testDir, "Add CSV export for tasks");

      expect(contract.mode).toBe("BROWNFIELD");
      expect(contract.stack.framework).toBe("fullstack-react-express");
      expect(contract.stack.packageManager).toBe("pnpm");
      expect(contract.stack.hasTypeScript).toBe(true);
      expect(contract.architecture.entryPoints).toContain("src/main.tsx");
      expect(contract.architecture.routerFile).toBe("src/routes.tsx");
      expect(contract.architecture.routes).toContain("/tasks");
      expect(contract.architecture.models).toContain("Task");
      expect(contract.testInventory.framework).toBe("vitest");
      expect(contract.testInventory.testFiles).toContain("src/__tests__/app.test.tsx");
    } finally {
      safeCleanup(testDir);
    }
  });
});
