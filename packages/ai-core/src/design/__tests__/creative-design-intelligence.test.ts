import { describe, it, expect } from "vitest";
import { PageExperiencePlanner } from "../page-experience-plan.js";
import { DesignReferenceIntelligence } from "../design-reference-intelligence.js";
import { DesignDecisionDocumentEngine } from "../design-decision-document.js";
import { DesignBriefGenerator } from "../design-brief-generator.js";
import { NavigationDesignResolver } from "../navigation-design.js";
import { DesignDirector } from "../design-director.js";
import { ProductUnderstanding } from "../product-understanding.js";
import { ExperienceCapabilityResolver } from "../experience-capability-plan.js";
import { ExperienceArchitect } from "../experience-architect.js";
import { ThemeGenerator } from "../theme-generator.js";
import { TypographyManager } from "../typography-catalog.js";
import { TemplateConvergenceGate } from "../../validation/template-convergence-gate.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Creative Design Intelligence & Anti-Convergence Engine", () => {
  const architecturePrompt =
    "Build a Luxury Architectural & Sustainable Interior Design Studio platform with interactive portfolio gallery, budget & dimension room estimator, sustainable material swatchboard, design consultation booking, project milestones tracking portal, and client reviews.";

  it("1. Dynamic Reference Research selects authentic real-world references and rejects anti-patterns", () => {
    const research = DesignReferenceIntelligence.research(architecturePrompt, "architecture");

    expect(research.productCategory).toContain("Architecture");
    expect(research.visualThesis).toContain("architectural journal");
    expect(research.sharedDesignLanguage.colorPaletteDirection.background).toBe("#F3F0E8");
    expect(research.sharedDesignLanguage.colorPaletteDirection.primary).toBe("#465342");
    expect(research.primaryWorkflows.length).toBeGreaterThanOrEqual(3);
  });

  it("2. Dynamic Reference Research adapts to diverse domains (Skincare, Expeditions, Maritime)", () => {
    const skincare = DesignReferenceIntelligence.research("Botanical organic skincare apothecary and serum routine finder", "skincare-apothecary");
    expect(skincare.productCategory).toContain("Skincare");
    expect(skincare.sharedDesignLanguage.colorPaletteDirection.background.startsWith("#")).toBe(true);

    const expedition = DesignReferenceIntelligence.research("Alpine wilderness expedition bookings with elevation trails", "outdoor-expeditions");
    expect(expedition.productCategory).toContain("Expeditions");
    expect(expedition.sharedDesignLanguage.colorPaletteDirection.primary.startsWith("#")).toBe(true);

    const maritime = DesignReferenceIntelligence.research("Port container logistics and live vessel fleet tracking", "maritime-logistics");
    expect(maritime.productCategory).toContain("Maritime");
    expect(maritime.sharedDesignLanguage.colorPaletteDirection.background.startsWith("#")).toBe(true);
  });

  it("3. DesignBriefGenerator derives authentic domain identity without hypercar or horology hijacking", () => {
    const brief = DesignBriefGenerator.generateBrief({
      prompt: architecturePrompt,
      domain: "architecture",
      routes: ["/", "/portfolio", "/estimator", "/materials", "/consultation", "/milestones", "/reviews"],
    });

    expect(brief.projectType).toContain("Architectural");
    expect(brief.projectType).not.toContain("Hypercar");
    expect(brief.visualPositioning).toContain("Architectural");
    expect(brief.visualPositioning).not.toContain("Haute Horlogerie");
    expect(brief.signatureInteraction.name).toContain("Spatial Room Dimension");
    expect(brief.heroComposition.type).toBe("editorial-headline");

    // Verify page section plan has purpose-specific sections, NOT generic DataTableSection
    const estimatorSection = brief.pageSectionPlan.find((p) => p.pageRoute === "/estimator");
    expect(estimatorSection).toBeDefined();
    expect(estimatorSection!.sections.some((s) => s.componentType === "SpatialCanvasSection")).toBe(true);
    expect(estimatorSection!.sections.some((s) => s.componentType === "LiveBudgetLedgerSection")).toBe(true);
    expect(estimatorSection!.sections.every((s) => s.componentType !== "DataTableSection")).toBe(true);

    const reviewsSection = brief.pageSectionPlan.find((p) => p.pageRoute === "/reviews");
    expect(reviewsSection).toBeDefined();
    expect(reviewsSection!.sections.some((s) => s.componentType === "ReviewSubmissionSection")).toBe(true);
    expect(reviewsSection!.sections.every((s) => s.componentType !== "DataTableSection")).toBe(true);
  });

  it("4. Regression Test: 5 core architectural routes provide completely distinct topologies and interactions", () => {
    const routes = [
      "/portfolio",
      "/estimator",
      "/materials",
      "/consultation",
      "/milestones",
      "/reviews",
    ];

    const { pages } = PageExperiencePlanner.plan(architecturePrompt, routes);

    const estimator = pages.find((p) => p.route === "/estimator");
    const reviews = pages.find((p) => p.route === "/reviews");
    const consultation = pages.find((p) => p.route === "/consultation");
    const materials = pages.find((p) => p.route === "/materials");
    const portfolio = pages.find((p) => p.route === "/portfolio");
    const milestones = pages.find((p) => p.route === "/milestones");

    expect(estimator).toBeDefined();
    expect(reviews).toBeDefined();
    expect(consultation).toBeDefined();
    expect(materials).toBeDefined();
    expect(portfolio).toBeDefined();
    expect(milestones).toBeDefined();

    // 1. Estimator has spatial calculation design
    expect(estimator!.composition.topology).toBe("WORKSPACE_SPLIT");
    expect(estimator!.interaction.primary.some((i) => i.includes("room dimensions") || i.includes("cost calculation"))).toBe(true);
    expect(estimator!.focalElement).toContain("spatial room canvas");

    // 2. Client review has feedback design
    expect(reviews!.composition.topology).toBe("VERIFIED_FEEDBACK_WALL");
    expect(reviews!.interaction.primary.some((i) => i.includes("client review") || i.includes("ratings"))).toBe(true);
    expect(reviews!.focalElement).toContain("spotlight");

    // 3. Consultation has booking design
    expect(consultation!.composition.topology).toBe("BOOKING_FLOW");
    expect(consultation!.interaction.primary.some((i) => i.includes("consultation tier") || i.includes("time slot"))).toBe(true);

    // 4. Material board has composition/tactile design
    expect(materials!.composition.topology).toBe("TACTILE_SWATCHBOARD");
    expect(materials!.interaction.primary.some((i) => i.includes("swatch") || i.includes("provenance"))).toBe(true);

    // 5. Portfolio has gallery/masonry design
    expect(portfolio!.composition.topology).toBe("EDITORIAL_MASONRY");
    expect(portfolio!.interaction.primary.some((i) => i.includes("typology") || i.includes("photography"))).toBe(true);

    // 6. Milestones has journey/approval design
    expect(milestones!.composition.topology).toBe("CHRONOLOGICAL_JOURNEY");
    expect(milestones!.interaction.primary.some((i) => i.includes("progress") || i.includes("sign-off"))).toBe(true);

    // Cross-Route Differentiation: No two pages share the same topology
    const topologies = [
      estimator!.composition.topology,
      reviews!.composition.topology,
      consultation!.composition.topology,
      materials!.composition.topology,
      portfolio!.composition.topology,
      milestones!.composition.topology,
    ];
    const uniqueTopologies = new Set(topologies);
    expect(uniqueTopologies.size).toBe(6);
  });

  it("5. DesignDecisionDocumentEngine generates complete Sections A–G with Page Differentiation Matrix", () => {
    const routes = ["/", "/portfolio", "/estimator", "/materials", "/consultation", "/reviews"];
    const { pages } = PageExperiencePlanner.plan(architecturePrompt, routes);

    const doc = DesignDecisionDocumentEngine.generateDocument({
      prompt: architecturePrompt,
      brandName: "Atelier Form",
      routes,
      pagePlans: pages,
      domainHint: "architecture",
    });

    expect(doc.projectIdentity.productName).toBe("Atelier Form");
    expect(doc.projectIdentity.visualThesis).toContain("architectural journal");
    expect(doc.visualSystem.colorPalette.background).toBe("#F3F0E8");
    expect(doc.sitemap.length).toBe(6);
    expect(doc.pageBlueprints.length).toBe(6);
    expect(doc.differentiationMatrix.length).toBe(6);
    expect(doc.differentiationAudit.convergenceDetected).toBe(false);

    // Test persistence
    const tmpDir = mkdtempSync(join(tmpdir(), "aegis-ddd-test-"));
    try {
      DesignDecisionDocumentEngine.save(doc, tmpDir);
      expect(existsSync(join(tmpDir, ".aegis", "design-decision-document.json"))).toBe(true);
      expect(existsSync(join(tmpDir, ".aegis", "design-decision-document.md"))).toBe(true);

      const savedMd = readFileSync(join(tmpDir, ".aegis", "design-decision-document.md"), "utf8");
      expect(savedMd).toContain("# DESIGN DECISION DOCUMENT (DDD)");
      expect(savedMd).toContain("SECTION F: PAGE DIFFERENTIATION MATRIX");
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("6. TemplateConvergenceGate audits distinct pages cleanly and flags identical parameter controls", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "aegis-conv-test-"));
    const srcDir = join(tmpDir, "src", "pages");
    mkdirSync(srcDir, { recursive: true });

    try {
      // Create distinct estimator page
      writeFileSync(
        join(srcDir, "EstimatorPage.tsx"),
        `export function EstimatorPage() {
          const params = [
            { id: "roomWidth", name: "Width Dimension" },
            { id: "roomLength", name: "Length Dimension" }
          ];
          return <div>Estimator {params.length}</div>;
        }`,
        "utf8"
      );

      // Create distinct review page
      writeFileSync(
        join(srcDir, "ReviewPage.tsx"),
        `export function ReviewPage() {
          const params = [
            { id: "craftScore", name: "Craftsmanship Rating" },
            { id: "timelineScore", name: "Timeline Adherence" }
          ];
          return <div>Review {params.length}</div>;
        }`,
        "utf8"
      );

      const reportPass = TemplateConvergenceGate.audit(tmpDir, null);
      expect(reportPass.passed).toBe(true);

      // Now inject convergence: duplicate estimator params into ReviewPage
      writeFileSync(
        join(srcDir, "ReviewPage.tsx"),
        `export function ReviewPage() {
          const params = [
            { id: "roomWidth", name: "Width Dimension" },
            { id: "roomLength", name: "Length Dimension" }
          ];
          return <div>Review {params.length}</div>;
        }`,
        "utf8"
      );

      const reportFail = TemplateConvergenceGate.audit(tmpDir, null);
      expect(reportFail.passed).toBe(false);
      expect(reportFail.violations.some((v) => v.includes("CROSS_ROUTE_STRUCTURAL_CONVERGENCE_DETECTED"))).toBe(true);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("7. FastSanitizer rule: NEVER silently overwrites a custom product page", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "aegis-sanitizer-test-"));
    const srcDir = join(tmpDir, "src", "pages");
    mkdirSync(srcDir, { recursive: true });

    try {
      const customPageContent = `import React from "react";
export function CalculateRoomBudgetPage() {
  return (
    <div className="custom-spatial-estimator">
      <h1>Spatial Room Plan</h1>
      <p>Custom user-designed architectural canvas</p>
    </div>
  );
}
export default CalculateRoomBudgetPage;`;

      const targetFile = join(srcDir, "CalculateRoomBudgetPage.tsx");
      writeFileSync(targetFile, customPageContent, "utf8");

      // Run sanitize project
      FastDeterministicSanitizer.sanitizeProject(tmpDir, {
        requiredRoutes: ["/calculate-room-budget"],
      });

      // Assert file was NOT overwritten with generic experience generator
      const postSanitizeContent = readFileSync(targetFile, "utf8");
      expect(postSanitizeContent).toContain("custom-spatial-estimator");
      expect(postSanitizeContent).toContain("Custom user-designed architectural canvas");
      expect(postSanitizeContent).not.toContain("Artisan Joinery Configurator");
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("8. FastSanitizer bridges components in src/components/ to route pages without generic telemetry fallbacks", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "aegis-bridge-test-"));
    const compDir = join(tmpDir, "src", "components");
    mkdirSync(compDir, { recursive: true });

    try {
      // 1. Create a bespoke component in src/components/
      writeFileSync(
        join(compDir, "RoomEstimator.tsx"),
        `import React from "react";\nexport function RoomEstimator() { return <div data-testid="room-estimator">Bespoke Room Estimator</div>; }\nexport default RoomEstimator;\n`,
        "utf8"
      );

      // 2. Synthesize route page for /calculate-room-budget-and-dimensions
      const srcDir = join(tmpDir, "src");
      FastDeterministicSanitizer.synthesizeDedicatedRoutePage(
        srcDir,
        "CalculateRoomBudgetAndDimensionsPage",
        "/calculate-room-budget-and-dimensions",
        ["calculate", "room", "budget", "and", "dimensions"],
        { prompt: "Calculate room budget and dimensions" } as any
      );

      const pagePath = join(tmpDir, "src", "pages", "CalculateRoomBudgetAndDimensionsPage.tsx");
      expect(existsSync(pagePath)).toBe(true);
      const pageContent = readFileSync(pagePath, "utf8");

      // Verify it imports the bespoke RoomEstimator component and does NOT generate generic intensity sliders
      expect(pageContent).toContain("../components/RoomEstimator");
      expect(pageContent).not.toContain("Calculater Intensity");
      expect(pageContent).not.toContain("Calculater Sensitivity");
      expect(pageContent).not.toContain("calculater_calculater");
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("9. FastSanitizer does NOT synthesize DashboardPage.tsx for non-dashboard projects", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "aegis-no-dash-test-"));
    const srcDir = join(tmpDir, "src");
    mkdirSync(srcDir, { recursive: true });

    try {
      FastDeterministicSanitizer.ensurePreBaselineDashboardCompleteness(srcDir, {
        prompt: "Build a Luxury Architectural & Sustainable Interior Design Studio platform with interactive portfolio gallery and room estimator",
        applicationType: "Portfolio & Studio Platform",
        requiredRoutes: ["/", "/portfolio", "/estimator"],
      } as any);

      // Verify DashboardPage.tsx was NOT created
      const dashPath = join(srcDir, "pages", "DashboardPage.tsx");
      expect(existsSync(dashPath)).toBe(false);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("10. NavigationDesignResolver formats human title-cased labels instead of kebab-case slugs", () => {
    expect(NavigationDesignResolver.formatCleanLabel("/portfolio-and-lightbox", "portfolio-and-lightbox")).toBe("Portfolio");
    expect(NavigationDesignResolver.formatCleanLabel("/calculate-room-budget-and-dimensions", "calculate-room-budget-and-dimensions")).toBe("Room Estimator");
    expect(NavigationDesignResolver.formatCleanLabel("/sustainable-material-swatchboard", "sustainable-material-swatchboard")).toBe("Material Swatchboard");
    expect(NavigationDesignResolver.formatCleanLabel("/book-design-consultation-flow", "book-design-consultation-flow")).toBe("Consultation");
    expect(NavigationDesignResolver.formatCleanLabel("/project-milestones-in-client-portal", "project-milestones-in-client-portal")).toBe("Client Portal");
  });

  it("11. DesignDirector selects ARCHITECTURAL_EDITORIAL art direction (never NEON_SYNTHETIC) for architecture studios", () => {
    const characteristics = ProductUnderstanding.analyze(architecturePrompt);
    const artDirection = DesignDirector.selectArtDirection(characteristics, 42, undefined, architecturePrompt);

    expect(artDirection.archetype).toBe("ARCHITECTURAL_EDITORIAL");
    expect(artDirection.archetype).not.toBe("NEON_SYNTHETIC");
    expect(artDirection.colorSystem.mode).toBe("light");
    expect(artDirection.colorSystem.background).toBe("#F3F0E8"); // Warm limestone
    expect(artDirection.colorSystem.textPrimary).toBe("#252821"); // Deep charcoal
    expect(artDirection.typography.fontDisplay).toContain("Cormorant Garamond");
    expect(artDirection.typography.fontBody).toContain("DM Sans");
  });

  it("12. NavigationDesign selects top_masthead with wordmark for architecture studios (never floating_pills)", () => {
    const nav = NavigationDesignResolver.resolve(
      architecturePrompt,
      "showcase-landing",
      "Atelier Form",
      "Architecture & Spatial Design",
      [{ path: "/", title: "Studio" }, { path: "/portfolio", title: "Portfolio" }]
    );

    expect(nav.model).toBe("top_masthead");
    expect(nav.model).not.toBe("floating_pills");
    expect(nav.brandTreatment.logoType).toBe("wordmark");
    expect(nav.interactionModel).toBe("understated-serif-underline");
  });

  it("13. ExperienceArchitect designs bespoke ARCHITECTURAL_ATELIER composition without generic telemetry workbenches", () => {
    const characteristics = ProductUnderstanding.analyze(architecturePrompt);
    const capabilityPlan = ExperienceCapabilityResolver.resolve(architecturePrompt);
    const graph = ExperienceArchitect.architect(architecturePrompt, characteristics, capabilityPlan);

    expect(graph.compositionStrategy).toBe("ARCHITECTURAL_ATELIER");
    expect(graph.structuralFingerprint).toContain("ARCHITECTURAL_ATELIER:minimal-top-masthead");
    expect(graph.structuralFingerprint).not.toContain("Interactive primary workspace");
    expect(graph.structuralFingerprint).not.toContain("Activity & State Ledger");

    const sectionNames = graph.sections.map((s) => s.name);
    expect(sectionNames).toContain("Architectural Studio Monolith");
    expect(sectionNames).toContain("Curated Works Gallery");
    expect(sectionNames).toContain("Sustainable Material Swatchboard");
    expect(sectionNames).toContain("Room Dimension & Budget Estimator");
  });

  it("14. TypographyManager selects Cormorant Garamond & DM Sans for luxury architecture domains", () => {
    const pairing = TypographyManager.selectPairing({
      domain: "Luxury Architecture Studio",
      prompt: architecturePrompt,
    });

    expect(pairing.id).toBe("cormorant_dm_sans");
    expect(pairing.displayFont).toBe("Cormorant Garamond");
    expect(pairing.bodyFont).toBe("DM Sans");
    expect(pairing.googleFontsUrl).toContain("Cormorant+Garamond");
    expect(pairing.googleFontsUrl).toContain("DM+Sans");
  });

  it("15. Multi-Domain Art Direction Integrity: 5 diverse domains produce distinct, authentic identities", () => {
    const domains = [
      { prompt: architecturePrompt, expectedArchetype: "ARCHITECTURAL_EDITORIAL", forbiddenArchetype: "NEON_SYNTHETIC" },
      { prompt: "High-frequency quantitative trading desk and order routing telemetry", expectedArchetype: "OBSIDIAN_PRECISION", forbiddenArchetype: "PLAYFUL_APPROACHABLE" },
      { prompt: "Botanical plant care companion and soil moisture tracking journal", expectedArchetype: "CALM_BOTANICAL", forbiddenArchetype: "INDUSTRIAL_UTILITY" },
      { prompt: "Commercial container port logistics and live vessel AIS navigation map", expectedArchetype: "OCEANIC_MARITIME", forbiddenArchetype: "CALM_BOTANICAL" },
      { prompt: "Heavy industrial equipment telemetry and predictive motor maintenance", expectedArchetype: "INDUSTRIAL_UTILITY", forbiddenArchetype: "ARCHITECTURAL_EDITORIAL" },
    ];

    const archetypesSeen = new Set<string>();
    for (const d of domains) {
      const chars = ProductUnderstanding.analyze(d.prompt);
      const ad = DesignDirector.selectArtDirection(chars, 100, undefined, d.prompt);

      expect(ad.archetype).toBe(d.expectedArchetype);
      expect(ad.archetype).not.toBe(d.forbiddenArchetype);
      archetypesSeen.add(ad.archetype);
    }

    // Proves all 5 domains have mutually distinct visual archetypes
    expect(archetypesSeen.size).toBe(5);
  });
});
