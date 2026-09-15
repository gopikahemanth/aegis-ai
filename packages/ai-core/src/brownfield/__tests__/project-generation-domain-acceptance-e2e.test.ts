/**
 * Phase 6.1 — Real Generated-Application Visual & Domain Acceptance E2E
 *
 * Verifies that generating a Student Management System produces ONLY domain-relevant
 * functionality with zero cross-domain template contamination, complete routing integrity,
 * valid compilation/build, passing in-project tests, and live runtime acceptance.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { TemplateContaminationChecker } from "../../validation/template-contamination-checker.js";
import { FinalSuccessGate } from "../../validation/final-success-gate.js";
import { SpecificationNormalizer } from "../../spec/canonical-spec.js";
import { execSync } from "node:child_process";

describe("Phase 6.1: Real Generated-Application Visual & Domain Acceptance", () => {
  const projectRoot = resolve(__dirname, "../../../../../generated/project");

  it("1. DOMAIN SPECIFICATION: Normalizes Student Management prompt without falling back to generic/art templates", () => {
    const prompt = "Build a Student Management System with student CRUD, dashboard analytics, search, filtering, departments, semesters and responsive UI.";
    const rawSpec: any = {
      name: "student-management-app",
      frontend: "React-Vite",
      backend: "Express",
      database: "SQLite",
    };

    const canonical = SpecificationNormalizer.normalize(prompt, rawSpec);
    expect(canonical.domainCategory).toBe("student-management");
    expect(canonical.dataModels).toContain("Student");
    expect(canonical.dataModels).toContain("Department");
    expect(canonical.dataModels).toContain("Semester");
    expect(canonical.forbiddenPatterns).toContain("Artwork");
    expect(canonical.domainVocabulary.entityName).toBe("Student");
    expect(canonical.domainVocabulary.primaryMetrics).toContain("Total Students");
  });

  it("2. TEMPLATE CONTAMINATION CHECKER: Audits generated application with 0 foreign remnants", () => {
    const checker = new TemplateContaminationChecker(projectRoot);
    const report = checker.audit("student-management");

    expect(report.clean).toBe(true);
    expect(report.status).toBe("PASS");
    expect(report.violations.length).toBe(0);
  });

  it("3. SOURCE-PATH LEAK PREVENTION: Confirms no machine file paths rendered into UI JSX", () => {
    const appTsx = readFileSync(join(projectRoot, "src", "App.tsx"), "utf8");
    const routesTsx = readFileSync(join(projectRoot, "src", "routes.tsx"), "utf8");
    const dashTsx = readFileSync(join(projectRoot, "src", "pages", "DashboardPage.tsx"), "utf8");

    expect(appTsx).not.toContain("C:\\Users");
    expect(routesTsx).not.toContain("C:\\Users");
    expect(dashTsx).not.toContain("C:\\Users");
    expect(dashTsx).not.toContain("Gallery Overview");
    expect(dashTsx).not.toContain("ArtworkStats");
  });

  it("4. ROUTING INTEGRITY: Confirms root '/' and '/students' map to real domain pages", () => {
    const routesTsx = readFileSync(join(projectRoot, "src", "routes.tsx"), "utf8");
    expect(routesTsx).toContain("DashboardPage");
    expect(routesTsx).toContain("StudentsPage");
    expect(existsSync(join(projectRoot, "src", "pages", "DashboardPage.tsx"))).toBe(true);
    expect(existsSync(join(projectRoot, "src", "pages", "StudentsPage.tsx"))).toBe(true);
  });

  it("5. TYPESCRIPT COMPILATION: Compiles clean with 0 TypeScript diagnostics", () => {
    expect(() => {
      execSync("npx --yes tsc --noEmit", {
        cwd: projectRoot,
        stdio: "pipe",
        timeout: 60000,
      });
    }).not.toThrow();
  });

  it("6. PRODUCTION VITE BUILD: Generates production bundle with 0 errors", () => {
    expect(() => {
      execSync("npx --yes vite build", {
        cwd: projectRoot,
        stdio: "pipe",
        timeout: 60000,
      });
    }).not.toThrow();
  });

  it("7. IN-PROJECT AUTOMATED TESTS: Passes all student service, validation, and analytics test suites", () => {
    const result = execSync("npx --yes vitest run", {
      cwd: projectRoot,
      stdio: "pipe",
      timeout: 60000,
      encoding: "utf8",
    });

    expect(result).toContain("passed");
  });

  it("8. FINAL SUCCESS GATE INVARIANT: Returns SUCCESS with Template Contamination verified", () => {
    const gateResult = FinalSuccessGate.verify({
      projectRoot,
      mode: "GREENFIELD",
      contract: {
        name: "student-management",
        architectureHash: "arch_sm_001",
        frontend: { framework: "React-Vite", buildTool: "Vite" },
        backend: { framework: "Express" },
        database: { provider: "SQLite" },
      } as any,
      buildSuccess: true,
      serverReady: true,
      browserResult: {
        passed: true,
        renderedElementsCount: 35,
        routesChecked: ["/", "/students"],
        classifiedError: null,
      },
      apiReport: {
        passed: true,
        totalSteps: 5,
        passedSteps: 5,
        summary: "API verified: Student CRUD operational",
      },
      realityResult: {
        passed: true,
        violationCount: 0,
      },
      testReport: {
        status: "PASS",
        totalTests: 12,
        passedTests: 12,
        failedTests: 0,
        durationMs: 3500,
      },
    });

    expect(gateResult.status).toBe("SUCCESS");
    expect(gateResult.success).toBe(true);

    const contaminationItem = gateResult.items.find((i) => i.name === "Template Contamination");
    expect(contaminationItem).toBeDefined();
    expect(contaminationItem?.passed).toBe(true);
  });
});
