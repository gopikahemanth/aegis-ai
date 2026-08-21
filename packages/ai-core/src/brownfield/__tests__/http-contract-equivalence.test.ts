/**
 * HTTP Contract Equivalence Test Suite — Aegis V2.3 Project 2 Phase 7.2
 *
 * Tests:
 * - Expense Tracker E2E: Renaming GET /api/expenses to GET /api/expense-records
 *   across Express route and client fetch calls matches clean reference repo.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { HttpContractExecutor } from "../runtime-contract/http/http-contract-executor.js";

function makeExpenseApp(dir: string, isRenamed: boolean) {
  mkdirSync(join(dir, "src", "routes"), { recursive: true });
  mkdirSync(join(dir, "src", "api"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "app", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");

  const pathStr = isRenamed ? "/api/expense-records" : "/api/expenses";

  writeFileSync(
    join(dir, "src", "routes", "expenseRoutes.ts"),
    `import { Router } from "express";\nexport const router = Router();\nrouter.get("${pathStr}", handler);\n`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "api", "expenseClient.ts"),
    `export async function getExpenses() {\n  return fetch("${pathStr}");\n}\n`,
    "utf8"
  );
}

describe("HTTP Contract Equivalence Tests", () => {
  let origDir: string;
  let cleanDir: string;

  beforeEach(() => {
    origDir = mkdtempSync(join(tmpdir(), "aegis-http-orig-"));
    cleanDir = mkdtempSync(join(tmpdir(), "aegis-http-clean-"));
  });

  afterEach(() => {
    try { rmSync(origDir, { recursive: true, force: true }); } catch {}
    try { rmSync(cleanDir, { recursive: true, force: true }); } catch {}
  });

  it("TEST 1: Expense Tracker E2E — Renaming GET /api/expenses matches clean reference repo", async () => {
    makeExpenseApp(origDir, false);
    makeExpenseApp(cleanDir, true);

    const executor = new HttpContractExecutor(origDir);
    const result = await executor.execute({
      projectPath: origDir,
      operation: "HTTP_ROUTE_RENAME",
      sourceFile: "src/routes/expenseRoutes.ts",
      endpointMethod: "GET",
      endpointPath: "/api/expenses",
      newPath: "/api/expense-records",
    });

    expect(result.success).toBe(true);

    const origRoute = readFileSync(join(origDir, "src/routes/expenseRoutes.ts"), "utf8").trim();
    const cleanRoute = readFileSync(join(cleanDir, "src/routes/expenseRoutes.ts"), "utf8").trim();
    expect(origRoute).toBe(cleanRoute);

    const origClient = readFileSync(join(origDir, "src/api/expenseClient.ts"), "utf8").trim();
    const cleanClient = readFileSync(join(cleanDir, "src/api/expenseClient.ts"), "utf8").trim();
    expect(origClient).toBe(cleanClient);
  });
});
