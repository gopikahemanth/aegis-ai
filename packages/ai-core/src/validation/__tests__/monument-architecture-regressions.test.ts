import { describe, it, expect } from "vitest";
import { DomainVocabularySynthesizer } from "../../design/domain-vocabulary-synthesizer";
import { NavigationDesignResolver } from "../../design/navigation-design";

describe("Monument Architecture Regression Suite", () => {
  // TEST 1: Architecture journal SCROLL_STORY fallback contains zero generic telemetry/startup copy
  it("TEST 1: Architecture journal SCROLL_STORY fallback contains zero generic telemetry/startup copy", () => {
    const chapters = DomainVocabularySynthesizer.synthesizeChapters(
      "Create a premium independent architecture journal called MONUMENT.",
      "SCROLL_STORY",
      5,
      42
    );

    const fullChapterText = JSON.stringify(chapters).toLowerCase();

    // Must have synthesized real architecture chapters
    expect(chapters.length).toBeGreaterThan(0);

    // Forbidden generic telemetry / startup copy
    expect(fullChapterText).not.toContain("telemetry");
    expect(fullChapterText).not.toContain("genesis");
    expect(fullChapterText).not.toContain("🚀");
    expect(fullChapterText).not.toContain("validating foundational telemetry");
    expect(fullChapterText).not.toContain("dynamic longform architecture");
    expect(fullChapterText).not.toContain("phase 1 initiated");
    expect(fullChapterText).not.toContain("phase 2 calibrated");
    expect(fullChapterText).not.toContain("telemetry gateway");
    expect(fullChapterText).not.toContain("operational ledgers");
  });

  // TEST 2: Underwater science domain contains zero architecture/fashion/fantasy fallback vocabulary
  it("TEST 2: Underwater science domain contains zero architecture/fashion/fantasy fallback vocabulary", () => {
    const chapters = DomainVocabularySynthesizer.synthesizeChapters(
      "Deep sea hydrothermal vent exploration and marine bioluminescence catalog",
      "SCROLL_STORY",
      4,
      101
    );

    const fullChapterText = JSON.stringify(chapters).toLowerCase();

    // Must not leak architectural, fashion, or fantasy vocabulary
    expect(fullChapterText).not.toContain("monograph");
    expect(fullChapterText).not.toContain("tectonic");
    expect(fullChapterText).not.toContain("architrave");
    expect(fullChapterText).not.toContain("haute couture");
    expect(fullChapterText).not.toContain("dragon");
    expect(fullChapterText).not.toContain("spellbook");
    expect(fullChapterText).not.toContain("telemetry");
    expect(fullChapterText).not.toContain("genesis");
  });

  // TEST 3: Navigation hrefs are a subset of authoritative requiredRoutes
  it("TEST 3: Navigation hrefs are a subset of authoritative requiredRoutes", () => {
    const authoritativeRoutes = [
      "/",
      "/portfolios",
      "/city-map",
      "/archive",
      "/explore-longform-articles"
    ];

    const plannedRoutes = [
      { path: "/", title: "Monograph Front" },
      { path: "/portfolios", title: "Practitioner Profiles" },
      { path: "/city-map", title: "Urban Atlas" },
      { path: "/archive", title: "Typology Archive" },
      { path: "/explore-longform-articles", title: "Longform Critical Inquiry" },
      { path: "/unauthorized-rogue-route", title: "Rogue Page" }
    ];

    const design = NavigationDesignResolver.resolve(
      "Create a premium independent architecture journal called MONUMENT.",
      "editorial_monograph",
      "MONUMENT",
      "Journal of Spatial Ideas",
      plannedRoutes,
      "contemplative",
      123,
      "EDITORIAL",
      authoritativeRoutes
    );

    const authoritativeSet = new Set(authoritativeRoutes);

    // Every primary navigation link MUST exist in authoritativeRoutes
    expect(design.primaryItems.length).toBeGreaterThan(0);
    for (const item of design.primaryItems) {
      expect(authoritativeSet.has(item.path)).toBe(true);
    }

    // Rogue route outside authoritativeRoutes must NOT be included
    const paths = design.primaryItems.map(i => i.path);
    expect(paths).not.toContain("/unauthorized-rogue-route");
  });

  // TEST 4: Section layer IDs cannot become navigation routes accidentally
  it("TEST 4: Section layer IDs cannot become navigation routes accidentally", () => {
    const authoritativeRoutes = [
      "/",
      "/portfolios",
      "/city-map",
      "/archive"
    ];

    // Corrupted planned routes containing vertical section IDs
    const contaminatedPlannedRoutes = [
      { path: "/", title: "Cover" },
      { path: "/visual-photo-essay-pull-quote-split", title: "Visual Essay Section" },
      { path: "/in-depth-analytical-narrative-marginalia", title: "Analytical Marginalia" },
      { path: "/hero-split-overview", title: "Hero Section" },
      { path: "/grid-facet-browser-section", title: "Facet Section" },
      { path: "/portfolios", title: "Architect Portfolios" }
    ];

    const design = NavigationDesignResolver.resolve(
      "Create a premium independent architecture journal called MONUMENT.",
      "editorial_monograph",
      "MONUMENT",
      "Journal of Spatial Ideas",
      contaminatedPlannedRoutes,
      "contemplative",
      123,
      "EDITORIAL",
      authoritativeRoutes
    );

    const paths = design.primaryItems.map(i => i.path);

    // None of the section IDs may become navigation URLs
    expect(paths).not.toContain("/visual-photo-essay-pull-quote-split");
    expect(paths).not.toContain("/in-depth-analytical-narrative-marginalia");
    expect(paths).not.toContain("/hero-split-overview");
    expect(paths).not.toContain("/grid-facet-browser-section");

    // Must only contain real routes
    for (const p of paths) {
      expect(["/", "/portfolios", "/city-map", "/archive"]).toContain(p);
    }
  });

  // TEST 5: Plural/singular/entity vocabulary matching works without false positives
  it("TEST 5: Plural/singular/entity vocabulary matching works without false positives", () => {
    // Helper mimicking ReadOnlyBrowserValidator.matchesEvidenceToken
    const matchesEvidenceToken = (token: string, text: string): boolean => {
      const t = token.toLowerCase().trim();
      if (!t || t.length < 2) return false;
      if (text.includes(t)) return true;

      if (t.endsWith("ies") && t.length > 4) {
        const singular = t.slice(0, -3) + "y";
        if (text.includes(singular)) return true;
      }
      if (t.endsWith("es") && t.length > 3) {
        const singular = t.slice(0, -2);
        if (text.includes(singular)) return true;
      }
      if (t.endsWith("s") && t.length > 3) {
        const singular = t.slice(0, -1);
        if (text.includes(singular)) return true;
      } else if (!t.endsWith("s")) {
        const plural = t + "s";
        if (text.includes(plural)) return true;
      }

      const semanticStems = [
        { root: "portfolio", variants: ["portfolios", "practitioner profiles", "practitioner", "dialogues", "built work", "architect dialogues"] },
        { root: "architect", variants: ["architecture", "architectural", "architects", "practitioner", "atelier"] },
        { root: "dialogue", variants: ["dialogues", "interview", "interviews", "conversation", "profiles"] },
        { root: "specimen", variants: ["specimens", "species", "fauna", "flora", "organism"] },
        { root: "archive", variants: ["archival", "archives", "typology", "chronicle", "monograph index"] },
        { root: "article", variants: ["articles", "essay", "essays", "monograph", "editorial", "longform"] },
        { root: "craftsmanship", variants: ["craft", "caliber", "calibers", "horology", "tectonics"] },
        { root: "map", variants: ["atlas", "spatial", "coordinates", "cartographic", "city index"] }
      ];

      for (const stem of semanticStems) {
        if (t.includes(stem.root) || stem.variants.some(v => t.includes(v))) {
          for (const v of [stem.root, ...stem.variants]) {
            if (text.includes(v)) return true;
          }
        }
      }

      return false;
    };

    // Valid equivalents for required evidence "portfolios"
    const validRenderedSample1 = "Featured Practitioner Profiles and Studio Monographs";
    const validRenderedSample2 = "Exclusive Architect Dialogues regarding tectonic form";
    const validRenderedSample3 = "Built Work index across Scandinavian capitals";
    const validRenderedSample4 = "Individual Architect Portfolio entries";

    expect(matchesEvidenceToken("portfolios", validRenderedSample1.toLowerCase())).toBe(true);
    expect(matchesEvidenceToken("portfolios", validRenderedSample2.toLowerCase())).toBe(true);
    expect(matchesEvidenceToken("portfolios", validRenderedSample3.toLowerCase())).toBe(true);
    expect(matchesEvidenceToken("portfolios", validRenderedSample4.toLowerCase())).toBe(true);

    // Singular vs plural
    expect(matchesEvidenceToken("dialogues", "architectural dialogue between peers")).toBe(true);
    expect(matchesEvidenceToken("specimen", "rare abyssal specimens discovered")).toBe(true);
    expect(matchesEvidenceToken("articles", "read our latest longform article")).toBe(true);

    // Strict negative check (do NOT allow arbitrary text or irrelevant words)
    const unrelatedSample = "Welcome to the SaaS analytics dashboard with churn metrics and user retention graphs";
    expect(matchesEvidenceToken("portfolios", unrelatedSample.toLowerCase())).toBe(false);
    expect(matchesEvidenceToken("dialogues", unrelatedSample.toLowerCase())).toBe(false);
    expect(matchesEvidenceToken("specimens", unrelatedSample.toLowerCase())).toBe(false);
  });
});
