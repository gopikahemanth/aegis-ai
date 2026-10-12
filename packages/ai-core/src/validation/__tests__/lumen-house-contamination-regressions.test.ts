import { describe, it, expect } from "vitest";
import { DomainVocabularySynthesizer } from "../../design/domain-vocabulary-synthesizer.js";
import { NavigationDesignResolver } from "../../design/navigation-design.js";
import { AudioExperienceGenerator } from "../../design/experience-generators/audio-experience-generator.js";
import { ItineraryPlannerExperienceGenerator } from "../../design/experience-generators/itinerary-planner-generator.js";
import { CollectionHubExperienceGenerator } from "../../design/experience-generators/collection-hub-generator.js";
import { TemplateContaminationChecker } from "../template-contamination-checker.js";
import { PageExperiencePlanner } from "../../design/page-experience-plan.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Lumen House Domain & Contamination Regression Suite", () => {
  const museumPrompt =
    "Create an immersive contemporary art museum website called LUMEN HOUSE. Showcase rotating exhibitions, artist profiles, a searchable artwork collection, an interactive museum floor exploration, audio guides, visitor planning, and a personal saved-artworks collection. The experience should feel like a prestigious modern museum: gallery-scale imagery, expressive typography, generous whitespace, refined motion, spatial compositions, and a sophisticated monochrome palette with one vivid accent.";

  // TEST 1: Contemporary art museum cannot contain marine/underwater vocabulary
  it("TEST 1: Contemporary art museum cannot contain marine/underwater vocabulary", () => {
    const chapters = DomainVocabularySynthesizer.synthesizeChapters(
      museumPrompt,
      "SCROLL_STORY",
      4,
      8427
    );
    const chapterText = JSON.stringify(chapters).toLowerCase();

    expect(chapterText).not.toContain("hydrophone");
    expect(chapterText).not.toContain("benthic");
    expect(chapterText).not.toContain("bathymetry");
    expect(chapterText).not.toContain("mariana");
    expect(chapterText).not.toContain("whale acoustics");
    expect(chapterText).not.toContain("underwater habitat");
    expect(chapterText).not.toContain("submersible");

    const waypoints = DomainVocabularySynthesizer.synthesizeWaypoints({
      brandName: "LUMEN HOUSE",
      prompt: museumPrompt,
      route: "/navigate-interactive-floor-plan",
      seed: 8427,
    });
    const waypointText = JSON.stringify(waypoints).toLowerCase();

    expect(waypointText).not.toContain("barrier reef");
    expect(waypointText).not.toContain("benthic");
    expect(waypointText).not.toContain("hydrothermal");
    expect(waypointText).not.toContain("siphonophore");
    expect(waypointText).not.toContain("mariana trench");

    // Museum waypoints must be properly synthesized
    expect(waypointText).toContain("atrium");
    expect(waypointText).toContain("sculpture");
  });

  // TEST 2: Contemporary art museum audio-guide route cannot contain hydrophone/marine terminology
  it("TEST 2: Contemporary art museum audio-guide route cannot contain hydrophone/marine terminology", () => {
    const pages = PageExperiencePlanner.planPages(
      museumPrompt,
      { emotionalTone: { primary: "contemplative" }, experiencePattern: "craft-editorial" } as any,
      { genre: "EDITORIAL_PUBLICATION", brandIdentity: { name: "LUMEN HOUSE" } } as any,
      { capabilities: [] } as any,
      [
        "/",
        "/rotating-exhibitions",
        "/explore-artist-profiles",
        "/search-semantic-artworks",
        "/navigate-interactive-floor-plan",
        "/listen-to-audio-guide",
        "/plan-museum-visit",
        "/saved-artworks",
      ]
    );

    const audioRoute = pages.find((p) => p.route === "/listen-to-audio-guide");
    expect(audioRoute).toBeDefined();

    // The page role and purpose must NOT contain hydrophone or marine terms
    expect(audioRoute!.pageRole.toLowerCase()).not.toContain("hydrophone");
    expect(audioRoute!.pageRole.toLowerCase()).not.toContain("marine resonance");
    expect(audioRoute!.purpose.toLowerCase()).not.toContain("hydrophone");
    expect(audioRoute!.purpose.toLowerCase()).not.toContain("marine");

    // Must be appropriate curatorial guide
    expect(audioRoute!.pageRole.toLowerCase()).toContain("audio guide");

    // Generated audio experience code must have curatorial voice pads, zero hydrophone/whale acoustics
    const audioCode = AudioExperienceGenerator.generate({
      componentName: "AudioGuidePage",
      brandName: "LUMEN HOUSE",
      route: "/listen-to-audio-guide",
      pageRole: audioRoute!.pageRole,
      purpose: audioRoute!.purpose,
      prompt: museumPrompt,
      seed: 8427,
    });

    expect(audioCode).not.toContain("Hydrophone Acoustic Array");
    expect(audioCode).not.toContain("Marine Resonance");
    expect(audioCode).not.toContain("whale acoustics");
    expect(audioCode).not.toContain("benthic");
    expect(audioCode).toContain("Curator Commentary");
    expect(audioCode).toContain("Artist Voice");
  });

  // TEST 3: Museum cannot contain SAVORLINE culinary terms
  it("TEST 3: Museum cannot contain SAVORLINE culinary terms", () => {
    const chapters = DomainVocabularySynthesizer.synthesizeChapters(
      museumPrompt,
      "SCROLL_STORY",
      4,
      8427
    );
    const chapterText = JSON.stringify(chapters).toLowerCase();

    expect(chapterText).not.toContain("savorline");
    expect(chapterText).not.toContain("terroir awakening");
    expect(chapterText).not.toContain("wood-fire kilns");
    expect(chapterText).not.toContain("flavor architecture");
    expect(chapterText).not.toContain("feasting ledger");

    const brand = NavigationDesignResolver.extractBrandFromPrompt(museumPrompt);
    expect(brand).toBe("LUMEN HOUSE");
    expect(brand).not.toContain("SAVORLINE");
  });

  // TEST 4: Museum cannot contain Kazzoo/fantasy terms
  it("TEST 4: Museum cannot contain Kazzoo/fantasy terms", () => {
    const chapters = DomainVocabularySynthesizer.synthesizeChapters(
      museumPrompt,
      "SCROLL_STORY",
      4,
      8427
    );
    const chapterText = JSON.stringify(chapters).toLowerCase();

    expect(chapterText).not.toContain("kazzoo");
    expect(chapterText).not.toContain("claymation");
    expect(chapterText).not.toContain("whispering awakening");
    expect(chapterText).not.toContain("bridge of tortoise");
    expect(chapterText).not.toContain("cloud spire");
    expect(chapterText).not.toContain("unwritten songs");

    const telemetry = DomainVocabularySynthesizer.synthesize3DTelemetry({
      brandName: "LUMEN HOUSE",
      prompt: museumPrompt,
      route: "/navigate-interactive-floor-plan",
      seed: 8427,
    });

    expect(telemetry.studioName).not.toContain("Emerald Glade");
    expect(telemetry.telemetryTitle).not.toContain("Realm Telemetry");
  });

  // TEST 5: Museum cannot contain Oakhaven furniture terms
  it("TEST 5: Museum cannot contain Oakhaven furniture terms", () => {
    const waypoints = DomainVocabularySynthesizer.synthesizeWaypoints({
      brandName: "LUMEN HOUSE",
      prompt: museumPrompt,
      route: "/navigate-interactive-floor-plan",
      seed: 8427,
    });
    const waypointText = JSON.stringify(waypoints).toLowerCase();

    expect(waypointText).not.toContain("mortise & tenon");
    expect(waypointText).not.toContain("appalachian hardwood");
    expect(waypointText).not.toContain("kiln curing");
    expect(waypointText).not.toContain("oakhaven");
    expect(waypointText).not.toContain("chatoyancy");
  });

  // TEST 6: Two contamination violations are detected with exact file + token evidence
  it("TEST 6: Contamination violations are detected with exact file + token evidence", () => {
    const tempDir = join(tmpdir(), `aegis-test-contamination-${Date.now()}`);
    mkdirSync(join(tempDir, "src", "features"), { recursive: true });
    mkdirSync(join(tempDir, ".aegis"), { recursive: true });

    // Write a contract declaring Contemporary Art Museum
    writeFileSync(
      join(tempDir, ".aegis", "architecture-contract.json"),
      JSON.stringify({
        prompt: museumPrompt,
        requiredFeatures: ["exhibitions", "artworks", "audioguide"],
        requiredModels: ["Exhibition", "Artwork", "Artist"],
      })
    );

    // Write an artificial contaminated file with exact foreign tokens
    const contaminatedFileContent = `
      import React from "react";
      export function AudioTrack() {
        return (
          <div>
            <h1>Hydrophone Acoustic Array</h1>
            <p>Marine resonance and whale acoustics in the deep sea</p>
          </div>
        );
      }
    `;
    writeFileSync(join(tempDir, "src", "features", "AudioTrack.tsx"), contaminatedFileContent);

    // Also write clean museum file with artwork (MUST NOT be flagged as violation)
    const cleanMuseumFileContent = `
      import React from "react";
      export function SavedArtworks() {
        return <div>Saved Artwork Collection</div>;
      }
    `;
    writeFileSync(join(tempDir, "src", "features", "SavedArtworks.tsx"), cleanMuseumFileContent);

    try {
      const checker = new TemplateContaminationChecker(tempDir);
      const report = checker.audit("Contemporary Art Museum");

      expect(report.clean).toBe(false);
      expect(report.status).toBe("FAIL");

      // Verify exact file + token evidence
      const marineViolations = report.violations.filter(
        (v) => v.file.includes("AudioTrack.tsx") && v.issueType === "FORBIDDEN_KEYWORD"
      );
      expect(marineViolations.length).toBeGreaterThanOrEqual(2);

      const tokens = marineViolations.map((v) => v.token);
      expect(tokens).toContain("hydrophone");
      expect(tokens).toContain("marine resonance");

      // SavedArtworks.tsx MUST NOT be flagged
      const artworkViolations = report.violations.filter((v) => v.file.includes("SavedArtworks.tsx"));
      expect(artworkViolations.length).toBe(0);

      // Verify report summary includes token and expected domain
      expect(report.summary).toContain("hydrophone");
      expect(report.summary.toLowerCase()).toContain("contemporary art museum");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // TEST 7: Brand extraction captures multi-word names like "LUMEN HOUSE"
  it("TEST 7: Brand extraction captures multi-word names cleanly without truncation", () => {
    const brand = NavigationDesignResolver.extractBrandFromPrompt(
      "Create an immersive contemporary art museum website called LUMEN HOUSE. Showcase rotating exhibitions..."
    );
    expect(brand).toBe("LUMEN HOUSE");

    const brandQuoted = NavigationDesignResolver.extractBrandFromPrompt(
      'Create an immersive website called "LUMEN HOUSE" for exhibitions.'
    );
    expect(brandQuoted).toBe("LUMEN HOUSE");

    const singleBrand = NavigationDesignResolver.extractBrandFromPrompt(
      "Create a culinary journal called SAVORLINE."
    );
    expect(singleBrand).toBe("SAVORLINE");
  });

  // TEST 8: Itinerary planner for contemporary art museum does not leak culinary terms and avoids CRUD form pattern
  it("TEST 8: Itinerary planner for contemporary art museum does not leak culinary terms and avoids CRUD form pattern", () => {
    const code = ItineraryPlannerExperienceGenerator.generate({
      componentName: "PlanMuseumVisitPage",
      brandName: "LUMEN HOUSE",
      route: "/plan-museum-visit",
      pageRole: "Museum Visit Planner & Gallery Admission Concierge",
      purpose: "Visiting schedule, admission tiers, and custom museum visit itinerary builder",
      prompt: museumPrompt,
      seed: 8427,
    });

    const codeLower = code.toLowerCase();
    expect(codeLower).not.toContain("culinary");
    expect(codeLower).not.toContain("dining");
    expect(codeLower).not.toContain("market tours");
    expect(codeLower).not.toContain("cellar visits");
    expect(codeLower).not.toContain("masterclasses");
    expect(codeLower).not.toContain("add culinary stop");
    expect(codeLower).not.toContain("asador");

    // Museum specific terms
    expect(codeLower).toContain("gallery");
    expect(codeLower).toContain("exhibition");
    expect(codeLower).toContain("lumen house");

    // Must not trigger forbidden crud form pattern: /<form[^>]*onSubmit/i with /newTitle|Add\s+[A-Z]/
    const hasCrudForm = /<form[^>]*onSubmit/i.test(code) && /newTitle|newAuthor|newContent|newName|newRecord|Add\s+[A-Z]/i.test(code);
    expect(hasCrudForm).toBe(false);
  });

  // TEST 9: Collection hub for contemporary art museum does not leak culinary empty hint
  it("TEST 9: Collection hub for contemporary art museum does not leak culinary empty hint", () => {
    const code = CollectionHubExperienceGenerator.generate({
      componentName: "SavedArtworksPage",
      brandName: "LUMEN HOUSE",
      route: "/saved-artworks",
      pageRole: "Personal Saved Artworks & Curated Collection Vault",
      purpose: "Private museum collection vault organizing saved artworks",
      prompt: museumPrompt,
      seed: 8427,
    });

    const codeLower = code.toLowerCase();
    expect(codeLower).not.toContain("recipes");
    expect(codeLower).not.toContain("culinary stories");
    expect(codeLower).not.toContain("travel destinations");
    expect(codeLower).toContain("artworks");
  });
});
