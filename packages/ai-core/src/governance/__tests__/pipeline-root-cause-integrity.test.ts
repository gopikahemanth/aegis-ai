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
import type { ProductDesignBrief } from "../../design/design-director.js";
import type { Task } from "../../planner/task.js";

const TEST_DIR = join(process.cwd(), "temp-pipeline-root-cause-test");

describe("Phase 15: Pipeline Root-Cause Integrity & Gate Invariants", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(join(TEST_DIR, "src", "pages"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "features", "dashboard"), { recursive: true });
    mkdirSync(join(TEST_DIR, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
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
});
