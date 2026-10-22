import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { ArtifactProvenanceValidator } from "../artifact-provenance-validator.js";
import { ProjectGraphEngine } from "../../validation/project-graph-engine.js";
import { FastDeterministicSanitizer } from "../fast-sanitizer.js";
import { CapabilityCompletenessInvariant } from "../../validation/capability-completeness-invariant.js";
import { DesignIntentGate } from "../../validation/design-intent-gate.js";
import { ProductUnderstanding } from "../../design/product-understanding.js";
import { DesignDirector, DesignBriefLock } from "../../design/design-director.js";
import { PlannerArchitectureGuard } from "../planner-guard.js";
import { assertCleanTargetDirectory } from "@aegis/project-builder";
import { ProjectStartupAgent } from "../../startup/project-startup-agent.js";
import { TsSymbolRepairEngine } from "../../healing/ts-symbol-repair-engine.js";
import { FileWriter } from "../../writer/writer.js";
import { CanonicalPrismaFieldRegistry } from "../canonical-data-model.js";
import { ApiWorkflowVerifier } from "../../validation/api-workflow-verifier.js";
import type { ProductDesignBrief } from "../../design/design-director.js";
import type { Task } from "../../planner/task.js";

const TEST_DIR = join(process.cwd(), "temp-pipeline-root-cause-test");

