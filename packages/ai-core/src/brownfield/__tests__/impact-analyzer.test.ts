import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RepositoryScanner } from "../repository-scanner.js";
import { ImpactAnalyzer } from "../impact-analyzer.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-bf-impact-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("ImpactAnalyzer — Minimal Impact Set Computation", () => {
  it("identifies domain-relevant target files while preserving unrelated files as READ_ONLY", () => {
    const testDir = createTempDir("domain-match");
    try {
      writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "app" }), "utf8");
      mkdirSync(join(testDir, "src", "features", "tasks"), { recursive: true });
      mkdirSync(join(testDir, "src", "features", "auth"), { recursive: true });
      mkdirSync(join(testDir, "server", "routes"), { recursive: true });

      writeFileSync(join(testDir, "src", "routes.tsx"), "export const routes = [];", "utf8");
      writeFileSync(join(testDir, "src", "features", "tasks", "TaskList.tsx"), "export const TaskList = () => null;", "utf8");
      writeFileSync(join(testDir, "src", "features", "auth", "LoginPage.tsx"), "export const LoginPage = () => null;", "utf8");
      writeFileSync(join(testDir, "server", "routes", "task.routes.ts"), "export const taskRouter = null;", "utf8");

      const contract = RepositoryScanner.scan(testDir, "Add CSV export to tasks");
      const impact = ImpactAnalyzer.analyze(contract, "Add CSV export to tasks");

      expect(impact.mayChange).toContain("src/features/tasks/TaskList.tsx");
      expect(impact.mayChange).toContain("server/routes/task.routes.ts");
      expect(impact.mayChange).toContain("src/routes.tsx");
      expect(impact.readOnly).toContain("src/features/auth/LoginPage.tsx");
      expect(impact.protected).toContain("package.json");
    } finally {
      safeCleanup(testDir);
    }
  });
});
