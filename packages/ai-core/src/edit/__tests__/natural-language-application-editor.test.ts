import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { EditEngine } from "../edit-engine.js";
import { NaturalLanguageIntentParser } from "../natural-language-intent-parser.js";
import { ThemeModifier } from "../theme-modifier.js";

describe("Phase 8 — Autonomous Natural-Language Application Editor", () => {
  let testProjectDir: string;
  let engine: EditEngine;

  beforeEach(() => {
    testProjectDir = join(tmpdir(), `aegis_nl_edit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(join(testProjectDir, "src", "pages"), { recursive: true });
    mkdirSync(join(testProjectDir, "src", "shared", "components"), { recursive: true });
    mkdirSync(join(testProjectDir, ".aegis"), { recursive: true });
    mkdirSync(join(testProjectDir, "prisma"), { recursive: true });

    // Seed basic package.json
    writeFileSync(join(testProjectDir, "package.json"), JSON.stringify({ name: "nl-edit-test", dependencies: {} }, null, 2));

    // Seed App.tsx & routes.tsx
    writeFileSync(
      join(testProjectDir, "src", "routes.tsx"),
      `import React from "react";
import Home from "./pages/Home";
export const routes = [
  { path: "/", element: <Home /> },
];
`
    );

    // Seed Home.tsx
    writeFileSync(
      join(testProjectDir, "src", "pages", "Home.tsx"),
      `import React from "react";
export default function Home() {
  return (
    <div className="home-container">
      <section className="hero"><h1>Original Hero</h1></section>
      <section className="testimonials"><h2>Testimonials</h2><p>Great service!</p></section>
    </div>
  );
}
`
    );

    // Seed Navbar
    writeFileSync(
      join(testProjectDir, "src", "shared", "components", "Navbar.tsx"),
      `import React from "react";
export const navLinks = [
  { label: "Home", href: "/" },
];
`
    );

    // Seed index.css
    writeFileSync(
      join(testProjectDir, "src", "index.css"),
      `:root {
  --color-primary: #3b82f6;
  --color-background: #0b0e14;
  --color-text-primary: #f8fafc;
}
`
    );

    // Seed prisma schema
    writeFileSync(
      join(testProjectDir, "prisma", "schema.prisma"),
      `datasource db { provider = "postgresql" url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }
model User { id String @id }
`
    );

    engine = new EditEngine();
  });

  afterEach(() => {
    if (existsSync(testProjectDir)) {
      rmSync(testProjectDir, { recursive: true, force: true });
    }
  });

  it("1. Interprets and applies 'Make the entire website light cream with dark green text'", async () => {
    const intent = NaturalLanguageIntentParser.parse("Make the entire website light cream with dark green text");
    expect(intent.operationType).toBe("modify_theme");

    const result = await engine.edit("Make the entire website light cream with dark green text", testProjectDir);
    expect(result.success).toBe(true);

    const css = readFileSync(join(testProjectDir, "src", "index.css"), "utf8");
    expect(css).toContain("--color-background: #FAF7F2");
    expect(css).toContain("--color-text-primary: #133E2B");

    // Must persist to .aegis/theme.json
    expect(existsSync(join(testProjectDir, ".aegis", "theme.json"))).toBe(true);
    const themeJson = JSON.parse(readFileSync(join(testProjectDir, ".aegis", "theme.json"), "utf8"));
    expect(themeJson.mode).toBe("light");
    expect(themeJson.palette.background).toBe("#FAF7F2");
    expect(themeJson.palette.textPrimary).toBe("#133E2B");
  });

  it("2. Interprets and executes 'Add a pricing page' with full route & nav wiring", async () => {
    const result = await engine.edit("Add a pricing page with basic tiers and pricing options", testProjectDir);
    expect(result.success).toBe(true);

    // Page created
    expect(existsSync(join(testProjectDir, "src", "pages", "Pricing.tsx"))).toBe(true);

    // Route registered
    const routesContent = readFileSync(join(testProjectDir, "src", "routes.tsx"), "utf8");
    expect(routesContent).toContain('path: "/pricing"');
    expect(routesContent).toContain("import Pricing");

    // Nav linked
    const navContent = readFileSync(join(testProjectDir, "src", "shared", "components", "Navbar.tsx"), "utf8");
    expect(navContent).toContain('href: "/pricing"');
  });

  it("3. Interprets and executes 'Remove the testimonials section' from Home page", async () => {
    // Add a testimonials page to test clean decommissioning
    writeFileSync(
      join(testProjectDir, "src", "pages", "Testimonials.tsx"),
      `export default function Testimonials() { return <div>Reviews</div>; }`
    );
    const routesContent = readFileSync(join(testProjectDir, "src", "routes.tsx"), "utf8");
    writeFileSync(
      join(testProjectDir, "src", "routes.tsx"),
      `import Testimonials from "./pages/Testimonials";\n${routesContent.replace("export const routes = [", 'export const routes = [\n  { path: "/testimonials", element: <Testimonials /> },')}`
    );

    const result = await engine.edit("Remove the testimonials page", testProjectDir);
    expect(result.success).toBe(true);
    expect(existsSync(join(testProjectDir, "src", "pages", "Testimonials.tsx"))).toBe(false);

    const updatedRoutes = readFileSync(join(testProjectDir, "src", "routes.tsx"), "utf8");
    expect(updatedRoutes).not.toContain('path: "/testimonials"');
  });

  it("4. Supports instant undo after an edit", async () => {
    const originalCss = readFileSync(join(testProjectDir, "src", "index.css"), "utf8");

    // Edit 1: change theme
    await engine.edit("Make the theme light cream with dark green text", testProjectDir);
    const editedCss = readFileSync(join(testProjectDir, "src", "index.css"), "utf8");
    expect(editedCss).toContain("#FAF7F2");

    // Edit 2: Undo
    const undoRes = await engine.edit("undo", testProjectDir);
    expect(undoRes.success).toBe(true);
    expect(undoRes.operationType).toBe("undo");

    const restoredCss = readFileSync(join(testProjectDir, "src", "index.css"), "utf8");
    expect(restoredCss).toBe(originalCss);
  });
});