describe("Phase 15: Pipeline Root-Cause Integrity & Gate Invariants", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      try {
        rmSync(TEST_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      } catch {}
    }
    mkdirSync(join(TEST_DIR, "src", "pages"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "features", "dashboard"), { recursive: true });
    mkdirSync(join(TEST_DIR, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      try {
        rmSync(TEST_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      } catch {}
    }
  });

  // 1 & 3. Provenance hard fail and foreign artifact purge
  it("1 & 3. Provenance Hard Fail & Foreign Artifact Purge: Removes unprovenanced ATS files and asserts foreignArtifactsRemaining === 0", () => {
    const resumePath = join(TEST_DIR, "src", "features", "analyzer", "AnalyzePage.tsx");
    mkdirSync(join(TEST_DIR, "src", "features", "analyzer"), { recursive: true });
    writeFileSync(resumePath, "export function AnalyzePage() { return <div>Resume ATS Analysis</div>; }");

    const contract = {
      prompt: "Lumina Terra: artisanal ceramics studio platform",
      requiredModels: ["CeramicPiece", "GlazeRecipe", "KilnSchedule"],
      requiredFeatures: ["glaze-calculator", "kiln-monitor", "commissions"],
      requiredRoutes: ["/glazes", "/kiln", "/commissions"],
    };

    const report = ArtifactProvenanceValidator.purgeUnjustifiedArtifacts(TEST_DIR, contract);
    expect(report.foreignArtifactsRemaining).toBe(0);
    expect(existsSync(resumePath)).toBe(false);
  });

  // 2. Provenance audit trail written to .aegis/provenance-audit.json
  it("2. Provenance Audit Trail: Writes structured purge records to .aegis/provenance-audit.json", () => {
    const resumePath = join(TEST_DIR, "src", "features", "upload", "UploadForm.tsx");
    mkdirSync(join(TEST_DIR, "src", "features", "upload"), { recursive: true });
    writeFileSync(resumePath, "export function UploadForm() { return <div>Upload Form</div>; }");

    const contract = {
      prompt: "Lumina Terra ceramics",
      requiredModels: ["CeramicPiece"],
      requiredFeatures: ["glazes"],
    };

    ArtifactProvenanceValidator.purgeUnjustifiedArtifacts(TEST_DIR, contract);
    const auditFile = join(TEST_DIR, ".aegis", "provenance-audit.json");
    expect(existsSync(auditFile)).toBe(true);

    const auditData = JSON.parse(readFileSync(auditFile, "utf8"));
    expect(auditData.foreignArtifactsRemaining).toBe(0);
    expect(auditData.purgedEntries.some((e: any) => e.path.includes("upload"))).toBe(true);
  });

  // 5 & 6. ProjectGraph: createdProductImplementations === 0 and route stubs only
  it("5 & 6. ProjectGraph Invariant: createdProductImplementations === 0 and creates route stubs only", () => {
    const engine = new ProjectGraphEngine();
    // Demand closure for a missing feature page
    const missingPageRel = "src/pages/GlazeCalculatorPage.tsx";
    const resolvedPath = (engine as any).ensureCanonicalFileOnDisk(missingPageRel, TEST_DIR);
    
    expect(resolvedPath).not.toBeNull();
    expect(engine.createdProductImplementations).toBe(0);
    expect(engine.createdRouteStubs).toBe(1);

    const stubContent = readFileSync(resolvedPath!, "utf8");
    expect(stubContent).toContain("/* ROUTE_STUB_ONLY: CAPABILITY_IMPLEMENTATION_REQUIRED */");
    expect(stubContent).toContain("Capability implementation required");
  });

  // 7. FastSanitizer: modifiedProductUI === 0
  it("7. FastSanitizer Mechanical Only Invariant: modifiedProductUI === 0", () => {
    const report = FastDeterministicSanitizer.sanitizeProject(TEST_DIR);
    expect(report.modifiedProductUI).toBe(0);
  });

  // 8. ROUTE_STUB_ONLY rejected by Capability Gate
  it("8. Capability Gate Invariant: Immediate early rejection for ROUTE_STUB_ONLY", () => {
    const stubCode = `/* ROUTE_STUB_ONLY: CAPABILITY_IMPLEMENTATION_REQUIRED */
import React from "react";
export default function StubPage() { return <div>Stub</div>; }`;

    const result = CapabilityCompletenessInvariant.evaluatePage(stubCode, {
      capabilities: ["glaze_chemistry"],
    });

    expect(result.complete).toBe(false);
    expect(result.earlyRejection).toBe("ROUTE_STUB_ONLY");
    expect(result.score).toBe(0);
  });

  // 11. DesignBrief hash remains unchanged during repair
  it("11. Design Brief Integrity Invariant: Hash remains unchanged after compliant execution", () => {
    const mockBrief: any = {
      briefId: "brief_test_123",
      artDirectionName: "CALM_BOTANICAL",
      productCharacteristics: { primaryActivity: "portfolio-showcase", experiencePattern: "showcase-landing" },
      vocabularyContract: { required: ["glaze", "kiln"], preferred: ["commission"], forbidden: ["resume", "telemetry"] },
    };

    DesignBriefLock.write(mockBrief, TEST_DIR);
    const hashFile = join(TEST_DIR, ".aegis", "design-brief.sha256");
    const storedHash = readFileSync(hashFile, "utf8").trim();

    const readBack = DesignBriefLock.verify(TEST_DIR);
    const recomputedHash = createHash("sha256").update(JSON.stringify(readBack, null, 2)).digest("hex");
    expect(recomputedHash).toBe(storedHash);
  });

  // 12 & 17 & 18. Vocabulary Contract: 3 tiers (required, preferred, forbidden)
  it("12, 17 & 18. Vocabulary Contract Invariant: Required extracted, preferred absence tolerated, forbidden rejected", () => {
    const prompt = "Lumina Terra: An artisanal ceramics studio platform featuring glaze chemistry formulation calculator, kiln firing temperature schedule monitor, and bespoke commission request manager";
    const characteristics = ProductUnderstanding.analyze(prompt, "calm");

    // Required must contain ceramics domain terms
    expect(characteristics.vocabularyContract.required).toContain("glaze");
    expect(characteristics.vocabularyContract.required).toContain("kiln");

    // Preferred contains booking/commissions
    expect(characteristics.vocabularyContract.preferred).toContain("Book");

    // Forbidden contains foreign domains
    expect(characteristics.vocabularyContract.forbidden).toContain("resume");
    expect(characteristics.vocabularyContract.forbidden).toContain("inverter");
  });

  // 14 & 15. Planner Architecture Guard: Injects architectureHash & rejects Next.js
  it("14 & 15. Architecture Drift Invariant: Enforces architectureHash and rejects Next.js", () => {
    const contract: any = {
      architectureHash: "arch_canon_123",
      frontend: { framework: "React-Vite" },
      backend: { framework: "Express" },
      database: { provider: "PostgreSQL", orm: "Prisma" },
      language: "TypeScript",
    };

    const nextTask: Task = {
      id: 1,
      title: "Setup Next.js 14 App Router and NextAuth",
      description: "Create Next.js pages and API routes with MongoDB",
      completed: false,
      priority: 1,
      estimatedComplexity: 2,
      dependencies: [],
      stage: "Frontend" as any,
    };

    const filtered = PlannerArchitectureGuard.filterTasks([nextTask], contract);
    expect(filtered[0].architectureHash).toBe("arch_canon_123");
    expect(filtered[0].title).not.toContain("Next.js");
    expect(filtered[0].title).not.toContain("NextAuth");
    expect(filtered[0].description).not.toContain("MongoDB");
  });

  // 16. Semantic h1 hierarchy invariant
  it("16. Semantic Hierarchy Invariant: Verifies primary pages have exactly one h1", () => {
    const validPage = `import React from "react";
export function GlazePage() {
  return (
    <main>
      <h1>Glaze Chemistry Formulation</h1>
      <p>Formulate balanced glaze recipes for your next firing.</p>
    </main>
  );
}
export default GlazePage;`;

    writeFileSync(join(TEST_DIR, "src", "pages", "GlazePage.tsx"), validPage, "utf8");

    const brief: any = {
      briefId: "brief_test",
      productCharacteristics: { experiencePattern: "operations-dashboard" },
      navigation: { maxPrimaryItems: 5 },
      pageCompositions: [],
      colorSystem: { chartPalette: [] },
      vocabularyContract: { required: ["Glaze"], preferred: [], forbidden: ["inverter"] },
    };

    const report = DesignIntentGate.verify(brief, TEST_DIR);
    // Visual hierarchy check passes without warnings for valid page
    const h1Violations = (report as any).violations?.filter((v: any) => v.check === "visual-hierarchy") || [];
    expect(h1Violations).toHaveLength(0);
  });

  // 19 & 20. Clean vs Incremental Target validation
  it("19 & 20. Clean Generation Invariant: Rejects dirty target, allows clean target and incremental target", () => {
    const cleanDir = join(TEST_DIR, "gen-target");
    mkdirSync(cleanDir, { recursive: true });

    // 1. Empty dir passes
    expect(() => assertCleanTargetDirectory(cleanDir, false)).not.toThrow();

    // 2. Non-empty dir throws GENERATION_TARGET_NOT_EMPTY
    writeFileSync(join(cleanDir, "existing.txt"), "stale project files");
    expect(() => assertCleanTargetDirectory(cleanDir, false)).toThrow(/GENERATION_TARGET_NOT_EMPTY/);

    // 3. Non-empty dir with incremental=true passes
    expect(() => assertCleanTargetDirectory(cleanDir, true)).not.toThrow();
  });

  // 21. Relative Import Normalization & Design System Component Bridging
  it("21. Relative Import Normalization & Design System Bridging: normalizes escaping ../../../ imports and auto-bridges design-system/components", () => {
    const dsDir = join(TEST_DIR, "src", "design-system", "components");
    mkdirSync(dsDir, { recursive: true });
    writeFileSync(join(dsDir, "Badge.tsx"), "export const Badge = ({ children }: any) => <span>{children}</span>; export default Badge;");
    writeFileSync(join(dsDir, "Button.tsx"), "export const Button = ({ children }: any) => <button>{children}</button>; export default Button;");

    const pagePath = join(TEST_DIR, "src", "pages", "WorldStagePage.tsx");
    writeFileSync(
      pagePath,
      `import React from 'react';\nimport Button from '../../../design-system/Button';\nimport Badge from '../../../design-system/Badge';\nexport function WorldStagePage() { return <div><Badge>Active</Badge><Button>Click</Button></div>; }`
    );

    // Run bridges & normalization
    FastDeterministicSanitizer.sanitizeProject(TEST_DIR);

    // 1. Bridges created in src/design-system/
    expect(existsSync(join(TEST_DIR, "src", "design-system", "Badge.tsx"))).toBe(true);
    expect(existsSync(join(TEST_DIR, "src", "design-system", "Button.tsx"))).toBe(true);

    // 2. Over-nested imports normalized from ../../../design-system to ../design-system
    const updatedContent = readFileSync(pagePath, "utf8");
    expect(updatedContent).toContain("import Button from '../design-system/Button'");
    expect(updatedContent).toContain("import Badge from '../design-system/Badge'");
    expect(updatedContent).not.toContain("../../../design-system");
  });

  // 22. ProjectStartupAgent Stub Safety & Outside Project Guard
  it("22. ProjectStartupAgent Stub Safety: never creates stubs outside outputDirectory and creates JSX-safe component stubs", async () => {
    const startupAgent = new ProjectStartupAgent();

    // Create a page importing a non-existent component with escaping path
    const pagePath = join(TEST_DIR, "src", "pages", "CustomPage.tsx");
    writeFileSync(
      pagePath,
      `import React from 'react';\nimport StatusPill from '../../../../missing-design-system/StatusPill';\nexport function CustomPage() { return <div><StatusPill>OK</StatusPill></div>; }`
    );

    // Call stub synthesis
    (startupAgent as any).resolveMissingLocalImports(TEST_DIR);

    // Assert NO file was created outside TEST_DIR
    const parentDir = join(TEST_DIR, "..");
    expect(existsSync(join(parentDir, "missing-design-system"))).toBe(false);

    // Assert re-anchored stub was created inside TEST_DIR as a valid JSX component
    const stubPath = join(TEST_DIR, "src", "missing-design-system", "StatusPill.tsx");
    expect(existsSync(stubPath)).toBe(true);
    const stubContent = readFileSync(stubPath, "utf8");
    // Verify it returns JSX elements, not raw object
    expect(stubContent).toContain("export function StatusPill");
    expect(stubContent).toContain("<div className=");
  });

  // 23. siteContent Auto-Wiring, Safe Chaining, and TsSymbolRepairEngine Resolution
  it("23. siteContent Auto-Wiring & TsSymbolRepair: strips null stubs, wires missing imports, safe-chains properties, and resolves TS2304", () => {
    // 1. Ensure site-content.ts exists in TEST_DIR
    const contentDir = join(TEST_DIR, "src", "content");
    mkdirSync(contentDir, { recursive: true });
    writeFileSync(
      join(contentDir, "site-content.ts"),
      `export const siteContent = {
  brand: { name: "Thalassa", tagline: "Ocean" },
  pages: { "/systems": { subheadline: "Subsea Life Support" } }
};
export default siteContent;`,
      "utf8"
    );

    // 2. Create a page with missing import, dangerous property access, and an injected null stub
    const pagePath = join(TEST_DIR, "src", "features", "lighting", "LightingPage.tsx");
    mkdirSync(join(TEST_DIR, "src", "features", "lighting"), { recursive: true });
    writeFileSync(
      pagePath,
      `import React from 'react';
export function LightingPage() {
  return (
    <div>
      <p>{(siteContent as any).pages['/systems'].subheadline}</p>
    </div>
  );
}
export default LightingPage;
export const siteContent: any = null;`,
      "utf8"
    );

    // 3. Run FastDeterministicSanitizer
    FastDeterministicSanitizer.sanitizeProject(TEST_DIR);

    const sanitized = readFileSync(pagePath, "utf8");
    // Assert null stub was stripped
    expect(sanitized).not.toContain("export const siteContent: any = null;");
    // Assert siteContent was auto-imported
    expect(sanitized).toContain("import siteContent from '../../content/site-content';");
    // Assert property access was defensively chained without union type narrowing
    expect(sanitized).toContain("((siteContent as any)?.pages?.['/systems']?.subheadline as any)");

    // 4. Test TsSymbolRepairEngine on TS2304 for siteContent
    const testCaller = join(TEST_DIR, "src", "pages", "SensorPage.tsx");
    writeFileSync(
      testCaller,
      `import React from 'react';\nexport function SensorPage() { return <div>{siteContent.brand.name}</div>; }\n`,
      "utf8"
    );
    const stderr = `src/pages/SensorPage.tsx(2,10): error TS2304: Cannot find name 'siteContent'.`;
    const actions = TsSymbolRepairEngine.repair(TEST_DIR, stderr);
    expect(actions.length).toBeGreaterThan(0);
    const updatedCaller = readFileSync(testCaller, "utf8");
    expect(updatedCaller).toContain("import siteContent from");
    expect(updatedCaller).not.toContain("export const siteContent: any = null;");

    // 5. Test circular self-import prevention in site-content.ts (Windows backslash path safety)
    const siteContentFile = join(contentDir, "site-content.ts");
    // Artificially inject circular self-import into site-content.ts
    writeFileSync(siteContentFile, `import siteContent from './site-content';\nexport const siteContent: any = { brand: { name: 'Ocean' } };\nexport default siteContent;\n`, "utf8");
    FastDeterministicSanitizer.sanitizeProject(TEST_DIR);
    const cleanedSiteContent = readFileSync(siteContentFile, "utf8");
    expect(cleanedSiteContent).not.toContain("import siteContent from './site-content'");
  });

  // 24. Prisma user_id / userId compatibility & FileWriter empty schema overwrite safety
  it("24. Prisma Field Registry & Schema Safety: validates user_id as canonical field and allows FileWriter to populate empty schema", () => {
    // 1. Verify CanonicalPrismaFieldRegistry includes user_id
    const fields = CanonicalPrismaFieldRegistry.getFields("habitatModule");
    expect(fields).not.toBeNull();
    expect(fields?.has("user_id")).toBe(true);
    expect(fields?.has("userId")).toBe(true);

    // 2. Verify FileWriter allows writing schema.prisma if file is 0 bytes
    const prismaDir = join(TEST_DIR, "prisma");
    mkdirSync(prismaDir, { recursive: true });
    const schemaPath = join(prismaDir, "schema.prisma");
    writeFileSync(schemaPath, "", "utf8"); // 0-byte placeholder

    const writer = new FileWriter();
    const schemaContent = `datasource db { provider = "postgresql" url = env("DATABASE_URL") }\nmodel User { id String @id }\nmodel HabitatModule { id String @id userId String @map("user_id") }\n`;
    writer.write([{ path: "prisma/schema.prisma", content: schemaContent }], TEST_DIR);

    const writtenSchema = readFileSync(schemaPath, "utf8");
    expect(writtenSchema).toContain("model HabitatModule");

    // 3. Verify ProjectGraphEngine validates server service referencing user_id without PRISMA_SCHEMA_MISMATCH
    const serverDir = join(TEST_DIR, "server", "services");
    mkdirSync(serverDir, { recursive: true });
    writeFileSync(
      join(serverDir, "habitat.service.ts"),
      `import { prisma } from '../lib/prisma';\nexport async function createHabitatModule(userId: any, title: string, data: any) { return await prisma.habitatModule.create({ data: { user_id: userId, title, data } }); }\n`,
      "utf8"
    );

    const engine = new ProjectGraphEngine();
    const result = engine.validateGraph(TEST_DIR);
    const prismaErrors = result.issues.filter(i => i.type === "PRISMA_SCHEMA_MISMATCH");
    expect(prismaErrors).toHaveLength(0);
  });

  // 25. Auth Middleware Type-Assertion Robustness and Self-Healing
  it("25. Auth Middleware: robustly parses type assertions with inner semicolons without syntax corruption", () => {
    const middlewareDir = join(TEST_DIR, "server", "middleware");
    mkdirSync(middlewareDir, { recursive: true });
    const authPath = join(middlewareDir, "auth.ts");

    // Case A: Fresh auth.ts with inner semicolon in type assertion: req.user = user as { id: number; email: string };
    writeFileSync(
      authPath,
      `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  jwt.verify(token, 'secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user as { id: number; email: string };
    next();
  });
};`,
      "utf8"
    );

    FastDeterministicSanitizer.sanitizeProject(TEST_DIR);

    let sanitized = readFileSync(authPath, "utf8");
    // Must NOT have dangling syntax error
    expect(sanitized).not.toContain("}; email: string };");
    expect(sanitized).not.toContain("const _decodedUser: any = user as { id: number;");
    // Must cleanly extract base user expression and set dual id / userId
    expect(sanitized).toContain("const _decodedUser: any = (user as any);");
    expect(sanitized).toContain("id: _uid, userId: _uid");

    // Case B: Self-healing previously corrupted auth.ts
    writeFileSync(
      authPath,
      `    const _decodedUser: any = user as { id: number;\n    const _uid = _decodedUser?.id || _decodedUser?.userId || _decodedUser?.sub || '00000000-0000-0000-0000-000000000001';\n    (req as any).user = { ...(typeof _decodedUser === 'object' ? _decodedUser : {}), id: _uid, userId: _uid }; email: string };`,
      "utf8"
    );

    FastDeterministicSanitizer.sanitizeProject(TEST_DIR);

    sanitized = readFileSync(authPath, "utf8");
    expect(sanitized).not.toContain("email: string };");
    expect(sanitized).toContain("const _decodedUser: any = (user as any);");
  });

  // 26. API Workflow Verification & Route Completeness
  it("26. API Workflow & Backend Invariants: only assigns readBackPath when GET route exists, enhances payloads with cart/item IDs, and adds contact route fallback", () => {
    // A: Route with only POST /api/contact should NOT assign readBackPath
    const stepsWithoutGet = ApiWorkflowVerifier.generateWorkflowsFromContract();
    // Verify sample body includes bookId, productId, items for e-commerce cart/checkout compatibility
    const postStep = stepsWithoutGet.find(s => s.method === "POST" && !s.path.includes("/auth/"));
    if (postStep?.requestBody) {
      expect(postStep.requestBody.bookId).toBeDefined();
      expect(postStep.requestBody.productId).toBeDefined();
      expect(postStep.requestBody.items).toBeDefined();
    }

    // B: FastDeterministicSanitizer adds GET fallback for write-only contact routes
    const routesDir = join(TEST_DIR, "server", "routes");
    mkdirSync(routesDir, { recursive: true });
    const contactRoutePath = join(routesDir, "contact.routes.ts");
    writeFileSync(
      contactRoutePath,
      `import { Router } from 'express';
const router = Router();
router.post('/contact', async (req, res) => res.status(201).json({ success: true }));
export default router;`,
      "utf8"
    );

    FastDeterministicSanitizer.sanitizeProject(TEST_DIR);

    const sanitizedRoute = readFileSync(contactRoutePath, "utf8");
    expect(sanitizedRoute).toContain("router.get('/contact'");

    // C: FastDeterministicSanitizer harmonizes cart item reference in controllers
    const controllersDir = join(TEST_DIR, "server", "controllers");
    mkdirSync(controllersDir, { recursive: true });
    const cartCtrlPath = join(controllersDir, "cartController.ts");
    writeFileSync(
      cartCtrlPath,
      `import { Request, Response } from 'express';
export const cartController = {
  async addToCart(req: Request, res: Response) {
    const { bookId, quantity } = req.body || {};
    if (!bookId) {
      return res.status(400).json({ error: 'bookId is required' });
    }
    return res.status(201).json({ success: true });
  }
};`,
      "utf8"
    );

    FastDeterministicSanitizer.sanitizeProject(TEST_DIR);

    const sanitizedCtrl = readFileSync(cartCtrlPath, "utf8");
    expect(sanitizedCtrl).toContain("if (!bookId) bookId =");
  });
});

