import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ProjectIntegrationMatrix } from "../project-integration-matrix.js";
import * as fs from "fs";
import * as path from "path";

const TEST_DIR = path.join(process.cwd(), ".tmp_test_integration_matrix");

describe("Phase 7: ProjectIntegrationMatrix", () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("passes when all routes, modules, and schemas are aligned", () => {
    // 1. Setup valid App.tsx
    fs.mkdirSync(path.join(TEST_DIR, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(TEST_DIR, "src", "App.tsx"),
      `
        import React from 'react';
        import { BrowserRouter, Routes, Route } from 'react-router-dom';
        import { HomePage } from './HomePage';
        export const App = () => (
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<div />} />
            </Routes>
          </BrowserRouter>
        );
      `
    );

    // 2. Setup HomePage.tsx
    fs.writeFileSync(
      path.join(TEST_DIR, "src", "HomePage.tsx"),
      `export const HomePage = () => <div>Home</div>;`
    );

    // 3. Setup Prisma Schema
    fs.mkdirSync(path.join(TEST_DIR, "prisma"), { recursive: true });
    fs.writeFileSync(
      path.join(TEST_DIR, "prisma", "schema.prisma"),
      `
        datasource db {
          provider = "sqlite"
          url      = "file:./dev.db"
        }
        generator client {
          provider = "prisma-client-js"
        }
        model User {
          id Int @id @default(autoincrement())
        }
      `
    );

    const report = ProjectIntegrationMatrix.audit(TEST_DIR);

    expect(report.passed).toBe(true);
    expect(report.errorsCount).toBe(0);
    expect(report.totalRoutes).toBeGreaterThanOrEqual(2);
  });

  it("detects unmounted frontend routes as critical errors", () => {
    fs.mkdirSync(path.join(TEST_DIR, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(TEST_DIR, "src", "App.tsx"),
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
      `
    );

    const contract: any = {
      routes: {
        frontendRoutes: [
          { path: "/", componentName: "HomePage" },
          { path: "/billing", componentName: "BillingPage" },
        ],
      },
    };

    const report = ProjectIntegrationMatrix.audit(TEST_DIR, contract);

    expect(report.passed).toBe(false);
    expect(report.errorsCount).toBeGreaterThan(0);
    const routeIssue = report.issues.find(i => i.layer === "ROUTING");
    expect(routeIssue).toBeDefined();
    expect(routeIssue?.message).toContain('route "/billing" is not mounted');
  });

  it("detects dangling or missing relative module imports", () => {
    fs.mkdirSync(path.join(TEST_DIR, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(TEST_DIR, "src", "Component.tsx"),
      `
        import React from 'react';
        import { NonExistentHelper } from './utils/non-existent-helper';
        export const Component = () => <div>Broken</div>;
      `
    );

    const report = ProjectIntegrationMatrix.audit(TEST_DIR);

    expect(report.passed).toBe(false);
    const modIssue = report.issues.find(i => i.layer === "MODULE_GRAPH");
    expect(modIssue).toBeDefined();
    expect(modIssue?.message).toContain("Unresolved relative import");
  });
});
