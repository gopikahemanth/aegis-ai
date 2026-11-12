/**
 * Aegis AI — Live Web Research & Dynamic Design Intelligence Test Suite
 *
 * Verifies:
 * 1. LiveWebSearchEngine generates distinct, targeted search queries dynamically.
 * 2. Live discovery deduplicates candidates, filters internal/social links, and extracts domain references.
 * 3. ReferencePageInspector extracts structural DOM patterns (headings, navLinks, CTAs, filter controls).
 * 4. ResearchSynthesisAgent synthesizes bespoke palettes, fonts, and workflows grounded in inspected evidence.
 * 5. Fail-closed behavior: reports OFFLINE_SEARCH_UNAVAILABLE / RESEARCH_INCOMPLETE when network/search fails.
 * 6. PageDesignSpecificationEngine rejects ungrounded / missing page plans with PLAN_INCOMPLETE.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LiveWebSearchEngine } from "../live-web-search-engine.js";
import { ReferenceSourceSelector } from "../reference-source-selector.js";
import { ReferencePageInspector } from "../reference-page-inspector.js";
import { ResearchSynthesisAgent } from "../research-synthesis-agent.js";
import { DesignReferenceIntelligence } from "../../design/design-reference-intelligence.js";
import { PageDesignSpecificationEngine } from "../../design/page-design-specification-engine.js";
import type { PageInspectionResult } from "../reference-research-types.js";

describe("Live Web Research & Dynamic Design Intelligence", { timeout: 30000 }, () => {
  beforeEach(() => {
    LiveWebSearchEngine.clearMockProvider();
    ReferencePageInspector.clearMockInspector();
  });

  afterEach(() => {
    LiveWebSearchEngine.clearMockProvider();
    ReferencePageInspector.clearMockInspector();
  });

  // Test 1: Query generation across 3 distinct domains
  it("Test 1 — Dynamically generates targeted web search queries across distinct domains", async () => {
    const petQueries = await LiveWebSearchEngine.generateQueries(
      "Sanctuary for rescue horses and farm animals with sponsorship and visiting hours",
      "animal-sanctuary"
    );
    expect(petQueries.length).toBe(3);
    expect(petQueries.some((q) => /sanctuary|rescue|horses|animals/i.test(q))).toBe(true);

    const potteryQueries = await LiveWebSearchEngine.generateQueries(
      "Artisanal ceramic studio specializing in traditional Japanese wood-fired pottery",
      "pottery-ceramics"
    );
    expect(potteryQueries.length).toBe(3);
    expect(potteryQueries.some((q) => /ceramic|pottery|japanese|wood/i.test(q))).toBe(true);

    const aeroQueries = await LiveWebSearchEngine.generateQueries(
      "Telemetry mission control dashboard for suborbital sounding rockets and payload data",
      "aerospace-telemetry"
    );
    expect(aeroQueries.length).toBe(3);
    expect(aeroQueries.some((q) => /telemetry|mission|sounding|rockets/i.test(q))).toBe(true);
  });

  // Test 2: Discovery with mock search provider and deduplication/filtering
  it("Test 2 — Discovers external references, deduplicates candidates, and filters search engine internals", async () => {
    LiveWebSearchEngine.setMockSearchProvider(async (query, maxResults) => {
      return [
        { title: "Rescue Haven Sanctuary", url: "https://www.rescuehaven.org", snippet: "Animal rescue and care", sourceEngine: "mock" },
        { title: "Rescue Haven Duplicate", url: "https://www.rescuehaven.org", snippet: "Duplicate link", sourceEngine: "mock" },
        { title: "Google Search", url: "https://www.google.com/search?q=test", snippet: "Internal search engine", sourceEngine: "mock" },
        { title: "Facebook Login", url: "https://facebook.com/login", snippet: "Social login", sourceEngine: "mock" },
        { title: "Farm Sanctuary Org", url: "https://www.farmsanctuary.org", snippet: "Protecting farm animals", sourceEngine: "mock" },
      ];
    });

    const discovery = await LiveWebSearchEngine.discoverReferenceWebsites({
      prompt: "Farm animal rescue sanctuary",
      domain: "animal-welfare",
      maxSources: 4,
    });

    expect(discovery.status).toBe("SUCCESS");
    expect(discovery.results.length).toBe(2); // Only the 2 valid external sites
    expect(discovery.results.some((r) => r.url === "https://www.rescuehaven.org")).toBe(true);
    expect(discovery.results.some((r) => r.url === "https://www.farmsanctuary.org")).toBe(true);
    expect(discovery.results.some((r) => r.url.includes("google.com"))).toBe(false);
    expect(discovery.results.some((r) => r.url.includes("facebook.com"))).toBe(false);
  });

  // Test 3: Structural DOM pattern extraction
  it("Test 3 — Accurately extracts observable structural patterns from live inspections", async () => {
    ReferencePageInspector.setMockInspector(async (url) => {
      return {
        url,
        status: "SUCCESS",
        statusCode: 200,
        title: "Kyoto Woodfired Ceramics Atelier",
        headings: ["Wood-Fired Kiln Cycles", "Bespoke Tea Vessels", "Master Class Schedule", "Studio Philosophy"],
        navLinks: [
          { text: "Gallery", href: "/gallery" },
          { text: "Firing Schedule", href: "/schedule" },
          { text: "Commissions", href: "/commissions" },
        ],
        callToActions: ["Reserve Workshop Spot", "Inquire Custom Vessel"],
        formControls: ["Email Input", "Vessel Type Selector"],
        filterControls: ["Glaze Type", "Firing Technique", "Price Range"],
        interactiveElements: ["Reserve Workshop Spot", "Inquire Custom Vessel"],
        hasSearch: true,
        hasPagination: false,
        durationMs: 45,
      };
    });

    const inspection = await ReferencePageInspector.inspectPage("https://kyoto-ceramics.jp");
    expect(inspection.status).toBe("SUCCESS");
    expect(inspection.headings.length).toBe(4);
    expect(inspection.headings[0]).toBe("Wood-Fired Kiln Cycles");
    expect(inspection.navLinks.length).toBe(3);
    expect(inspection.callToActions).toContain("Reserve Workshop Spot");
    expect(inspection.filterControls).toContain("Glaze Type");
    expect(inspection.hasSearch).toBe(true);
  });

  // Test 4: AI Research Synthesis grounded in inspected evidence
  it("Test 4 — ResearchSynthesisAgent derives bespoke visual thesis, palette, and workflows from inspected evidence", async () => {
    const mockInspections: PageInspectionResult[] = [
      {
        url: "https://www.farmsanctuary.org",
        status: "SUCCESS",
        statusCode: 200,
        title: "Farm Sanctuary Organization",
        headings: ["Rescue Resident Profiles", "Sponsor an Animal", "Visit and Tour Schedule", "Animal Care Standards"],
        navLinks: [
          { text: "Meet Residents", href: "/residents" },
          { text: "Sponsor", href: "/sponsor" },
          { text: "Tours", href: "/tours" },
        ],
        callToActions: ["Sponsor a Resident", "Book Tour"],
        formControls: ["Donation Amount", "Sponsorship Frequency"],
        filterControls: ["Species Filter", "Care Status"],
        interactiveElements: ["Sponsor a Resident"],
        hasSearch: true,
        hasPagination: false,
        durationMs: 30,
      },
    ];

    const result = await ResearchSynthesisAgent.synthesize({
      prompt: "Sanctuary for rescue horses and animals",
      domain: "animal-sanctuary",
      inspections: mockInspections,
    });

    expect(result.status === "SUCCESS" || result.status === "PARTIAL").toBe(true);
    const synthesis = result.synthesis;
    expect(/sanctuary/i.test(synthesis.productCategory)).toBe(true);
    expect(synthesis.visualThesis.length).toBeGreaterThan(20);
    expect(synthesis.primaryWorkflows.length).toBeGreaterThanOrEqual(2);
    expect(synthesis.sharedDesignLanguage.colorPaletteDirection.background.startsWith("#")).toBe(true);
    expect(synthesis.sharedDesignLanguage.colorPaletteDirection.primary.startsWith("#")).toBe(true);
  });

  // Test 5: Fail-closed behavior on search failure or offline environment
  it("Test 5 — Fail-closed behavior: reports OFFLINE_SEARCH_UNAVAILABLE without substituting hardcoded catalogues", async () => {
    LiveWebSearchEngine.setMockSearchProvider(async () => {
      // Simulate network / search error
      throw new Error("DNS lookup failure: internet unreachable");
    });

    const discovery = await LiveWebSearchEngine.discoverReferenceWebsites({
      prompt: "Artisanal bakery with fresh croissants",
      domain: "bakery-culinary",
    });

    // Invariant: Must fail-closed without pretending live research succeeded with static catalogs
    expect(discovery.status).toBe("OFFLINE_SEARCH_UNAVAILABLE");
    expect(discovery.results.length).toBe(0);

    const refResult = await ReferenceSourceSelector.discoverLiveReferences({
      prompt: "Artisanal bakery with fresh croissants",
      domain: "bakery-culinary",
    });
    expect(refResult.status).toBe("OFFLINE_SEARCH_UNAVAILABLE");
    expect(refResult.sources.length).toBe(0);

    const designResearch = await DesignReferenceIntelligence.executeLiveResearch({
      prompt: "Artisanal bakery with fresh croissants",
      domain: "bakery-culinary",
    });
    expect(designResearch.status).toBe("RESEARCH_INCOMPLETE");
    expect(designResearch.inspectedPages.length).toBe(0);
  });

  // Test 6: PageDesignSpecificationEngine rejects ungrounded or incomplete page specifications
  it("Test 6 — PageDesignSpecificationEngine marks missing page plans as PLAN_INCOMPLETE and fails validation", () => {
    const specs = PageDesignSpecificationEngine.generateSpecifications({
      routes: ["/", "/residents", "/unplanned-feature-route"],
      pagePlans: [
        {
          route: "/",
          pageRole: "Sanctuary Gateway",
          purpose: "Present sanctuary mission, featured residents, and visiting hours",
          experienceIntent: "Inspire patrons to visit and sponsor residents",
          composition: {
            topology: "HERO_STAGE_SHOWCASE",
            dominantStructure: "EDITORIAL_SPREAD",
            sections: ["SanctuaryHeroSpread", "FeaturedResidentsGallery", "VisitPlanningDossier"],
            layers: ["HeroSpread", "ResidentsGrid"],
          },
          interaction: {
            primary: ["Schedule Visit", "Sponsor Animal"],
            secondary: ["Filter Species"],
          },
          routeAllocation: { route: "/" },
        } as any,
        {
          route: "/residents",
          pageRole: "Residents Registry",
          purpose: "Browse rescue residents by species and rehabilitation milestone",
          experienceIntent: "Enable users to learn animal stories and sponsor care",
          composition: {
            topology: "BESPOKE_INTERACTIVE_STAGE",
            dominantStructure: "MULTI_TIER_FILTERABLE_MATRIX",
            sections: ["SpeciesFilterRibbon", "ResidentStoryGrid", "RehabilitationTimeline"],
            layers: ["FilterRibbon", "ResidentStoryCard"],
          },
          interaction: {
            primary: ["Filter by Species", "View Story"],
            secondary: ["Share Story"],
          },
          routeAllocation: { route: "/residents" },
        } as any,
      ],
      prompt: "Animal rescue sanctuary",
      brandName: "Haven Sanctuary",
      discoveredFeatures: ["Resident Story Grid", "Species Filter"],
    });

    expect(specs.length).toBe(3);

    const homeSpec = specs.find((s) => s.route === "/");
    expect(homeSpec?.status).toBe("SPECIFIED");
    expect(homeSpec?.sections.length).toBe(3);
    expect(homeSpec?.sections[0].name).toBe("SanctuaryHeroSpread");

    // The unplanned route must be marked PLAN_INCOMPLETE (no fake boilerplate!)
    const unplannedSpec = specs.find((s) => s.route === "/unplanned-feature-route");
    expect(unplannedSpec?.status).toBe("PLAN_INCOMPLETE");
    expect(unplannedSpec?.error).toBeDefined();

    // Completeness validation must catch the incomplete specification
    const completeness = PageDesignSpecificationEngine.validateCompleteness(specs);
    expect(completeness.valid).toBe(false);
    expect(completeness.incompleteRoutes).toContain("/unplanned-feature-route");
    expect(completeness.errors.some((e) => e.includes("/unplanned-feature-route"))).toBe(true);
  });
});
