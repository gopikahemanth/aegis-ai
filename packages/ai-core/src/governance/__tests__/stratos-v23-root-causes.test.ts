import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { FastDeterministicSanitizer } from "../fast-sanitizer.js";
import { AstSafeTransformer } from "../ast-safe-transformer.js";
import { SelfHealingPatchEngine } from "../../healing/patch-engine.js";
import { PageExperiencePlanner } from "../../design/page-experience-plan.js";
import { PageExperienceQualityGate } from "../../validation/page-experience-quality-gate.js";

const TEST_DIR = join(process.cwd(), "temp-stratos-v23-root-causes-test");

describe("STRATOS AVIONICS v23 Pipeline Root-Cause Defect Suite", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(join(TEST_DIR, "src", "features", "telemetry"), { recursive: true });
    mkdirSync(join(TEST_DIR, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DEFECT 1: TS1489 Leading-Zero Numeric Literals
  // ──────────────────────────────────────────────────────────────────────────
  describe("Defect 1: TS1489 Leading-zero numeric literal normalization", () => {
    it("normalizes illegal leading-zero decimal literals (heading: 090 -> heading: 90)", () => {
      const input = `
        export const telemetrySample = {
          callsign: "STRATOS-1",
          heading: 090,
          altitude: 32000,
          subheading: 085,
          channel: 07,
          runway: 009,
        };
      `;

      const sanitized = FastDeterministicSanitizer.sanitizeLeadingZeroNumerics(input);
      expect(sanitized).toContain("heading: 90");
      expect(sanitized).toContain("subheading: 85");
      expect(sanitized).toContain("channel: 7");
      expect(sanitized).toContain("runway: 9");
      expect(sanitized).not.toContain("090");
      expect(sanitized).not.toContain("085");
      expect(sanitized).not.toContain("009");
    });

    it("preserves valid strings, floats, hex, octal, and single zeros", () => {
      const input = `
        const config = {
          versionStr: "090",
          templateStr: 'code-085',
          ratio: 0.90,
          zero: 0,
          hexVal: 0xFF,
          octVal: 0o777,
          binaryVal: 0b101,
          var090: true,
        };
      `;

      const sanitized = FastDeterministicSanitizer.sanitizeLeadingZeroNumerics(input);
      expect(sanitized).toContain('versionStr: "090"');
      expect(sanitized).toContain("templateStr: 'code-085'");
      expect(sanitized).toContain("ratio: 0.90");
      expect(sanitized).toContain("zero: 0");
      expect(sanitized).toContain("hexVal: 0xFF");
      expect(sanitized).toContain("octVal: 0o777");
      expect(sanitized).toContain("binaryVal: 0b101");
      expect(sanitized).toContain("var090: true");
    });

    it("sanitizes TS1489 in files via FastDeterministicSanitizer.sanitizeFile", () => {
      const filePath = join(TEST_DIR, "src", "features", "telemetry", "index.tsx");
      const code = `
        import React from "react";
        export function TelemetryView() {
          const telemetry = { heading: 090, speed: 450 };
          return <div>Heading: {telemetry.heading}</div>;
        }
      `;
      writeFileSync(filePath, code, "utf-8");

      FastDeterministicSanitizer.sanitizeFile(filePath);
      const result = readFileSync(filePath, "utf-8");
      expect(result).toContain("heading: 90");
      expect(result).not.toContain("heading: 090");
    });

    it("normalizes leading-zero literals inside AstSafeTransformer without failing parse", () => {
      const code = `
        export const waypoint = {
          fix: "WAYPOINT_A",
          heading: 090,
          alt: 080,
        };
      `;
      const transformed = AstSafeTransformer.transform(code);
      expect(transformed).toContain("heading: 90");
      expect(transformed).toContain("alt: 80");
      expect(transformed).not.toContain("090");
      expect(transformed).not.toContain("080");
    });

    it("normalizes untyped ternary literal variable declarations to prevent TS2345 widening without TS1355", () => {
      const code = `
        type NoticeStatus = 'Active' | 'Acknowledged' | 'Cancelled';
        interface Notice { id: string; status: NoticeStatus }
        const n: Notice = { id: '1', status: 'Active' };
        export const handleToggle = (id: string) => {
          const nextStatus = n.status === 'Active' ? 'Acknowledged' : 'Active';
          const updated: Notice = { ...n, status: nextStatus };
          return updated;
        };
      `;
      const transformed = AstSafeTransformer.transform(code);
      expect(transformed).toContain("('Acknowledged' as const)");
      expect(transformed).toContain("('Active' as const)");
      // Must NOT wrap the outer conditional expression in 'as const' (TS1355)
      expect(transformed).not.toMatch(/\)\s*as const/);

      // Verify actual type checking with TypeScript compiler API
      const testFilePath = join(TEST_DIR, "src", "type-check-test.ts");
      writeFileSync(testFilePath, transformed, "utf-8");
      const program = ts.createProgram([testFilePath], {
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      });
      const diagnostics = ts.getPreEmitDiagnostics(program);
      const errors = diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error && d.file?.fileName.includes("type-check-test"));
      if (errors.length > 0) {
        console.error("DIAGNOSTICS:", errors.map(e => `${e.code}: ${ts.flattenDiagnosticMessageText(e.messageText, " ")}`));
      }
      expect(errors).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DEFECT 2: Unsafe Repair Regression & Duplicate Identifiers
  // ──────────────────────────────────────────────────────────────────────────
  describe("Defect 2: Safe Healing & Duplicate Identifier Prevention", () => {
    it("SelfHealingPatchEngine rejects patches that introduce duplicate App declarations", async () => {
      const appFile = join(TEST_DIR, "src", "App.tsx");
      const initialCode = `
import React from "react";
export function App() {
  return <div>Existing App</div>;
}
`;
      writeFileSync(appFile, initialCode, "utf-8");

      const malformedPatch = {
        files: [
          {
            path: "src/App.tsx",
            content: `
import React from "react";
export default function App() {
  return <div>New App</div>;
}
export function App() {
  return <div>Duplicate App</div>;
}
`,
          },
        ],
      };

      const result = await SelfHealingPatchEngine.applyPatch(TEST_DIR, malformedPatch);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Duplicate declaration");

      // Verify rollback preserved initial state
      const postContent = readFileSync(appFile, "utf-8");
      expect(postContent).toBe(initialCode);
    });

    it("SelfHealingPatchEngine rejects patches that introduce TS1489 leading zero literals", async () => {
      const targetFile = join(TEST_DIR, "src", "features", "telemetry", "index.tsx");
      const initialCode = `
export function Telemetry() {
  return <div>Telemetry</div>;
}
`;
      writeFileSync(targetFile, initialCode, "utf-8");

      const brokenPatch = {
        files: [
          {
            path: "src/features/telemetry/index.tsx",
            content: `
export function Telemetry() {
  const data = { heading: 090 };
  return <div>Heading: {data.heading}</div>;
}
`,
          },
        ],
      };

      const result = await SelfHealingPatchEngine.applyPatch(TEST_DIR, brokenPatch);
      expect(result.success).toBe(false);
      expect(result.error).toContain("TS1489");

      // Original code preserved
      const postContent = readFileSync(targetFile, "utf-8");
      expect(postContent).toBe(initialCode);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DEFECT 3: Domain-Specific Experience Planning
  // ──────────────────────────────────────────────────────────────────────────
  describe("Defect 3: Domain-Specific Experience Planning & No Editorial Hijacking", () => {
    it("does NOT classify aerospace prompt mentioning 'architecture' as EDITORIAL_PUBLICATION", () => {
      const aerospacePrompt = `
        STRATOS AVIONICS v23 — Enterprise Flight Operations & Telemetry Platform.
        Full end-to-end flight operations platform with aircraft fleet tracking, live telemetry streaming,
        maintenance compliance, mission planning, and PostgreSQL persistence where required by the architecture.
      `;

      const routes = ["/", "/aircraft-fleet", "/telemetry", "/maintenance", "/missions"];
      const plan = PageExperiencePlanner.plan(aerospacePrompt, routes);

      // Verify that no page received editorial/monograph roles
      for (const page of plan.pages) {
        expect(page.pageRole).not.toMatch(/monograph|folio archive|curatorial|essay/i);
        expect(page.atmosphere).not.toMatch(/warm paper|building typology|timber|stone/i);
        expect(page.surfaceGenre).not.toBe("EDITORIAL_SPREAD");
      }

      // Root route should be an operational command center / aerospace overview, NOT monograph cover
      const rootPage = plan.pages.find((p) => p.route === "/");
      expect(rootPage).toBeDefined();
      expect(rootPage?.pageRole).not.toBe("Monograph Cover & Opening Essay");
      expect(rootPage?.surfaceGenre).toBe("DASHBOARD_PANEL");
    });

    it("correctly identifies genuine architectural monograph / publication prompt", () => {
      const archPublicationPrompt = `
        Architectural Monograph & Spatial Publication Journal for Contemporary Structural Projects.
        Curated essays, building typology archives, and timber & stone architectural photography.
      `;

      const routes = ["/", "/essays", "/archive"];
      const plan = PageExperiencePlanner.plan(archPublicationPrompt, routes);

      const rootPage = plan.pages.find((p) => p.route === "/");
      expect(rootPage).toBeDefined();
      expect(rootPage?.surfaceGenre).toBe("EDITORIAL_SPREAD");
    });

    it("PageExperienceQualityGate rejects editorial page roles for operational aerospace plans", () => {
      const mockOperationalPlan: any = {
        planId: "test-plan",
        experiencePattern: "realtime-console",
        experienceIdentity: {
          genre: "HIGH_DENSITY_CONSOLE",
        },
        pagePlans: [
          {
            route: "/",
            pageRole: "Monograph Cover & Opening Essay",
            forbiddenPatterns: [],
            requiredCapabilities: [],
          },
        ],
      };

      mkdirSync(join(TEST_DIR, "src", "pages"), { recursive: true });
      writeFileSync(
        join(TEST_DIR, "src", "pages", "HomePage.tsx"),
        `export function HomePage() { return <div>Flight Deck</div>; }`,
        "utf-8"
      );

      const report = PageExperienceQualityGate.audit(TEST_DIR, mockOperationalPlan);
      expect(report.passed).toBe(false);
      expect(report.summary).toContain("FAIL");
      const rootResult = report.routeResults.find((r) => r.route === "/");
      expect(rootResult?.status).toBe("FAIL");
      expect(rootResult?.violations.some((v) => v.includes("DOMAIN_ROLE_MISMATCH"))).toBe(true);
    });
  });
});
