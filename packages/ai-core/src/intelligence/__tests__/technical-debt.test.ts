import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { TechnicalDebtEngine } from "../technical-debt-engine.js";

const DEBT_TEST_DIR = join(process.cwd(), ".tmp_test_p16_debt");

describe("AEGIS Phase 16 — Technical Debt Engine", () => {
  beforeEach(() => {
    if (existsSync(DEBT_TEST_DIR)) rmSync(DEBT_TEST_DIR, { recursive: true, force: true });
    mkdirSync(DEBT_TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(DEBT_TEST_DIR)) rmSync(DEBT_TEST_DIR, { recursive: true, force: true });
  });

  it("identifies accumulated TODOs and scores technical debt accurately", () => {
    writeFileSync(join(DEBT_TEST_DIR, "app.ts"), "// TODO: fix memory leak in handler\n// FIXME: add error check");

    const report = TechnicalDebtEngine.audit(DEBT_TEST_DIR, "gym_proj");
    expect(report.totalDebtScore).toBeGreaterThan(0);
    expect(report.items.some((i) => i.category === "TODO_ACCUMULATION")).toBe(true);
  });
});
