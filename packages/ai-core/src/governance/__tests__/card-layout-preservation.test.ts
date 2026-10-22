import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FastDeterministicSanitizer, FastSanitizer } from "../fast-sanitizer.js";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Card and Layout Preservation Invariant (Phase 1 Step 3)", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `aegis-card-preservation-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(tempDir, "src", "shared", "components"), { recursive: true });
    mkdirSync(join(tempDir, "src", "components"), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("preserves LLM's custom Card.tsx styling and appends missing subcomponents without overwriting", () => {
    const cardPath = join(tempDir, "src", "shared", "components", "Card.tsx");
    // LLM wrote custom marine/underwater plinth card styling
    const customCardContent = `import React from "react";

export function Card({ children, className = "", ...props }: any) {
  return (
    <div className={\`bg-cyan-950/40 border border-cyan-800/60 rounded-2xl p-8 backdrop-blur-md \${className}\`} {...props}>
      {children}
    </div>
  );
}

export default Card;
`;
    writeFileSync(cardPath, customCardContent, "utf8");

    // Run sanitizer enforceGenericComponents (which checks Card)
    FastDeterministicSanitizer.enforceGenericComponents(tempDir);

    const updatedContent = readFileSync(cardPath, "utf8");

    // The original LLM styling MUST be preserved
    expect(updatedContent).toContain("bg-cyan-950/40");
    expect(updatedContent).toContain("border-cyan-800/60");
    expect(updatedContent).not.toContain("bg-slate-900/60");

    // Missing subcomponents must be appended
    expect(updatedContent).toContain("export const CardContent");
    expect(updatedContent).toContain("export const CardHeader");
    expect(updatedContent).toContain("export const CardTitle");
    expect(updatedContent).toContain("export const CardDescription");
    expect(updatedContent).toContain("export const CardFooter");
  });

  it("rewrites Card.tsx only if genuinely broken by duplicate declarations or duplicate default exports", () => {
    const cardPath = join(tempDir, "src", "shared", "components", "Card.tsx");
    const corruptedCardContent = `import React from "react";
export function Card() { return <div>1</div>; }
export function Card() { return <div>2</div>; }
export default Card;
export default function Other() {}
`;
    writeFileSync(cardPath, corruptedCardContent, "utf8");

    FastDeterministicSanitizer.enforceGenericComponents(tempDir);

    const updatedContent = readFileSync(cardPath, "utf8");
    // Broken card is rewritten using theme CSS variables (NOT hardcoded slate classes)
    expect(updatedContent).toContain("var(--color-surface");
    expect(updatedContent).not.toContain("bg-slate-900/60");
    expect(updatedContent).toContain("export const CardContent");
  });

  it("normalizes Layout to render children without destroying existing markup", () => {
    const layoutPath = join(tempDir, "src", "components", "Layout.tsx");
    const customLayoutContent = `import React from "react";
import { Link } from "react-router-dom";

export default function Layout() {
  return (
    <div className="ocean-container flex flex-col">
      <nav className="ocean-navbar">
        <Link to="/">Thalassa Base</Link>
      </nav>
      <main className="ocean-main"></main>
    </div>
  );
}
`;
    writeFileSync(layoutPath, customLayoutContent, "utf8");

    FastSanitizer.normalizeLayoutComponent(tempDir);

    const updated = readFileSync(layoutPath, "utf8");
    // Markup preserved
    expect(updated).toContain("ocean-container");
    expect(updated).toContain("ocean-navbar");
    expect(updated).toContain("Thalassa Base");
    // Children rendering injected into main
    expect(updated).toContain("{children}</main>");
    expect(updated).toContain("export default function Layout({ children }");
  });
});
