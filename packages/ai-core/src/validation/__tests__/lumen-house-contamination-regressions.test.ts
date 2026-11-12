import { describe, it, expect } from "vitest";
import { NavigationDesignResolver } from "../../design/navigation-design.js";
import { TemplateContaminationChecker } from "../template-contamination-checker.js";
import { PageExperiencePlanner } from "../../design/page-experience-plan.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import { mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Lumen House Domain & Contamination Regression Suite", () => {
  const museumPrompt =
    "Create an immersive contemporary art museum website called LUMEN HOUSE. Showcase rotating exhibitions, artist profiles, a searchable artwork collection, an interactive museum floor exploration, audio guides, visitor planning, and a personal saved-artworks collection. The experience should feel like a prestigious modern museum: gallery-scale imagery, expressive typography, generous whitespace, refined motion, spatial compositions, and a sophisticated monochrome palette with one vivid accent.";

  // TEST 1: Contemporary art museum pages plan correctly without marine or culinary contamination
  it("TEST 1: Contemporary art museum pages plan correctly without marine or culinary contamination", () => {
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

    const fullPlanText = JSON.stringify(pages).toLowerCase();
    expect(fullPlanText).not.toContain("hydrophone");
    expect(fullPlanText).not.toContain("benthic");
    expect(fullPlanText).not.toContain("bathymetry");
    expect(fullPlanText).not.toContain("mariana");
    expect(fullPlanText).not.toContain("submersible");
    expect(fullPlanText).not.toContain("savorline");
    expect(fullPlanText).not.toContain("kazzoo");
    expect(fullPlanText).not.toContain("oakhaven");
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
  });

  // TEST 3: Museum brand extraction captures "LUMEN HOUSE"
  it("TEST 3: Museum brand extraction captures multi-word names cleanly without truncation", () => {
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

  // TEST 4: Contamination violations are detected with exact file + token evidence
  it("TEST 4: Contamination violations are detected with exact file + token evidence", () => {
    const tempDir = join(tmpdir(), `aegis-test-contamination-${Date.now()}`);
    mkdirSync(join(tempDir, "src", "features"), { recursive: true });
    mkdirSync(join(tempDir, ".aegis"), { recursive: true });

    try {
      // 1. Contaminated file: audio track with Marine Hydrophone leakage in a Museum project
      writeFileSync(
        join(tempDir, "src", "features", "AudioTrack.tsx"),
        `// Audio track for contemporary art museum\nexport function AudioTrack() {\n  const hydrophone = "Active Marine Resonance";\n  return <div>{hydrophone}</div>;\n}\n`,
        "utf8"
      );

      // 2. Legitimate file: SavedArtworks.tsx using museum-appropriate terminology
      writeFileSync(
        join(tempDir, "src", "features", "SavedArtworks.tsx"),
        `// Saved artworks collection for contemporary art museum\nexport function SavedArtworks() {\n  return <div>My Curated Artworks Collection</div>;\n}\n`,
        "utf8"
      );

      // Run checker against contemporary art museum domain
      const report = TemplateContaminationChecker.check(tempDir, {
        prompt: museumPrompt,
        domain: "Contemporary Art Museum",
        category: "museum",
      });

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

  // TEST 5: FastDeterministicSanitizer synthesizes route pages without culinary or marine leakage
  it("TEST 5: FastDeterministicSanitizer synthesizes route pages without culinary or marine leakage", () => {
    const tempDir = join(tmpdir(), `aegis-lumen-synth-${Date.now()}`);
    mkdirSync(join(tempDir, "src", "pages"), { recursive: true });

    try {
      FastDeterministicSanitizer.synthesizeRoutePage(
        join(tempDir, "src"),
        "/saved-artworks",
        "SavedArtworksPage",
        museumPrompt,
        8427,
        { pageRole: "Saved Artworks Collection", purpose: "Curated personal vault of museum artworks" } as any
      );

      const filePath = join(tempDir, "src", "pages", "SavedArtworksPage.tsx");
      const code = readFileSync(filePath, "utf8").toLowerCase();

      expect(code).not.toContain("culinary");
      expect(code).not.toContain("dining");
      expect(code).not.toContain("hydrophone");
      expect(code).not.toContain("benthic");
      expect(code).toContain("saved artworks");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
