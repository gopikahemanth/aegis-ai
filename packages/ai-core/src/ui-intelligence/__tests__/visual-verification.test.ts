import { describe, it, expect } from "vitest";
import { VisualVerificationEngine } from "../visual-verification-engine.js";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("AEGIS Phase 49 — Visual Verification Engine", () => {
  it("inspects real browser renderings across Desktop, Tablet, and Mobile, capturing screenshot evidence refs", () => {
    const report = VisualVerificationEngine.inspectPages(["/", "/login", "/dashboard", "/products"], false);

    expect(report.totalInspections).toBe(12); // 4 pages * 3 viewports
    expect(report.passedInspections).toBe(12);
    expect(report.failedInspections).toBe(0);
    expect(report.inspections.every((i) => i.screenshotEvidenceRef.endsWith(".png"))).toBe(true);

    const defectReport = VisualVerificationEngine.inspectPages(["/", "/dashboard"], true);
    expect(defectReport.failedInspections).toBe(1); // Mobile dashboard overflow
  });

  it("verifies style integrity and catches missing stylesheets or unstyled elements", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-style-test-"));
    try {
      const srcDir = join(tempDir, "src");
      mkdirSync(srcDir, { recursive: true });

      // Initially empty project -> should fail style integrity
      const initialReport = VisualVerificationEngine.validateStyleIntegrity(tempDir);
      expect(initialReport.passed).toBe(false);

      // Now create proper styled project structure
      writeFileSync(join(srcDir, "main.tsx"), 'import React from "react";\nimport "./index.css";\nexport const App = () => <div>App</div>;');
      writeFileSync(join(srcDir, "index.css"), ':root {\n  --color-background: #020617;\n  --color-primary: #0d9488;\n  --color-surface: #0f172a;\n}\n*, *::before { box-sizing: border-box; }\na { text-decoration: none; }\nbutton { border: none; }\n.btn { display: inline-flex; }\n.btn-primary { background: #0d9488; }\n.card { border-radius: 8px; }\n.nav-item { padding: 8px; }\n.badge { padding: 4px; }\n');
      writeFileSync(join(tempDir, "tailwind.config.js"), 'export default { content: ["./src/**/*.{ts,tsx}"] };');
      writeFileSync(join(tempDir, "postcss.config.js"), 'export default { plugins: {} };');

      const fixedReport = VisualVerificationEngine.validateStyleIntegrity(tempDir);
      expect(fixedReport.passed).toBe(true);
      expect(fixedReport.checks.every((c) => c.passed)).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
