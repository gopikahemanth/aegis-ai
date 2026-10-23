/**
 * Aegis AI — Phase 5 CLI End-to-End Brownfield Editing Integration Test
 *
 * Exercises the actual CLI entry points (apps/cli/dist/index.js):
 * - aegis edit "<instruction>"
 * - aegis edit --dry-run "<instruction>"
 * - aegis edit "Change the theme..."
 * - aegis edit "Remove the blog..."
 * - aegis undo
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

describe("Phase 5: CLI Brownfield Editing & Undo End-to-End", () => {
  let testProjectDir: string;
  // Resolve apps/cli/dist/index.js from monorepo root
  const cliScript = resolve(process.cwd(), "../../apps/cli/dist/index.js").replace(/\\/g, "/");

  beforeEach(() => {
    testProjectDir = join(
      tmpdir(),
      `aegis_cli_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    ).replace(/\\/g, "/");

    mkdirSync(join(testProjectDir, "src", "pages"), { recursive: true });
    mkdirSync(join(testProjectDir, "src", "shared", "components"), { recursive: true });
    mkdirSync(join(testProjectDir, "prisma"), { recursive: true });
    mkdirSync(join(testProjectDir, ".aegis"), { recursive: true });

    // Seed mock project files
    writeFileSync(
      join(testProjectDir, "src", "shared", "components", "Card.tsx"),
      `import React from "react";\nexport function Card({ children }: { children: React.ReactNode }) { return <div className="card">{children}</div>; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testProjectDir, "src", "shared", "components", "Navbar.tsx"),
      `import React from "react";\nexport const navItems = [\n  { label: "Home", href: "/" },\n  { label: "Blog", href: "/blog" },\n];\nexport function Navbar() { return <nav />;\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testProjectDir, "src", "routes.tsx"),
      `import React from "react";
import Home from "./pages/Home";
import Blog from "./pages/Blog";

export const routes = [
  { path: "/", element: <Home /> },
  { path: "/blog", element: <Blog /> },
];
`,
      "utf8"
    );

    writeFileSync(
      join(testProjectDir, "src", "pages", "Home.tsx"),
      `import React from "react";
import { Card } from "../shared/components/Card";

export default function Home() {
  return (
    <div>
      <header><h1>Welcome Home</h1></header>
      <Card>Featured</Card>
    </div>
  );
}
`,
      "utf8"
    );

    writeFileSync(
      join(testProjectDir, "src", "pages", "Blog.tsx"),
      `import React from "react";
import { Card } from "../shared/components/Card";

export default function Blog() {
  return (
    <div>
      <h1>Articles</h1>
      <Card>Article</Card>
    </div>
  );
}
`,
      "utf8"
    );

    writeFileSync(
      join(testProjectDir, "src", "index.css"),
      `:root {
  --color-primary: #3b82f6;
  --color-background: #ffffff;
}
`,
      "utf8"
    );
  });

  afterEach(() => {
    try {
      if (existsSync(testProjectDir)) {
        rmSync(testProjectDir, { recursive: true, force: true });
      }
    } catch {}
  });

  it("executes CLI dry-run without modifying files", () => {
    const cmd = `node "${cliScript}" edit --dry-run "${testProjectDir}" "Add a wishlist"`;
    const output = execSync(cmd, { encoding: "utf8" });

    expect(output).toContain("Dry Run - Zero files modified");
    expect(existsSync(join(testProjectDir, "src", "pages", "Wishlist.tsx"))).toBe(false);
  });

  it("executes real CLI add, theme change, feature removal, and undo", () => {
    // 1. CLI Add Feature
    const addCmd = `node "${cliScript}" edit "${testProjectDir}" "Add a wishlist and connect it to user"`;
    const addOut = execSync(addCmd, { encoding: "utf8" });
    expect(addOut).toContain("Edit successfully executed");
    expect(existsSync(join(testProjectDir, "src", "pages", "Wishlist.tsx"))).toBe(true);

    const routesContent = readFileSync(join(testProjectDir, "src", "routes.tsx"), "utf8");
    expect(routesContent).toContain('path: "/wishlist"');

    // 2. CLI Theme Change
    const themeCmd = `node "${cliScript}" edit "${testProjectDir}" "Change the theme to dark obsidian mode"`;
    const themeOut = execSync(themeCmd, { encoding: "utf8" });
    expect(themeOut).toContain("Edit successfully executed");
    expect(existsSync(join(testProjectDir, ".aegis", "theme.json"))).toBe(true);

    // 3. CLI Feature Removal
    const remCmd = `node "${cliScript}" edit "${testProjectDir}" "Remove the blog page and clean up obsolete files"`;
    const remOut = execSync(remCmd, { encoding: "utf8" });
    expect(remOut).toContain("Edit successfully executed");
    expect(existsSync(join(testProjectDir, "src", "pages", "Blog.tsx"))).toBe(false);
    expect(existsSync(join(testProjectDir, "src", "shared", "components", "Card.tsx"))).toBe(true);

    // 4. CLI Undo (reverts the removal of Blog)
    const undoCmd = `node "${cliScript}" undo "${testProjectDir}"`;
    const undoOut = execSync(undoCmd, { encoding: "utf8" });
    expect(undoOut).toContain("Successfully undone edit");
    // Blog page restored!
    expect(existsSync(join(testProjectDir, "src", "pages", "Blog.tsx"))).toBe(true);
  });
});
