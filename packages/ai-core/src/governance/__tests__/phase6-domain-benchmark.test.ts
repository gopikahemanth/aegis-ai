/**
 * Aegis AI — Phase 6 Real Project Domain Benchmark Suite
 *
 * Evaluates the simplified architecture across 5 representative domains:
 * 1. Student Portfolio (contact workflow, project showcase edit, undo)
 * 2. Restaurant Application (menu, cart, customizations, reservation persistence)
 * 3. E-Commerce Platform (product catalog, additive reviews, clean removal)
 * 4. Education Course Management (curriculum, visual academic theme modification)
 * 5. Unfamiliar Domain: Industrial Equipment Maintenance (telemetry, work orders, domain independence)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FeatureMatrixManager } from "../../contracts/feature-matrix.js";
import { AuthorizedSchemaManager } from "../authorized-schema-manager.js";
import { EditEngine } from "../../edit/edit-engine.js";
import { ThemeModifier } from "../../edit/theme-modifier.js";
import { UnifiedVerificationEngine } from "../../validation/unified-verification-engine.js";
import { UndoManager } from "../../edit/undo-manager.js";

describe("Phase 6: Real Project Domain Benchmark", () => {
  let benchmarkRoot: string;
  let editEngine: EditEngine;

  beforeEach(() => {
    benchmarkRoot = join(
      tmpdir(),
      `aegis_p6_bench_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    ).replace(/\\/g, "/");

    mkdirSync(benchmarkRoot, { recursive: true });
    editEngine = new EditEngine();
  });

  afterEach(() => {
    try {
      if (existsSync(benchmarkRoot)) {
        rmSync(benchmarkRoot, { recursive: true, force: true });
      }
    } catch {}
  });

  function setupMockProject(dir: string, domain: string, title: string) {
    mkdirSync(join(dir, "src", "pages"), { recursive: true });
    mkdirSync(join(dir, "src", "shared", "components"), { recursive: true });
    mkdirSync(join(dir, "prisma"), { recursive: true });
    mkdirSync(join(dir, ".aegis"), { recursive: true });

    writeFileSync(
      join(dir, "src", "shared", "components", "Card.tsx"),
      `import React from "react";\nexport function Card({ children }: any) { return <div className="card">{children}</div>; }\n`,
      "utf8"
    );

    writeFileSync(
      join(dir, "src", "shared", "components", "Navbar.tsx"),
      `import React from "react";\nexport const navItems = [{ label: "Home", href: "/" }];\nexport function Navbar() { return <nav />;\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(dir, "src", "routes.tsx"),
      `import React from "react";\nimport Home from "./pages/Home";\nexport const routes = [{ path: "/", element: <Home /> }];\n`,
      "utf8"
    );

    writeFileSync(
      join(dir, "src", "pages", "Home.tsx"),
      `import React from "react";\nexport default function Home() { return <h1>${title}</h1>; }\n`,
      "utf8"
    );

    writeFileSync(
      join(dir, "src", "index.css"),
      `:root { --color-primary: #2563eb; --color-background: #0f172a; }\n`,
      "utf8"
    );

    writeFileSync(
      join(dir, "prisma", "schema.prisma"),
      `datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\ngenerator client {\n  provider = "prisma-client-js"\n}\nmodel User {\n  id String @id @default(uuid())\n  email String @unique\n}\n`,
      "utf8"
    );

    const matrix = FeatureMatrixManager.createMatrix(title, domain, [
      {
        title: "Home",
        description: `Primary landing for ${title}`,
        priority: "must-have",
        expectedBehavior: "Renders landing page",
        routes: ["/"],
        components: ["Home"],
        apiEndpoints: [],
        dataModels: [],
        validationRules: [],
        acceptanceTests: [{ testId: "test_home", strategy: "browser", description: "Renders home" }],
        verificationStatus: "VERIFIED",
        source: "domain-inference",
        confidence: 1.0,
      },
    ]);
    FeatureMatrixManager.saveToProject(dir, matrix);
  }

  // Domain 1: Student Portfolio
  it("Benchmark 1: Student Portfolio with contact workflow, targeted edit, and recovery", async () => {
    const projDir = join(benchmarkRoot, "portfolio").replace(/\\/g, "/");
    setupMockProject(projDir, "portfolio", "Alex Rivera Portfolio");

    // 1. Natural language edit: add Project Showcase
    const editRes = await editEngine.edit("Add a project showcase and portfolio gallery", projDir);
    expect(editRes.success).toBe(true);
    expect(existsSync(join(projDir, "src", "pages", "ProjectShowcase.tsx"))).toBe(true);

    const routesContent = readFileSync(join(projDir, "src", "routes.tsx"), "utf8");
    expect(routesContent).toContain('path: "/project-showcase"');

    // 2. Undo recovery
    const undoRes = UndoManager.undo(projDir);
    expect(undoRes.success).toBe(true);
    expect(existsSync(join(projDir, "src", "pages", "ProjectShowcase.tsx"))).toBe(false);
  });

  // Domain 2: Restaurant Application
  it("Benchmark 2: Restaurant Application with CartItem customizations & Reservation persistence", () => {
    const projDir = join(benchmarkRoot, "restaurant").replace(/\\/g, "/");
    setupMockProject(projDir, "restaurant", "Bella Trattoria");

    // Reconcile rich restaurant domain models
    const res = AuthorizedSchemaManager.reconcileProjectSchema(projDir, ["CartItem", "Reservation"]);
    expect(res.success).toBe(true);

    const schema = readFileSync(join(projDir, "prisma", "schema.prisma"), "utf8");
    expect(schema).toContain("model CartItem");
    expect(schema).toContain("customizations");
    expect(schema).toContain("model Reservation");
    expect(schema).toContain("status");
  });

  // Domain 3: E-Commerce Platform
  it("Benchmark 3: E-Commerce Platform with additive reviews and clean removal", async () => {
    const projDir = join(benchmarkRoot, "ecommerce").replace(/\\/g, "/");
    setupMockProject(projDir, "ecommerce", "Nordic Haven Store");

    // 1. Add Reviews
    const addRes = await editEngine.edit("Add product reviews", projDir);
    expect(addRes.success).toBe(true);
    expect(existsSync(join(projDir, "src", "pages", "ProductReviews.tsx"))).toBe(true);

    // 2. Remove Reviews cleanly
    const remRes = await editEngine.edit("Remove the product reviews page", projDir);
    expect(remRes.success).toBe(true);
    expect(existsSync(join(projDir, "src", "pages", "ProductReviews.tsx"))).toBe(false);

    // 3. Shared Card component remains intact!
    expect(existsSync(join(projDir, "src", "shared", "components", "Card.tsx"))).toBe(true);
  });

  // Domain 4: Education Course Management
  it("Benchmark 4: Education Course Management with academic visual theme modification", async () => {
    const projDir = join(benchmarkRoot, "education").replace(/\\/g, "/");
    setupMockProject(projDir, "education", "CodeCraft Academy");

    // Modify theme to academic ivory light mode
    const themeRes = await ThemeModifier.modifyTheme(projDir, "Change the theme to academic ivory cream and navy blue");
    expect(themeRes.success).toBe(true);
    expect(existsSync(join(projDir, ".aegis", "theme.json"))).toBe(true);

    const cssContent = readFileSync(join(projDir, "src", "index.css"), "utf8");
    expect(cssContent).toContain("--color-primary:");
    expect(cssContent).toContain("--color-background:");
  });

  // Domain 5: Unfamiliar Domain (Industrial Equipment Maintenance)
  it("Benchmark 5: Unfamiliar Domain (Equipment Maintenance) independent verification", () => {
    const projDir = join(benchmarkRoot, "industrial").replace(/\\/g, "/");
    setupMockProject(projDir, "industrial_maintenance", "TurbineGuard Industrial Fleet");

    // Reconcile industrial domain models
    AuthorizedSchemaManager.reconcileProjectSchema(projDir, ["TelemetryLog", "WorkOrder"]);

    const verification = UnifiedVerificationEngine.verifyProject(projDir);
    expect(verification.overallStatus).toBe("PASS");
    expect(verification.passedChecks).toBeGreaterThanOrEqual(5);

    const matrix = FeatureMatrixManager.loadFromProject(projDir);
    expect(matrix?.domainName).toBe("industrial_maintenance");
  });
});
