import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RepositoryScanner } from "../repository-scanner.js";
import { SurgicalPatchPlanner } from "../surgical-patch-planner.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-bf-patch-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("SurgicalPatchPlanner — Search/Replace & Collision Safety", () => {
  it("plans CREATE for new files and SURGICAL_PATCH for existing files", () => {
    const testDir = createTempDir("create-vs-patch");
    try {
      writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "app" }), "utf8");
      mkdirSync(join(testDir, "src"), { recursive: true });
      writeFileSync(join(testDir, "src", "routes.tsx"), 'export const routes = [\n  { path: "/tasks", element: <Tasks /> }\n];', "utf8");

      const contract = RepositoryScanner.scan(testDir, "Add export");

      const planResult = SurgicalPatchPlanner.planPatches(
        contract,
        [{ path: "src/services/csvExport.ts", content: "export function exportCsv() {}" }],
        [{
          path: "src/routes.tsx",
          search: '{ path: "/tasks", element: <Tasks /> }',
          replace: '{ path: "/tasks", element: <Tasks /> },\n  { path: "/export", element: <Export /> }',
          reason: "Register export route"
        }]
      );

      expect(planResult.success).toBe(true);
      expect(planResult.plannedPatches.length).toBe(2);
      expect(planResult.plannedPatches[0].operation).toBe("CREATE");
      expect(planResult.plannedPatches[1].operation).toBe("SURGICAL_PATCH");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("halts with SYMBOL_COLLISION if symbol already exists in target file", () => {
    const testDir = createTempDir("symbol-collision");
    try {
      writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "app" }), "utf8");
      mkdirSync(join(testDir, "src"), { recursive: true });
      writeFileSync(join(testDir, "src", "utils.ts"), "export const exportCsv = () => {};", "utf8");

      const contract = RepositoryScanner.scan(testDir, "Add export");

      const planResult = SurgicalPatchPlanner.planPatches(
        contract,
        [],
        [{
          path: "src/utils.ts",
          search: "export const exportCsv",
          replace: "export const exportCsv = () => { /* new */ };",
          reason: "Update export",
          symbols: ["exportCsv"]
        }]
      );

      expect(planResult.success).toBe(false);
      expect(planResult.collisionDetected).toBe(true);
      expect(planResult.error).toContain("SYMBOL_COLLISION");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("halts when search block is not found in target file", () => {
    const testDir = createTempDir("search-not-found");
    try {
      writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "app" }), "utf8");
      mkdirSync(join(testDir, "src"), { recursive: true });
      writeFileSync(join(testDir, "src", "App.tsx"), "export const App = () => <div>Hello</div>;", "utf8");

      const contract = RepositoryScanner.scan(testDir, "Add export");

      const planResult = SurgicalPatchPlanner.planPatches(
        contract,
        [],
        [{
          path: "src/App.tsx",
          search: "non_existent_code_block",
          replace: "replacement_code",
          reason: "Patch App"
        }]
      );

      expect(planResult.success).toBe(false);
      expect(planResult.error).toContain("SEARCH_BLOCK_NOT_FOUND");
    } finally {
      safeCleanup(testDir);
    }
  });
});
