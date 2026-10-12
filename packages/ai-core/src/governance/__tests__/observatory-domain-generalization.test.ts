import { describe, it, expect } from "vitest";
import { PromptConstraints } from "../prompt-constraints.js";
import { SpecificationNormalizer } from "../../spec/canonical-spec.js";
import { ArchitectureResolver } from "../architecture-resolver.js";
import { ProductUnderstanding } from "../../design/product-understanding.js";
import { PageExperiencePlanner } from "../../design/page-experience-plan.js";
import { WebsiteExperienceIdentityResolver } from "../../design/website-experience-identity.js";
import { ExperienceCapabilityResolver } from "../../design/experience-capability-plan.js";
import { extractSemanticPersonality, deriveArtDirection } from "../../design/visual-art-direction.js";
import { TemplateContaminationChecker } from "../../validation/template-contamination-checker.js";

describe("Observatory Domain Generalization & Negative Constraint Boundary Suite", () => {
  const ORBITALIS_PROMPT =
    "Create an interactive scientific observatory website called ORBITALIS RESEARCH CENTER. Show live sky observations, telescope instruments, observation schedules, research discoveries, celestial object archives, educational resources, research publications, facility information and public observation events. Use a scientific editorial visual language with observatory instrumentation, star maps, data visualization, technical diagrams and immersive astronomy storytelling. Do not use SaaS dashboards, generic card grids, hotel/booking terminology, culinary/editorial magazine patterns, or hero-cards-CTA layouts. Each route must have a distinct composition appropriate to its function.";

  // TEST 1: Negative constraint stripping eliminates forbidden domain trigger words
  it("TEST 1: PromptConstraints removes negative constraint clauses and forbidden keywords", () => {
    const stripped = PromptConstraints.stripNegativeConstraints(ORBITALIS_PROMPT);
    expect(stripped.toLowerCase()).not.toContain("hotel/booking");
    expect(stripped.toLowerCase()).not.toContain("culinary/editorial");
    expect(stripped.toLowerCase()).not.toContain("saas dashboards");
    expect(PromptConstraints.isForbiddenByPrompt(ORBITALIS_PROMPT, "hotel")).toBe(true);
    expect(PromptConstraints.isForbiddenByPrompt(ORBITALIS_PROMPT, "culinary")).toBe(true);
    expect(PromptConstraints.isForbiddenByPrompt(ORBITALIS_PROMPT, "saas")).toBe(true);
    expect(PromptConstraints.isForbiddenByPrompt(ORBITALIS_PROMPT, "observatory")).toBe(false);
  });

  // TEST 2: SpecificationNormalizer classifies as scientific-observatory, not luxury-hospitality
  it("TEST 2: SpecificationNormalizer detects scientific-observatory domain category and vocabulary", () => {
    const rawSpec: any = {
      name: "orbitalis-research-center",
      frontend: "React-Vite",
      backend: "Express",
      database: "PostgreSQL",
    };

    const canonical = SpecificationNormalizer.normalize(ORBITALIS_PROMPT, rawSpec);
    expect(canonical.domainCategory).toBe("scientific-observatory");
    expect(canonical.domainCategory).not.toBe("luxury-hospitality");
    expect(canonical.domainVocabulary.entityName).toBe("Observation");
    expect(canonical.domainVocabulary.primaryMetrics).toContain("Active Telescopes");
    expect(canonical.dataModels).toContain("Observation");
    expect(canonical.dataModels).toContain("Telescope");
    expect(canonical.dataModels).toContain("CelestialObject");
    expect(canonical.dataModels).toContain("ResearchDiscovery");
    expect(canonical.dataModels).toContain("Publication");
    expect(canonical.dataModels).not.toContain("Suite");
    expect(canonical.dataModels).not.toContain("Reservation");
    expect(canonical.dataModels).not.toContain("CulinaryStory");
  });

  // TEST 3: ArchitectureResolver does not inject hotel or culinary models/routes
  it("TEST 3: ArchitectureResolver extracts observatory models and routes with zero hotel/culinary leakage", () => {
    const contract = ArchitectureResolver.resolve(ORBITALIS_PROMPT);
    expect(contract.applicationType).toBe("FULLSTACK_WEB_APPLICATION");
    expect(contract.applicationType).not.toBe("SAAS_APPLICATION");

    // Must contain observatory models
    expect(contract.requiredModels).toContain("Observation");
    expect(contract.requiredModels).toContain("Telescope");
    expect(contract.requiredModels).toContain("CelestialObject");
    expect(contract.requiredModels).toContain("ResearchDiscovery");
    expect(contract.requiredModels).toContain("Publication");
    expect(contract.requiredModels).toContain("ObservationEvent");
    expect(contract.requiredModels).toContain("Instrument");

    // Must NOT contain hotel or culinary models
    expect(contract.requiredModels).not.toContain("Suite");
    expect(contract.requiredModels).not.toContain("Reservation");
    expect(contract.requiredModels).not.toContain("GuestPreference");
    expect(contract.requiredModels).not.toContain("StayPlan");
    expect(contract.requiredModels).not.toContain("Amenity");
    expect(contract.requiredModels).not.toContain("DiningVenue");
    expect(contract.requiredModels).not.toContain("CulinaryStory");
    expect(contract.requiredModels).not.toContain("CulinaryDestination");
    expect(contract.requiredModels).not.toContain("Recipe");

    // Must contain observatory routes
    expect(contract.requiredRoutes).toContain("/");
    expect(contract.requiredRoutes).toContain("/sky-observations");
    expect(contract.requiredRoutes).toContain("/telescope-instruments");
    expect(contract.requiredRoutes).toContain("/observation-schedules");
    expect(contract.requiredRoutes).toContain("/research-discoveries");
    expect(contract.requiredRoutes).toContain("/celestial-archives");
    expect(contract.requiredRoutes).toContain("/research-publications");
    expect(contract.requiredRoutes).toContain("/facility-info");
    expect(contract.requiredRoutes).toContain("/observation-events");

    // Must NOT contain hotel or culinary routes
    expect(contract.requiredRoutes).not.toContain("/suites");
    expect(contract.requiredRoutes).not.toContain("/booking");
    expect(contract.requiredRoutes).not.toContain("/stay-planner");
    expect(contract.requiredRoutes).not.toContain("/amenities-and-spa");
    expect(contract.requiredRoutes).not.toContain("/dining");
    expect(contract.requiredRoutes).not.toContain("/editorial-stories");
    expect(contract.requiredRoutes).not.toContain("/explore-culinary-destinations");
  });

  // TEST 4: ProductUnderstanding derives craft-editorial pattern and avoids hospitality-portal
  it("TEST 4: ProductUnderstanding derives craft-editorial experiencePattern without hospitality bleed", () => {
    const characteristics = ProductUnderstanding.analyze(ORBITALIS_PROMPT);
    expect(characteristics.experiencePattern).toBe("craft-editorial");
    expect(characteristics.experiencePattern).not.toBe("hospitality-portal");
  });

  // TEST 5: Visual Art Direction derives technical/editorial obsidian precision
  it("TEST 5: Visual Art Direction selects technical obsidian or editorial archetype for observatory", () => {
    const personality = extractSemanticPersonality(ORBITALIS_PROMPT);
    expect(personality.tone).toBe("technical");

    const artDirection = deriveArtDirection(ORBITALIS_PROMPT, "scientific-observatory", 4317);
    expect(["OBSIDIAN_PRECISION", "EDITORIAL_NARRATIVE", "MODERN_SWISS"]).toContain(artDirection.archetype);
    expect(artDirection.archetype).not.toBe("NEON_SYNTHETIC");
  });

  // TEST 6: PageExperiencePlanner generates observatory roles and zero hotel roles
  it("TEST 6: PageExperiencePlanner assigns dedicated astronomical roles to all routes", () => {
    const contract = ArchitectureResolver.resolve(ORBITALIS_PROMPT);
    const characteristics = ProductUnderstanding.analyze(ORBITALIS_PROMPT);
    const mockIdentity: any = {
      genre: "EDITORIAL_PUBLICATION",
      brandIdentity: { name: "ORBITALIS RESEARCH CENTER" },
    };
    const mockCapabilityPlan: any = {
      experienceType: "EDITORIAL",
      real3dRequired: false,
    };

    const pagePlans = PageExperiencePlanner.planPages(
      ORBITALIS_PROMPT,
      characteristics,
      mockIdentity,
      mockCapabilityPlan,
      contract.requiredRoutes
    );

    const homePlan = pagePlans.find(p => p.route === "/");
    expect(homePlan).toBeDefined();
    expect(homePlan!.pageRole).toContain("Observatory");
    expect(homePlan!.pageRole).not.toContain("Hotel");

    const skyPlan = pagePlans.find(p => p.route === "/sky-observations");
    expect(skyPlan).toBeDefined();
    expect(skyPlan!.pageRole).toContain("Sky Telemetry");

    const instrumentsPlan = pagePlans.find(p => p.route === "/telescope-instruments");
    expect(instrumentsPlan).toBeDefined();
    expect(instrumentsPlan!.pageRole).toContain("Telescope Instrumentation");

    const schedulePlan = pagePlans.find(p => p.route === "/observation-schedules");
    expect(schedulePlan).toBeDefined();
    expect(schedulePlan!.pageRole).toContain("Observation Schedules");

    const discoveriesPlan = pagePlans.find(p => p.route === "/research-discoveries");
    expect(discoveriesPlan).toBeDefined();
    expect(discoveriesPlan!.pageRole).toContain("Astronomical Discoveries");

    const archivesPlan = pagePlans.find(p => p.route === "/celestial-archives");
    expect(archivesPlan).toBeDefined();
    expect(archivesPlan!.pageRole).toContain("Celestial Object Archive");

    const publicationsPlan = pagePlans.find(p => p.route === "/research-publications");
    expect(publicationsPlan).toBeDefined();
    expect(publicationsPlan!.pageRole).toContain("Research Publications");

    // Ensure zero routes contain hotel or culinary roles
    for (const p of pagePlans) {
      expect(p.pageRole.toLowerCase()).not.toContain("hotel");
      expect(p.pageRole.toLowerCase()).not.toContain("culinary");
      expect(p.pageRole.toLowerCase()).not.toContain("suite");
    }
  });
});
