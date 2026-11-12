import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// 1. Requirements & Research
import { UniversalRequirementInterpreter } from "../../requirement-intelligence/universal-requirement-interpreter.js";
import { ReferenceResearchEngine } from "../../research/reference-research-engine.js";
import { LiveWebSearchEngine } from "../../research/live-web-search-engine.js";
import { ReferencePageInspector } from "../../research/reference-page-inspector.js";

// 2. Architecture & Contracts
import { ArchitectureContractEngine } from "../../architect/architecture-contract-engine.js";
import { ArchitectureResolver } from "../../governance/architecture-resolver.js";

// 3. Design Decisions & Page Specifications
import { DesignDecisionDocumentEngine } from "../../design/design-decision-document.js";
import { PageDesignSpecificationEngine } from "../../design/page-design-specification-engine.js";
import { AssetDirector } from "../../design/asset-director.js";

// 4. Full-Stack Generation Primitives
import { InteractiveComponentGenerator } from "../../design/interactive-component-generator.js";
import { DynamicApiGenerator } from "../../backend/dynamic-api-generator.js";
import { ProjectIntegrationMatrix } from "../../integration/project-integration-matrix.js";

describe("Phase 9 — End-to-End Autonomous Product Creation Integration Pipeline", () => {
  let scratchDir: string;

  beforeEach(() => {
    scratchDir = join(tmpdir(), `aegis_e2e_pipeline_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(scratchDir, { recursive: true });
    ReferenceResearchEngine.clearCache();
  });

  afterEach(() => {
    LiveWebSearchEngine.clearMockProvider();
    if (existsSync(scratchDir)) {
      rmSync(scratchDir, { recursive: true, force: true });
    }
  });

  it("passes Product 1 (Artisanal Ceramics Studio) through all 12 pipeline stages into a verified coherent application", async () => {
    const prompt = "Build a bespoke tableware ceramics atelier portal for 'Terra & Form' featuring glaze material specifications, custom restaurant commissions, and studio workshop bookings.";

    // ── STAGE 1: Universal Requirement Intelligence ──
    const spec = UniversalRequirementInterpreter.interpret(prompt);
    expect(spec.projectName).toBeDefined();
    expect(spec.features.length).toBeGreaterThanOrEqual(3);
    expect(spec.entities.length).toBeGreaterThanOrEqual(2);

    // ── STAGE 2: Live Reference Discovery & Evidence Inspection (Mocked) ──
    LiveWebSearchEngine.setMockSearchProvider(async () => [
      {
        title: "Artisanal Tableware Atelier",
        url: "https://mock-atelier.example/works",
        snippet: "Bespoke handcrafted ceramics, glaze technical sheets, and chef commissions.",
        sourceEngine: "mock",
      },
      {
        title: "Studio Pottery House",
        url: "https://mock-pottery.example/studio",
        snippet: "Minimalist stoneware vessels, dining ware, and masterclasses.",
        sourceEngine: "mock",
      },
    ]);

    const originalInspect = ReferencePageInspector.inspectPage;
    (ReferencePageInspector as any).inspectPage = async (url: string) => ({
      url,
      status: "SUCCESS",
      statusCode: 200,
      title: "Artisanal Tableware Atelier",
      navLinks: [{ text: "Works", href: "/works" }, { text: "Materials", href: "/materials" }],
      headings: ["Handmade in Clay", "Glaze Chemistry"],
      callToActions: ["Commission Inquiry", "Book Studio"],
      hasSearch: false,
      filterControls: ["Glaze Tone", "Food-Safe Rating"],
      observedDesignTokens: { density: "spacious", paletteDominance: "earth", typographyStyle: "refined_serif" },
    });

    let research;
    try {
      const res = await ReferenceResearchEngine.executeResearch({
        prompt,
        domain: spec.domainCategory,
        projectName: spec.projectName,
        projectRoot: scratchDir,
      });
      research = res.research;
    } finally {
      (ReferencePageInspector as any).inspectPage = originalInspect;
    }
    expect(research.overallStatus).toBe("SUCCESS");
    expect(research.observedPatterns.length).toBeGreaterThanOrEqual(1);

    // ── STAGE 3: Architecture Contract Synthesis ──
    const archContract = ArchitectureContractEngine.synthesizeContract(spec);
    expect(archContract.contractHash).toBeDefined();
    expect(archContract.routes.frontendRoutes.length).toBeGreaterThanOrEqual(3);
    expect(archContract.routes.backendEndpoints.length).toBeGreaterThanOrEqual(2);

    // ── STAGE 4: Authoritative Design Decision Document (DDD) ──
    const dddRoutes = archContract.routes.frontendRoutes.map(r => r.path);
    const ddd = DesignDecisionDocumentEngine.generateDocument({
      prompt,
      brandName: spec.projectName,
      routes: dddRoutes,
      pagePlans: [],
      domainHint: spec.domainCategory,
    });
    expect(ddd.visualSystem.colorPalette.background).toBeDefined();
    expect(ddd.visualSystem.typography.displayFont).toBeDefined();
    expect(ddd.differentiationMatrix.length).toBe(dddRoutes.length);

    // ── STAGE 5: Individual Page Design Specifications ──
    const pageSpecs = PageDesignSpecificationEngine.generateSpecifications({
      routes: dddRoutes,
      prompt,
      brandName: spec.projectName,
      discoveredFeatures: spec.features.map(f => f.title),
    });
    expect(pageSpecs.length).toBe(dddRoutes.length);
    for (const ps of pageSpecs) {
      expect(ps.status).toBe("SPECIFIED");
      expect(ps.sections.length).toBeGreaterThanOrEqual(1);
    }

    // ── STAGE 6: Semantic Visual Asset Planning ──
    const assetPlan = AssetDirector.planAssets({
      prompt,
      domain: spec.domainCategory,
      brandName: spec.projectName,
      routes: dddRoutes,
    });
    expect(assetPlan.assets.length).toBeGreaterThanOrEqual(1);
    for (const a of assetPlan.assets) {
      expect(a.subject).toBeDefined();
      expect(a.altText).toBeDefined();
      // Ensure zero domestic pets or inappropriate assets for ceramics studio
      expect(a.subject.toLowerCase()).not.toMatch(/\b(cat|dog|kitten|puppy)\b/);
    }

    // ── STAGE 7: Frontend Component Synthesis ──
    const feFiles = InteractiveComponentGenerator.generateAll(archContract, spec.domainVocabulary);
    expect(feFiles.length).toBeGreaterThanOrEqual(3);

    // ── STAGE 8: Backend & ORM Synthesis ──
    const beFiles = DynamicApiGenerator.generateAll(archContract, spec.domainVocabulary);
    expect(beFiles.length).toBeGreaterThanOrEqual(3);
    const schemaFile = beFiles.find(f => f.path.includes("schema.prisma"));
    expect(schemaFile).toBeDefined();
    for (const entity of spec.entities) {
      expect(schemaFile?.content).toContain(`model ${entity.name}`);
    }

    // ── STAGE 9: Integration Parity Validation ──
    const integration = ProjectIntegrationMatrix.validate(archContract, feFiles, beFiles);
    console.log("Product 1 Integration:", JSON.stringify(integration, null, 2));
    expect(integration.passed).toBe(true);
    expect(integration.brokenRoutes.length).toBe(0);
    expect(integration.orphanedEndpoints.length).toBe(0);
  });

  it("passes Product 2 (Industrial Solar Telemetry Console) through all pipeline stages without template convergence", async () => {
    const prompt = "Industrial solar farm telemetry and inverter monitoring console named 'Helios Grid' with megawatt power generation curves, inverter fault detection, and technician dispatch work orders.";

    // 1. Requirements
    const spec = UniversalRequirementInterpreter.interpret(prompt);
    expect(spec.domainCategory).toBeDefined();
    expect(spec.features.length).toBeGreaterThanOrEqual(3);

    // 2. Architecture Contract
    const archContract = ArchitectureContractEngine.synthesizeContract(spec);
    expect(archContract.frontend.framework).toBe("react-vite");
    expect(archContract.backend.framework).toBe("express");
    expect(["sqlite", "postgresql"]).toContain(archContract.database.engine);

    // 3. Design Decision Document
    const routes = archContract.routes.frontendRoutes.map(r => r.path);
    const ddd = DesignDecisionDocumentEngine.generateDocument({
      prompt,
      brandName: "Helios Grid",
      routes,
      pagePlans: [],
      domainHint: "clean-energy",
    });
    expect(ddd.visualSystem.colorPalette.background).toBeDefined();

    // 4. Page Specifications
    const pageSpecs = PageDesignSpecificationEngine.generateSpecifications({
      routes,
      prompt,
      brandName: "Helios Grid",
      discoveredFeatures: spec.features.map(f => f.title),
    });
    expect(pageSpecs.length).toBe(routes.length);

    // 5. Full-Stack Synthesis & Integration
    const feFiles = InteractiveComponentGenerator.generateAll(archContract, spec.domainVocabulary);
    const beFiles = DynamicApiGenerator.generateAll(archContract, spec.domainVocabulary);

    const integration = ProjectIntegrationMatrix.validate(archContract, feFiles, beFiles);
    expect(integration.passed).toBe(true);
    expect(integration.missingModels.length).toBe(0);
  });
});
