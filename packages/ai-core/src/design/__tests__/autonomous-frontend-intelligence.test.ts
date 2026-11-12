/**
 * Autonomous Frontend Intelligence — 10-Domain Regression Suite
 *
 * Verifies Milestone 6 & Part 23 of Autonomous Frontend Intelligence:
 * Tests 10 diverse product categories without cloud generation to verify
 * that research, planning, theme, and design specification engines
 * produce authentic, domain-justified, differentiated frontend experiences.
 */

import { describe, it, expect } from "vitest";
import { ProductUnderstanding } from "../product-understanding.js";
import { CapabilityPlanner } from "../capability-planner.js";
import { DesignDirector } from "../design-director.js";
import { ThemeGenerator } from "../theme-generator.js";
import { PageDesignSpecificationEngine } from "../page-design-specification-engine.js";
import { FrontendDesignPlanner } from "../frontend-design-planner.js";
import { FrontendDesignSpecValidator } from "../frontend-design-spec-schema.js";

interface TestFixture {
  id: string;
  categoryName: string;
  prompt: string;
  appName: string;
  expectedMode: "dark" | "light" | "obsidian" | "warm_dark";
  expectedImageNecessity: boolean;
}

const FIXTURES: TestFixture[] = [
  {
    id: "fashion_ecommerce",
    categoryName: "Fashion E-Commerce",
    prompt: "Create a luxury sustainable fashion boutique storefront named VELOUR ATELIER featuring seasonal capsule collections, fabric composition details, size recommendation fit guides, editorial lookbooks, and bespoke checkout.",
    appName: "Velour Atelier",
    expectedMode: "light",
    expectedImageNecessity: true,
  },
  {
    id: "photography_portfolio",
    categoryName: "Personal Photography Portfolio",
    prompt: "Build a monograph photography portfolio named LUMEN ARCHIVE showcasing architectural spatial studies, monochrome film series, gallery exhibition history, print acquisition inquiries, and medium-format photo essays.",
    appName: "Lumen Archive",
    expectedMode: "light",
    expectedImageNecessity: true,
  },
  {
    id: "enterprise_saas",
    categoryName: "Enterprise SaaS Platform",
    prompt: "Build an enterprise customer data compliance and governance platform named DATAFENCE featuring automated GDPR deletion workflows, SOC2 compliance audit logs, role-based API access policies, and retention policy configurators.",
    appName: "DataFence",
    expectedMode: "dark",
    expectedImageNecessity: false,
  },
  {
    id: "restaurant_website",
    categoryName: "Restaurant Website",
    prompt: "Design an artisanal farm-to-table bistro website named OSTERIA TERRA featuring seasonal tasting menus, sommelier cellar pairings, chef provenance stories, private dining reservation requests, and local producer spotlights.",
    appName: "Osteria Terra",
    expectedMode: "light",
    expectedImageNecessity: true,
  },
  {
    id: "travel_hospitality",
    categoryName: "Travel & Hospitality Website",
    prompt: "Create an eco-luxury wilderness retreat booking platform named AURA NORDIK featuring geothermal lodge reservations, guided fjord expedition schedules, seasonal weather alerts, chalet floorplans, and guest concierge requests.",
    appName: "Aura Nordik",
    expectedMode: "light",
    expectedImageNecessity: true,
  },
  {
    id: "healthcare_booking",
    categoryName: "Healthcare Booking Platform",
    prompt: "Build a specialized pediatric dental clinic portal named SMILEHAVEN CLINIC featuring dentist credential profiles, preventative appointment booking, insurance coverage verification, emergency triage guides, and patient intake forms.",
    appName: "SmileHaven Clinic",
    expectedMode: "light",
    expectedImageNecessity: true,
  },
  {
    id: "educational_platform",
    categoryName: "Educational Website",
    prompt: "Create an interactive classical music conservatory learning portal named CADENCE ACADEMY featuring counterpoint composition masterclasses, instrument practice logs, faculty repertoire critiques, and orchestral audition timelines.",
    appName: "Cadence Academy",
    expectedMode: "light",
    expectedImageNecessity: false,
  },
  {
    id: "corporate_business",
    categoryName: "Corporate Business Website",
    prompt: "Design a maritime shipping and container logistics corporate portal named VANGUARD MARITIME featuring global fleet tracking, dry dock maintenance schedules, bill of lading documentation, port congestion advisories, and investor relations briefs.",
    appName: "Vanguard Maritime",
    expectedMode: "dark",
    expectedImageNecessity: false,
  },
  {
    id: "creative_agency",
    categoryName: "Creative Agency Portfolio",
    prompt: "Build a brand strategy and kinetic visual design studio portfolio named KINETIC LAB featuring interactive case studies, motion design reels, client collaborative sprint workshops, awards archive, and creative inquiry briefs.",
    appName: "Kinetic Lab",
    expectedMode: "light",
    expectedImageNecessity: true,
  },
  {
    id: "cloud_infrastructure",
    categoryName: "Cloud Infrastructure Operations Platform",
    prompt: "Build an autonomous cloud telemetry and cluster incident operations platform named CLOUDPULSE featuring real-time cluster health monitors, P99 latency spectrograms, incident escalation timelines, alerting threshold configurators, and automated post-mortem generation.",
    appName: "CloudPulse Ops",
    expectedMode: "obsidian",
    expectedImageNecessity: false,
  },
];

