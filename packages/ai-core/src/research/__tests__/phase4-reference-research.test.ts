import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ReferenceSourceSelector } from "../reference-source-selector.js";
import { ReferencePageInspector } from "../reference-page-inspector.js";
import { LiveWebSearchEngine } from "../live-web-search-engine.js";
import { FeatureMatrixHarmonizer } from "../feature-matrix-harmonizer.js";
import { ReferenceResearchEngine } from "../reference-research-engine.js";
import { FeatureMatrixManager } from "../../contracts/feature-matrix.js";

describe("Phase 4: Real Website Research and Feature Discovery", { timeout: 30000 }, () => {
  let workDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), "aegis-phase4-test-"));
    ReferenceResearchEngine.clearCache();

    LiveWebSearchEngine.setMockSearchProvider(async (query, maxResults) => {
      const q = query.toLowerCase();
      if (q.includes("restaurant") || q.includes("pasta") || q.includes("pizza") || q.includes("dining") || q.includes("salad")) {
        return [
          { title: "Sweetgreen Fresh Dining", url: "https://www.sweetgreen.com", snippet: "Order salads and bowls", sourceEngine: "mock" },
          { title: "OpenTable Reservations", url: "https://www.opentable.com", snippet: "Book restaurant tables", sourceEngine: "mock" },
          { title: "Toast POS", url: "https://pos.toasttab.com", snippet: "Restaurant order point of sale", sourceEngine: "mock" },
        ];
      }
      if (q.includes("education") || q.includes("learning") || q.includes("code") || q.includes("academy") || q.includes("student")) {
        return [
          { title: "Coursera Academy", url: "https://www.coursera.org", snippet: "Online courses and degrees", sourceEngine: "mock" },
          { title: "Khan Academy", url: "https://www.khanacademy.org", snippet: "Free interactive lessons", sourceEngine: "mock" },
        ];
      }
      if (q.includes("estate") || q.includes("realty") || q.includes("property")) {
        return [
          { title: "Redfin Real Estate", url: "https://www.redfin.com", snippet: "Search homes for sale", sourceEngine: "mock" },
          { title: "Zillow Homes", url: "https://www.zillow.com", snippet: "Real estate and rental listings", sourceEngine: "mock" },
        ];
      }
      return [
        { title: "Universal Knowledge", url: "https://en.wikipedia.org/wiki/Application", snippet: "Overview and structural details", sourceEngine: "mock" },
        { title: "Standard Platform Showcase", url: "https://github.com/showcase", snippet: "Developer portal and tools", sourceEngine: "mock" },
      ];
    });

    ReferencePageInspector.setMockInspector(async (url, options) => {
      if (url.includes("nonexistent") || url.includes("bad-url")) {
        return {
          url,
          status: "FAILED",
          headings: [],
          navLinks: [],
          callToActions: [],
          formControls: [],
          filterControls: [],
          interactiveElements: [],
          hasSearch: false,
          hasPagination: false,
          durationMs: 10,
          error: "Simulated network failure 404",
        };
      }
      return {
        url,
        status: "SUCCESS",
        statusCode: 200,
        title: "Mock Reference Platform",
        headings: ["Curated Offerings", "Dietary Accommodations", "Reserve a Table", "Client Portal"],
        navLinks: [{ text: "Menu", href: "/menu" }, { text: "Reservations", href: "/reservations" }, { text: "Details", href: "/details" }],
        callToActions: ["Book Now", "Explore Offerings", "Order Online"],
        formControls: ["Search Input", "Date Picker"],
        filterControls: ["Dietary Filters", "Availability Filter"],
        interactiveElements: ["Book Now", "Explore Offerings", "Dietary Filters"],
        hasSearch: true,
        hasPagination: false,
        durationMs: 50,
      };
    });
  });

  afterEach(() => {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {}
    LiveWebSearchEngine.clearMockProvider();
    ReferencePageInspector.clearMockInspector();
  });

  // 1. Correct reference selection for different application domains
  it("Requirement 1 — Correct reference discovery across different application domains via live search engine", async () => {
    // Restaurant domain
    const diningDiscovery = await ReferenceSourceSelector.discoverLiveReferences({
      prompt: "Artisanal pasta restaurant with online ordering and reservation booking",
      domain: "restaurant-dining",
    });
    expect(diningDiscovery.status).toBe("SUCCESS");
    expect(diningDiscovery.sources.length).toBeGreaterThanOrEqual(3);
    expect(diningDiscovery.sources.length).toBeLessThanOrEqual(5);
    expect(diningDiscovery.sources.some((s) => s.url.includes("sweetgreen") || s.url.includes("opentable"))).toBe(true);

    // Education domain
    const eduDiscovery = await ReferenceSourceSelector.discoverLiveReferences({
      prompt: "Online interactive software academy with coding challenges and courses",
      domain: "education-learning",
    });
    expect(eduDiscovery.status).toBe("SUCCESS");
    expect(eduDiscovery.sources.length).toBeGreaterThanOrEqual(2);
    expect(eduDiscovery.sources.some((s) => s.url.includes("coursera") || s.url.includes("khanacademy"))).toBe(true);

    // Real estate domain
    const reDiscovery = await ReferenceSourceSelector.discoverLiveReferences({
      prompt: "Boutique residential real estate property search and agent tour booking",
      domain: "real-estate-discovery",
    });
    expect(reDiscovery.status).toBe("SUCCESS");
    expect(reDiscovery.sources.length).toBeGreaterThanOrEqual(2);
    expect(reDiscovery.sources.some((s) => s.url.includes("redfin") || s.url.includes("zillow"))).toBe(true);
  });

  // 2. Preservation of every explicit user requirement
  it("Requirement 2 — Preserves every explicit user requirement as inviolable must-have", () => {
    const explicitFeatures = [
      {
        title: "Gluten-Free Flour Selection Matrix",
        description: "Guests must be able to choose almond, cassava, or chickpea flour for any custom pizza.",
      },
      {
        title: "Curbside Parking Spot Number Input",
        description: "Allow pickup patrons to submit their parking stall number upon arrival.",
      },
    ];

    const matrix = FeatureMatrixHarmonizer.harmonize({
      projectName: "RusticPizzeria",
      domainName: "restaurant-dining",
      userPrompt: "Custom artisan pizza with flour selections and curbside pickup stall entry",
      explicitFeatures,
      discoveredFeatures: [
        {
          name: "Standard Allergen Tagging",
          description: "Allergen icons on dishes",
          userValue: "Safety",
          sourceUrl: "https://www.sweetgreen.com",
          sourceCategory: "Menu Discovery",
          relevanceScore: 0.9,
          recommendedPriority: "must-have",
          targetRoutes: ["/menu"],
          suggestedComponents: ["TagList"],
          inclusionRationale: "Standard",
          confidence: 0.9,
        },
      ],
      projectRoot: workDir,
    });

    // Both explicit requirements MUST exist, be "must-have", and retain source "user-request"
    const f1 = matrix.features.find((f) => f.title === "Gluten-Free Flour Selection Matrix");
    const f2 = matrix.features.find((f) => f.title === "Curbside Parking Spot Number Input");

    expect(f1).toBeDefined();
    expect(f1?.priority).toBe("must-have");
    expect(f1?.source).toBe("user-request");

    expect(f2).toBeDefined();
    expect(f2?.priority).toBe("must-have");
    expect(f2?.source).toBe("user-request");

    // Total must-haves includes at least the 2 explicit requests
    expect(matrix.mustHaveCount).toBeGreaterThanOrEqual(2);
  });

  // 3. Stable, deterministic feature identifiers and priorities
  it("Requirement 3 — Assigns deterministic feature IDs (F01..Fn) with valid priorities", () => {
    const explicitFeatures = [
      { title: "Course Catalog", description: "Browse all courses" },
      { title: "Student Dashboard", description: "View enrolled modules" },
    ];

    const matrix = FeatureMatrixHarmonizer.harmonize({
      projectName: "LearnFlow",
      domainName: "education-learning",
      userPrompt: "Online course academy with student dashboard",
      explicitFeatures,
    });

    expect(matrix.features[0].id).toBe("F01");
    expect(matrix.features[1].id).toBe("F02");

    for (const f of matrix.features) {
      expect(/^F\d{2,}$/.test(f.id)).toBe(true);
      expect(["must-have", "should-have", "optional"]).toContain(f.priority);
    }
  });

  // 4. Evidence and source attribution for research-derived findings
  it("Requirement 4 — Records evidence and source URL attribution for research findings", async () => {
    const res = await ReferenceResearchEngine.executeResearch({
      prompt: "Boutique Italian pasta restaurant with online ordering and reservations",
      domain: "restaurant-dining",
      projectName: "TrattoriaBella",
      projectRoot: workDir,
    });

    const research = res.research;
    expect(research.relevantFeatures.length).toBeGreaterThanOrEqual(2);

    for (const f of research.relevantFeatures) {
      expect(f.sourceUrl).toBeDefined();
      expect(f.sourceUrl.startsWith("http")).toBe(true);
      expect(f.userValue).toBeDefined();
      expect(f.userValue.length).toBeGreaterThan(10);
      expect(f.confidence).toBeGreaterThanOrEqual(0.7);
    }
  });

  // 5. Clear separation between observed facts and inferred ideas
  it("Requirement 5 — Clear separation between directly observed facts and inferred concepts", async () => {
    const res = await ReferenceResearchEngine.executeResearch({
      prompt: "Interactive coding academy portal with exercises",
      domain: "education-learning",
      projectName: "CodeQuest",
      projectRoot: workDir,
    });

    const patterns = res.research.observedPatterns;
    expect(patterns.length).toBeGreaterThan(0);

    const directObservations = patterns.filter((p) => p.isDirectObservation === true);
    const inferredObservations = patterns.filter((p) => p.isDirectObservation === false);

    // Direct observations exist (nav, buttons, search)
    expect(directObservations.length).toBeGreaterThan(0);
    // Inferred observations exist (workflows, user journeys)
    expect(inferredObservations.length).toBeGreaterThan(0);

    // Each direct observation must reference an observed URL
    for (const d of directObservations) {
      expect(d.observedAtUrl).toBeDefined();
      expect(d.confidence).toBeGreaterThan(0.8);
    }
  });

  // 6. Handling inaccessible websites without fabricated evidence
  it("Requirement 6 — Handles inaccessible websites honestly without fabricating results", async () => {
    const badUrl = "https://nonexistent-domain-404-xyz-aegis.invalid";
    const inspection = await ReferencePageInspector.inspectPage(badUrl, {
      timeoutMs: 1500,
      preferBrowser: false,
    });

    // Must be marked FAILED / TIMEOUT with real error, not fake SUCCESS
    expect(inspection.status === "FAILED" || inspection.status === "TIMEOUT").toBe(true);
    expect(inspection.headings.length).toBe(0);
    expect(inspection.navLinks.length).toBe(0);
    expect(inspection.error).toBeDefined();
  });

  // 7. Handling empty, malformed, or partially available pages
  it("Requirement 7 — Handles malformed URLs and errors gracefully", async () => {
    const malformed = "not-a-valid-url";
    const result = await ReferencePageInspector.inspectPage(malformed);
    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("Invalid URL");
  });

  // 8. Respect for browser timeouts and research budgets
  it("Requirement 8 — Respects time budgets and prevents runaway research", async () => {
    const startTime = Date.now();
    const res = await ReferenceResearchEngine.executeResearch({
      prompt: "Luxury real estate property search with verified agent messaging",
      domain: "real-estate-discovery",
      projectName: "EstateElite",
      projectRoot: workDir,
      engineOptions: {
        totalBudgetMs: 2500, // Strict small budget
        timeoutPerUrlMs: 1000,
      },
    });

    const elapsed = Date.now() - startTime;
    // Should complete within budget window plus small buffer
    expect(elapsed).toBeLessThan(10000);
    expect(res.research.totalDurationMs).toBeGreaterThan(0);
  });

  // 9. Deduplication of overlapping features
  it("Requirement 9 — Deduplicates overlapping features while enriching metadata", () => {
    const explicitFeatures = [
      {
        title: "Table Reservations",
        description: "Allow patrons to book dining tables.",
        routes: ["/reservations"],
        components: ["BaseBookingForm"],
      },
    ];

    const discoveredFeatures = [
      {
        name: "Table Reservations & Time-Slot Booking",
        description: "Real-time table booking with party size",
        userValue: "Guests can reserve seats",
        sourceUrl: "https://www.opentable.com",
        sourceCategory: "Reservations",
        relevanceScore: 0.95,
        recommendedPriority: "must-have" as const,
        targetRoutes: ["/reservations", "/table-map"],
        suggestedComponents: ["PartySizeSelector", "TimeSlotPicker"],
        inclusionRationale: "Core flow",
        confidence: 0.95,
      },
    ];

    const matrix = FeatureMatrixHarmonizer.harmonize({
      projectName: "BistroPrime",
      domainName: "restaurant-dining",
      userPrompt: "Restaurant with table reservations",
      explicitFeatures,
      discoveredFeatures,
    });

    // Should NOT create duplicate F01 and F02 for the same concept
    const reservationFeatures = matrix.features.filter((f) => /reservation/i.test(f.title));
    expect(reservationFeatures.length).toBe(1);

    // The single unified feature must have enriched components from both
    const unified = reservationFeatures[0];
    expect(unified.components).toContain("BaseBookingForm");
    expect(unified.components).toContain("PartySizeSelector");
    expect(unified.priority).toBe("must-have"); // User priority preserved
  });

  // 10. Relevance filtering that prevents unrelated features from being added
  it("Requirement 10 — Relevance filtering rejects low-relevance features and records out-of-scope bloat", async () => {
    const res = await ReferenceResearchEngine.executeResearch({
      prompt: "Cozy neighborhood pizzeria and sandwich shop with takeaway ordering",
      domain: "restaurant-dining",
      projectName: "PizzaCozy",
      projectRoot: workDir,
    });

    const research = res.research;
    // Irrelevant/bloat features must be documented with explicit rationale
    expect(research.irrelevantFeatures.length).toBeGreaterThanOrEqual(1);

    const enterpriseBloat = research.irrelevantFeatures.find((f) => /franchise|accounting|tracker/i.test(f.name));
    expect(enterpriseBloat).toBeDefined();
    expect(enterpriseBloat?.rejectionReason).toBeDefined();
    expect(enterpriseBloat?.rationale.length).toBeGreaterThan(15);
  });

  // 11. Correct updates to the authoritative Feature Matrix
  it("Requirement 11 — Harmonized FeatureMatrix strictly satisfies FeatureMatrixManager validation", () => {
    const explicitFeatures = [
      {
        title: "Course Catalog",
        description: "Browse categorized curriculum modules.",
        expectedBehavior: "Displays active courses.",
        routes: ["/courses"],
        components: ["CourseList"],
      },
    ];

    const matrix = FeatureMatrixHarmonizer.harmonize({
      projectName: "AcademyX",
      domainName: "education-learning",
      userPrompt: "Online computer science academy",
      explicitFeatures,
      projectRoot: workDir,
    });

    const validation = FeatureMatrixManager.validate(matrix);
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);

    // File must be persisted to .aegis/feature-matrix.json
    const matrixFile = join(workDir, ".aegis", "feature-matrix.json");
    expect(existsSync(matrixFile)).toBe(true);
  });

  // 12. Correct interaction with canonical contracts and the Phase 3 design pipeline
  it("Requirement 12 — Persists structured .aegis/reference-research.json artifact", async () => {
    const res = await ReferenceResearchEngine.executeResearch({
      prompt: "Interactive student learning portal with assignments and mentoring",
      domain: "education-learning",
      projectName: "StudentPortal",
      projectRoot: workDir,
    });

    const researchPath = join(workDir, ".aegis", "reference-research.json");
    expect(existsSync(researchPath)).toBe(true);

    const loaded = ReferenceResearchEngine.loadResearchArtifact(workDir);
    expect(loaded).toBeDefined();
    expect(loaded?.version).toBe("1.0.0");
    expect(loaded?.researchObjective).toContain("student learning portal");
    expect(loaded?.sources.length).toBeGreaterThanOrEqual(2);
  });

  // 13. Protection against copied source text, branding, and unauthorized assets
  it("Requirement 13 — Explicit copyright safeguards and originality attestations", async () => {
    const res = await ReferenceResearchEngine.executeResearch({
      prompt: "Real estate property listings and scheduled walkthrough tours",
      domain: "real-estate-discovery",
      projectName: "RealtySphere",
      projectRoot: workDir,
    });

    const safeguards = res.research.copyrightSafeguards;
    expect(safeguards.noProprietaryCodeCopied).toBe(true);
    expect(safeguards.noProprietaryTextCloned).toBe(true);
    expect(safeguards.noLogosOrProtectedAssetsUsed).toBe(true);
    expect(safeguards.structuralPatternsOnly).toBe(true);
    expect(safeguards.safeguardAttestation).toContain("No proprietary source code");
  });

  // 14. Honest research status reporting
  it("Requirement 14 — Honest research status reporting (SUCCESS, PARTIAL, BLOCKED, NOT_PERFORMED)", async () => {
    // Trivial prompt -> NOT_PERFORMED
    const trivialRes = await ReferenceResearchEngine.executeResearch({
      prompt: "hello world",
      domain: "general",
      projectRoot: workDir,
    });
    expect(trivialRes.research.overallStatus).toBe("NOT_PERFORMED");

    // Standard research-worthy prompt -> SUCCESS or PARTIAL
    const standardRes = await ReferenceResearchEngine.executeResearch({
      prompt: "Farm to table organic salad restaurant with curbside pickup",
      domain: "restaurant-dining",
      projectRoot: workDir,
    });
    expect(["SUCCESS", "PARTIAL"]).toContain(standardRes.research.overallStatus);
  });

  // 15. Support for unfamiliar domains without domain-specific hardcoded assumptions
  it("Requirement 15 — Handles unfamiliar domains with dynamic reference synthesis", async () => {
    const unfamiliarDiscovery = await ReferenceSourceSelector.discoverLiveReferences({
      prompt: "Bioluminescent fungal spore genetic tracking and mycelium incubator",
      domain: "mycology-biotech",
    });

    expect(unfamiliarDiscovery.status).toBe("SUCCESS");
    expect(unfamiliarDiscovery.sources.length).toBeGreaterThanOrEqual(2);
    expect(unfamiliarDiscovery.sources[0].url.startsWith("http")).toBe(true);
  });
});
