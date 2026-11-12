import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { RootCauseRepairEngine } from "../root-cause-repair-engine.js";
import * as fs from "fs";
import * as path from "path";

const TEST_DIR = path.join(process.cwd(), ".tmp_test_repair_engine");

describe("Phase 9: RootCauseRepairEngine", () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("correctly classifies diagnostics into deterministic root cause categories", () => {
    expect(
      RootCauseRepairEngine.classify({ message: 'Cannot find module "../db.js"' })
    ).toBe("UNRESOLVED_IMPORT");

    expect(
      RootCauseRepairEngine.classify({ message: "Unbalanced braces in file (open: 10, close: 9)" })
    ).toBe("SYNTAX_ERROR");

    expect(
      RootCauseRepairEngine.classify({ message: 'Declared route "/products" is not mounted in React router tree' })
    ).toBe("UNMOUNTED_ROUTE");

    expect(
      RootCauseRepairEngine.classify({ message: "Prisma schema missing datasource configuration" })
    ).toBe("SCHEMA_MISMATCH");

    expect(
      RootCauseRepairEngine.classify({ message: "listen EADDRINUSE: address already in use :::3001" })
    ).toBe("PORT_COLLISION");
  });

  it("creates atomic checkpoint and restores perfectly on rollback", () => {
    const testFile = path.join(TEST_DIR, "sample.txt");
    fs.writeFileSync(testFile, "INITIAL_CONTENT", "utf-8");

    const snapshot = RootCauseRepairEngine.checkpoint(testFile);
    expect(snapshot).toBe("INITIAL_CONTENT");

    // Mutate file
    fs.writeFileSync(testFile, "MUTATED_CONTENT", "utf-8");
    expect(fs.readFileSync(testFile, "utf-8")).toBe("MUTATED_CONTENT");

    // Rollback
    RootCauseRepairEngine.rollback(testFile, snapshot);
    expect(fs.readFileSync(testFile, "utf-8")).toBe("INITIAL_CONTENT");
  });

  it("repairs unmounted route in App.tsx deterministically", () => {
    const appFile = path.join(TEST_DIR, "App.tsx");
    fs.writeFileSync(
      appFile,
      `
        import React from 'react';
        import { BrowserRouter, Routes, Route } from 'react-router-dom';
        export const App = () => (
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<div />} />
            </Routes>
          </BrowserRouter>
        );
      `,
      "utf-8"
    );

    const diagnostics = [
      {
        message: 'Declared route "/orders" is not mounted in React router tree.',
        file: "App.tsx",
      },
    ];

    const report = RootCauseRepairEngine.repair(TEST_DIR, diagnostics, () => true);

    expect(report.success).toBe(true);
    expect(report.resolvedIssuesCount).toBe(1);

    const repairedContent = fs.readFileSync(appFile, "utf-8");
    expect(repairedContent).toContain('path="/orders"');
  });

  it("rolls back patch immediately if verification fails to prevent regression", () => {
    const appFile = path.join(TEST_DIR, "App.tsx");
    fs.writeFileSync(appFile, "<Routes></Routes>", "utf-8");

    const diagnostics = [
      {
        message: 'Declared route "/broken" is not mounted',
        file: "App.tsx",
      },
    ];

    // Verifier simulates regression failure
    const report = RootCauseRepairEngine.repair(TEST_DIR, diagnostics, () => false);

    expect(report.rolledBackCount).toBe(1);
    expect(fs.readFileSync(appFile, "utf-8")).toBe("<Routes></Routes>");
  });
});