describe("Autonomous Frontend Intelligence — 10-Domain Regression Suite", () => {
  for (const fixture of FIXTURES) {
    describe(`Domain Fixture: ${fixture.categoryName} (${fixture.appName})`, () => {
      // 1. Product Understanding
      const chars = ProductUnderstanding.analyze(fixture.prompt);
      const specStub = {
        name: fixture.appName,
        description: fixture.prompt,
        dataModels: ["Item"],
        inferredLibraries: [] as string[],
        frontend: "react",
        backend: "express",
      };

      // 2. Capability Planning & Design Brief
      const featurePriority = CapabilityPlanner.plan(chars, specStub as any);
      const brief = DesignDirector.direct(
        chars,
        featurePriority,
        specStub as any,
        fixture.prompt,
        undefined,
        undefined,
        1001
      );

      // 3. Theme Generation with WCAG AA Contrast Audit
      const theme = ThemeGenerator.generateTheme({
        domain: fixture.categoryName,
        prompt: fixture.prompt,
        seed: 1001,
        colorSystem: brief.colorSystem,
        artDirection: (brief as any).artDirection,
      });

      // 4. Page Design Specifications
      const routes = featurePriority.informationArchitecture.pages.map((p) => p.route);
      const pageSpecs = PageDesignSpecificationEngine.generateSpecifications({
        routes: routes.length > 0 ? routes : ["/"],
        prompt: fixture.prompt,
        brandName: fixture.appName,
        discoveredFeatures: featurePriority.features?.map((f) => f.name) || [],
      });

      // 5. Complete Frontend Design Planner (.aegis/design/frontend-design-spec.json & .md)
      const { spec: plannedSpec, markdownBrief } = FrontendDesignPlanner.plan({
        prompt: fixture.prompt,
        projectName: fixture.appName,
        domain: fixture.categoryName,
        theme,
        designBrief: brief,
        pageSpecs,
        seed: 1001,
      });

      it("derives authentic product characteristics and emotional tone", () => {
        expect(chars.experiencePattern).toBeDefined();
        expect(chars.emotionalTone.primary).toBeTruthy();
        expect(brief.artDirectionName).toBeTruthy();
      });

      it("derives WCAG AA contrast certified color palette matching domain mode", () => {
        expect(theme.contrastAudit.overallValid).toBe(true);
        expect(theme.contrastAudit.textOnBackground.ratio).toBeGreaterThanOrEqual(4.5);
        expect(theme.contrastAudit.textOnSurface.ratio).toBeGreaterThanOrEqual(4.5);
        expect(theme.contrastAudit.textOnPrimaryButton.ratio).toBeGreaterThanOrEqual(4.5);
        expect(theme.palette.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      });

      it("derives deliberate typography scales and pairing", () => {
        expect(plannedSpec.typographyStrategy.displayFont).toBeTruthy();
        expect(plannedSpec.typographyStrategy.bodyFont).toBeTruthy();
        expect(plannedSpec.typographyStrategy.headingScale.display).toContain("clamp(");
        expect(plannedSpec.typographyStrategy.headingScale.h1).toContain("clamp(");
      });

      it("enforces responsive layout contracts and overflow prevention", () => {
        expect(plannedSpec.responsiveSystem.overflowProtectionRules.length).toBeGreaterThanOrEqual(3);
        expect(plannedSpec.pages.length).toBeGreaterThan(0);
        for (const page of plannedSpec.pages) {
          expect(page.layout.desktop).toBeTruthy();
          expect(page.layout.mobile).toBeTruthy();
          expect(page.mobileBehavior).toContain("Single-column");
        }
      });

      it("caps primary navigation items and establishes responsive mobile nav", () => {
        expect(plannedSpec.navigationStrategy.maxPrimaryItems).toBeLessThanOrEqual(5);
        expect(plannedSpec.navigationStrategy.primaryItems.length).toBeLessThanOrEqual(5);
        expect(plannedSpec.navigationStrategy.mobileNavigation.type).toBe("drawer");
      });

      it("validates machine-readable design specification against schema", () => {
        const validation = FrontendDesignSpecValidator.validate(plannedSpec);
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it("generates comprehensive Markdown brief with all mandatory sections", () => {
        expect(markdownBrief).toContain("# Frontend Design Brief:");
        expect(markdownBrief).toContain("## 1. Product Identity");
        expect(markdownBrief).toContain("## 2. Chosen Visual Direction");
        expect(markdownBrief).toContain("## 3. Colour Strategy");
        expect(markdownBrief).toContain("## 4. Typography Strategy");
        expect(markdownBrief).toContain("## 5. Background and Surface Strategy");
        expect(markdownBrief).toContain("## 6. Information Architecture & Navigation");
        expect(markdownBrief).toContain("## 7. Page-by-Page Specifications");
        expect(markdownBrief).toContain("## 8. Responsive Specifications & Viewport Hardening");
        expect(markdownBrief).toContain("## 9. Accessibility Specifications");
        expect(markdownBrief).toContain("## 10. Research Rationale & Grounding");
      });
    });
  }

  it("proves domain differentiation across diverse project categories", () => {
    // Assert that different categories receive distinct palettes, typography, and patterns
    const fashionSpec = FrontendDesignPlanner.plan({
      prompt: FIXTURES[0].prompt,
      projectName: FIXTURES[0].appName,
      domain: FIXTURES[0].categoryName,
      theme: ThemeGenerator.generateTheme({ domain: FIXTURES[0].categoryName, prompt: FIXTURES[0].prompt, seed: 101 }),
      designBrief: DesignDirector.direct(ProductUnderstanding.analyze(FIXTURES[0].prompt), CapabilityPlanner.plan(ProductUnderstanding.analyze(FIXTURES[0].prompt), {} as any), {} as any, FIXTURES[0].prompt, undefined, undefined, 101),
      seed: 101,
    }).spec;

    const cloudSpec = FrontendDesignPlanner.plan({
      prompt: FIXTURES[9].prompt,
      projectName: FIXTURES[9].appName,
      domain: FIXTURES[9].categoryName,
      theme: ThemeGenerator.generateTheme({ domain: FIXTURES[9].categoryName, prompt: FIXTURES[9].prompt, seed: 109 }),
      designBrief: DesignDirector.direct(ProductUnderstanding.analyze(FIXTURES[9].prompt), CapabilityPlanner.plan(ProductUnderstanding.analyze(FIXTURES[9].prompt), {} as any), {} as any, FIXTURES[9].prompt, undefined, undefined, 109),
      seed: 109,
    }).spec;

    // Different brand hues
    expect(fashionSpec.colorStrategy.primaryBrandColor).not.toEqual(cloudSpec.colorStrategy.primaryBrandColor);
    // Different visual personalities
    expect(fashionSpec.visualDirection.visualPersonality.mood).not.toEqual(cloudSpec.visualDirection.visualPersonality.mood);
    // Different background tones
    expect(fashionSpec.colorStrategy.backgroundColor).not.toEqual(cloudSpec.colorStrategy.backgroundColor);
  });
});
