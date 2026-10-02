import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DesignTokenLinter } from "../design-token-linter.js";
import { mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("DesignTokenLinter", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `aegis_linter_test_${Date.now()}`);
    mkdirSync(join(tempDir, "src", "components"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
  });

  it("detects forbidden arbitrary Tailwind color classes", () => {
    const badComponent = `
      import React from "react";
      export function Hero() {
        return (
          <div className="bg-purple-600 text-white p-8">
            <h1 className="text-4xl font-bold from-indigo-500 to-purple-500 bg-gradient-to-r">Title</h1>
            <button className="bg-violet-700 hover:bg-violet-800 border-purple-500">Click</button>
          </div>
        );
      }
    `;

    writeFileSync(join(tempDir, "src", "components", "Hero.tsx"), badComponent, "utf8");

    const scan = DesignTokenLinter.scanProject(tempDir);
    expect(scan.violations.length).toBeGreaterThanOrEqual(4);
    expect(scan.violations.some(v => v.matchedClass === "bg-purple-600")).toBe(true);
    expect(scan.violations.some(v => v.matchedClass === "from-indigo-500")).toBe(true);
    expect(scan.violations.some(v => v.matchedClass === "to-purple-500")).toBe(true);
    expect(scan.violations.some(v => v.matchedClass === "bg-violet-700")).toBe(true);
  });

  it("passes clean components using design token variables and neutral classes", () => {
    const cleanComponent = `
      import React from "react";
      export function CleanHero() {
        return (
          <div className="bg-[var(--color-surface)] text-[var(--color-text-primary)] p-8 border border-stone-200">
            <h1 className="text-4xl font-bold text-[var(--color-primary)]">Title</h1>
            <button className="bg-[var(--color-primary)] hover:opacity-90 text-white px-4 py-2 rounded-lg">
              Explore
            </button>
          </div>
        );
      }
    `;

    writeFileSync(join(tempDir, "src", "components", "CleanHero.tsx"), cleanComponent, "utf8");

    const scan = DesignTokenLinter.scanProject(tempDir);
    expect(scan.violations.length).toBe(0);
    expect(scan.scannedFilesCount).toBe(1);
  });

  it("detects bg-blue-600 and hardcoded gradients while ignoring neutrals", () => {
    const component = `
      import React from "react";
      export function Banner() {
        return (
          <div className="bg-blue-600 text-white border border-stone-200">
            <h2 className="from-blue-600 to-purple-600 text-slate-900">Heading</h2>
            <button className="bg-white text-black border-stone-300">Clean</button>
          </div>
        );
      }
    `;

    writeFileSync(join(tempDir, "src", "components", "Banner.tsx"), component, "utf8");

    const scan = DesignTokenLinter.scanProject(tempDir);
    expect(scan.violations.some(v => v.matchedClass === "bg-blue-600")).toBe(true);
    expect(scan.violations.some(v => v.matchedClass === "from-blue-600")).toBe(true);
    expect(scan.violations.some(v => v.matchedClass === "to-purple-600")).toBe(true);
    // Neutrals should not be flagged
    expect(scan.violations.some(v => v.matchedClass === "bg-white")).toBe(false);
    expect(scan.violations.some(v => v.matchedClass === "text-white")).toBe(false);
    expect(scan.violations.some(v => v.matchedClass === "text-slate-900")).toBe(false);
    expect(scan.violations.some(v => v.matchedClass === "border-stone-200")).toBe(false);
  });

  it("confirms one-retry-then-warn behavior when coder cannot heal all violations", async () => {
    const componentWithPersistentViolation = `
      import React from "react";
      export function PersistentHero() {
        return <div className="bg-purple-600 text-white">Persistent</div>;
      }
    `;
    writeFileSync(join(tempDir, "src", "components", "PersistentHero.tsx"), componentWithPersistentViolation, "utf8");

    let executeCalls = 0;
    const mockCoderAgent: any = {
      execute: async () => {
        executeCalls++;
        // Return no-op patch that leaves the file unchanged
        return { response: "// No change made", files: [] };
      },
    };

    const report = await DesignTokenLinter.validateAndHeal(tempDir, mockCoderAgent, {} as any, "");

    // Must call CoderAgent exactly once (one retry)
    expect(executeCalls).toBe(1);
    // Must not silently pass through: valid must be false
    expect(report.valid).toBe(false);
    // Must record remaining violations with warning
    expect(report.violations.length).toBeGreaterThan(0);
    expect(report.healed).toBe(true);
  });

  it("confirms successful healing when coder replaces forbidden classes", async () => {
    const componentToHeal = `
      import React from "react";
      export function FixableHero() {
        return <div className="bg-purple-600 text-white">Fixable</div>;
      }
    `;
    const targetFile = join(tempDir, "src", "components", "FixableHero.tsx");
    writeFileSync(targetFile, componentToHeal, "utf8");

    let executeCalls = 0;
    const mockCoderAgent: any = {
      execute: async () => {
        executeCalls++;
        // Fix file directly on disk as CoderAgent would
        writeFileSync(targetFile, `
          import React from "react";
          export function FixableHero() {
            return <div className="bg-[var(--color-surface)] text-white">Fixable</div>;
          }
        `, "utf8");
        return { response: "// Healed", files: [] };
      },
    };

    const report = await DesignTokenLinter.validateAndHeal(tempDir, mockCoderAgent, {} as any, "");

    expect(executeCalls).toBe(1);
    expect(report.valid).toBe(true);
    expect(report.violations.length).toBe(0);
    expect(report.healed).toBe(true);
  });
});
