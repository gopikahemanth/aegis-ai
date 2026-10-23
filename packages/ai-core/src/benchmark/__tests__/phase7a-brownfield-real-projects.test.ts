/**
 * Aegis AI — Phase 7A Brownfield Real-Project Validation
 *
 * Validates the 10 mandatory brownfield editing workflows against actual generated projects:
 * 1. Add a new page with navigation and appropriate functionality
 * 2. Add a data-backed feature
 * 3. Modify only one requested page or section
 * 4. Change the theme without breaking application logic
 * 5. Remove a feature without deleting shared components
 * 6. Evolve a data model while preserving existing fields
 * 7. Handle an unsupported edit honestly
 * 8. Undo a successful edit
 * 9. Recover from a failed edit
 * 10. Preserve unrelated user modifications
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { EditEngine } from "../../edit/edit-engine.js";
import { ThemeModifier } from "../../edit/theme-modifier.js";
import { UndoManager } from "../../edit/undo-manager.js";
import { AuthorizedSchemaManager } from "../../governance/authorized-schema-manager.js";
import { FeatureMatrixManager } from "../../contracts/feature-matrix.js";

describe("Phase 7A: Brownfield Real-Project Validation", () => {
  let projectRoot: string;
  let editEngine: EditEngine;

  beforeEach(() => {
    projectRoot = join(
      tmpdir(),
      `aegis_p7a_brownfield_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    ).replace(/\\/g, "/");

    mkdirSync(join(projectRoot, "src", "pages"), { recursive: true });
    mkdirSync(join(projectRoot, "src", "shared", "components"), { recursive: true });
    mkdirSync(join(projectRoot, "prisma"), { recursive: true });
    mkdirSync(join(projectRoot, ".aegis"), { recursive: true });

    // Seed shared components
    writeFileSync(
      join(projectRoot, "src", "shared", "components", "Card.tsx"),
      `import React from "react";\nexport function Card({ children }: any) { return <div className="card">{children}</div>; }\n`,
      "utf8"
    );

    writeFileSync(
      join(projectRoot, "src", "shared", "components", "Navbar.tsx"),
      `import React from "react";\nexport const navItems = [{ label: "Home", href: "/" }];\nexport function Navbar() { return <nav />;\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(projectRoot, "src", "routes.tsx"),
      `import React from "react";\nimport Home from "./pages/Home";\nexport const routes = [{ path: "/", element: <Home /> }];\n`,
      "utf8"
    );

    writeFileSync(
      join(projectRoot, "src", "pages", "Home.tsx"),
      `import React from "react";\nexport default function Home() { return <h1>Original Home</h1>; }\n`,
      "utf8"
    );

    writeFileSync(
      join(projectRoot, "src", "index.css"),
      `:root {\n  --color-primary: #3b82f6;\n  --color-background: #0f172a;\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(projectRoot, "prisma", "schema.prisma"),
      `datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\ngenerator client {\n  provider = "prisma-client-js"\n}\nmodel Product {\n  id String @id @default(uuid())\n  name String\n  price Float\n}\n`,
      "utf8"
    );

    const matrix = FeatureMatrixManager.createMatrix("StoreApp", "ecommerce", [
      {
        id: "F01",
        title: "Home",
        description: "Primary home page",
        priority: "must-have",
        expectedBehavior: "Renders home page",
        routes: ["/"],
        components: ["Home"],
        apiEndpoints: [],
        dataModels: [],
        validationRules: [],
        acceptanceTests: [{ testId: "test_home", strategy: "browser", description: "Verify home" }],
        verificationStatus: "VERIFIED",
        source: "domain-inference",
        confidence: 1.0,
      },
    ]);
    FeatureMatrixManager.saveToProject(projectRoot, matrix);

    editEngine = new EditEngine();
  });

  afterEach(() => {
    try {
      if (existsSync(projectRoot)) {
        rmSync(projectRoot, { recursive: true, force: true });
      }
    } catch {}
  });

  // Workflow 1: Add a new page with navigation and appropriate functionality
  it("Workflow 1: Adds a new page with navigation and route registration", async () => {
    const res = await editEngine.edit("Add a wishlist page and link it in navigation", projectRoot);
    expect(res.success).toBe(true);
    expect(existsSync(join(projectRoot, "src", "pages", "Wishlist.tsx"))).toBe(true);

    const routesContent = readFileSync(join(projectRoot, "src", "routes.tsx"), "utf8");
    expect(routesContent).toContain("Wishlist");
  });

  // Workflow 2: Add a data-backed feature
  it("Workflow 2: Adds a data-backed feature with model updates", async () => {
    const res = await editEngine.edit("Add customer product reviews with rating and comments", projectRoot);
    expect(res.success).toBe(true);

    // Verify Review model is added without destroying Product model
    const schemaContent = readFileSync(join(projectRoot, "prisma", "schema.prisma"), "utf8");
    expect(schemaContent).toContain("model Product");
    expect(schemaContent).toContain("Review");
  });

  // Workflow 3: Modify only one requested page or section
  it("Workflow 3: Modifies only the requested page leaving others intact", async () => {
    const res = await editEngine.edit("Update Home page with promotional banner", projectRoot);
    expect(res.success).toBe(true);

    // Shared Navbar and Card should not be deleted or corrupted
    expect(existsSync(join(projectRoot, "src", "shared", "components", "Navbar.tsx"))).toBe(true);
    expect(existsSync(join(projectRoot, "src", "shared", "components", "Card.tsx"))).toBe(true);
  });

  // Workflow 4: Change the theme without breaking application logic
  it("Workflow 4: Changes the theme tokens without breaking code logic", () => {
    const themeRes = ThemeModifier.applyTheme(projectRoot, {
      primaryColor: "#10b981",
      backgroundColor: "#022c22",
    });
    expect(themeRes.success).toBe(true);

    const css = readFileSync(join(projectRoot, "src", "index.css"), "utf8");
    expect(css).toContain("#10b981");
    expect(css).toContain("#022c22");

    // Code files remain untouched
    expect(existsSync(join(projectRoot, "src", "pages", "Home.tsx"))).toBe(true);
  });

  // Workflow 5: Remove a feature without deleting shared components
  it("Workflow 5: Removes a feature while preserving shared components", async () => {
    // First add a feature
    await editEngine.edit("Add a newsletter page", projectRoot);
    expect(existsSync(join(projectRoot, "src", "pages", "Newsletter.tsx"))).toBe(true);

    // Now remove it
    const removeRes = await editEngine.edit("Remove newsletter page", projectRoot);
    expect(removeRes.success).toBe(true);
    expect(existsSync(join(projectRoot, "src", "pages", "Newsletter.tsx"))).toBe(false);

    // Shared components must remain
    expect(existsSync(join(projectRoot, "src", "shared", "components", "Card.tsx"))).toBe(true);
    expect(existsSync(join(projectRoot, "src", "shared", "components", "Navbar.tsx"))).toBe(true);
  });

  // Workflow 6: Evolve a data model while preserving existing fields
  it("Workflow 6: Non-destructively evolves database schema preserving existing fields", () => {
    const schemaPath = join(projectRoot, "prisma", "schema.prisma");
    const incomingSchema = `datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}
model Product {
  id String @id @default(uuid())
  sku String @unique
  inventoryCount Int @default(0)
}
`;
    const recon = AuthorizedSchemaManager.reconcileAndWriteSchema(projectRoot, incomingSchema, "DatabaseAgent");
    expect(recon.success).toBe(true);

    const updated = readFileSync(schemaPath, "utf8");
    // Preserved fields from existing schema
    expect(updated).toContain("name");
    expect(updated).toContain("price");
    // Added new fields
    expect(updated).toContain("sku");
    expect(updated).toContain("inventoryCount");
  });

  // Workflow 7: Handle an unsupported edit honestly
  it("Workflow 7: Reports unsupported edit requests with honest status", async () => {
    // Pass completely empty or unparseable instruction
    const res = await editEngine.edit("   ", projectRoot);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  // Workflow 8: Undo a successful edit
  it("Workflow 8: Undoes a successful edit cleanly to restore prior state", async () => {
    const editRes = await editEngine.edit("Add a blog page", projectRoot);
    expect(editRes.success).toBe(true);
    expect(existsSync(join(projectRoot, "src", "pages", "Blog.tsx"))).toBe(true);

    const undoRes = await UndoManager.undo(projectRoot);
    expect(undoRes.success).toBe(true);
    expect(existsSync(join(projectRoot, "src", "pages", "Blog.tsx"))).toBe(false);
  });

  // Workflow 9: Recover from a failed edit
  it("Workflow 9: Recovers from a simulated edit failure without corrupting state", async () => {
    const homeBefore = readFileSync(join(projectRoot, "src", "pages", "Home.tsx"), "utf8");

    // Trigger an invalid edit
    const res = await editEngine.edit("", projectRoot);
    expect(res.success).toBe(false);

    // Verify existing state is pristine
    const homeAfter = readFileSync(join(projectRoot, "src", "pages", "Home.tsx"), "utf8");
    expect(homeAfter).toBe(homeBefore);
  });

  // Workflow 10: Preserve unrelated user modifications
  it("Workflow 10: Preserves custom user modifications during subsequent edits", async () => {
    // User writes custom file
    const customFilePath = join(projectRoot, "src", "userCustomLogic.ts");
    const customContent = `export const calculateTax = (amount: number) => amount * 0.08;`;
    writeFileSync(customFilePath, customContent, "utf8");

    // Perform unrelated edit
    const res = await editEngine.edit("Add a terms of service page", projectRoot);
    expect(res.success).toBe(true);

    // Custom user file must remain unchanged
    expect(existsSync(customFilePath)).toBe(true);
    expect(readFileSync(customFilePath, "utf8")).toBe(customContent);
  });
});
