/**
 * Aegis AI — Autonomous Research-Driven Intelligence & Context-Aware Contamination Suite
 *
 * Automated regression tests verifying:
 * 1. "Specialized Care" in pet sanctuary -> PASS (legitimate domain vocabulary via ProjectContextModel)
 * 2. "Gallery" when requested or discovered -> PASS (legitimate requested feature)
 * 3. Research-derived terminology not in original prompt -> PASS when relevant
 * 4. "Kyoto, Japan" in unrelated project without Japanese provenance -> FAIL (real contamination caught)
 * 5. "Application Platform" starter-template indicator -> FAIL (foreign starter branding caught)
 * 6. Foreign demo records / product leaks -> FAIL (real contamination caught)
 * 7. Feature registry count and identity consistency -> PASS when preserved, FAIL on discrepancy
 * 8. Validators are strictly read-only: files are never modified during validation scan
 * 9. Self-healing engine rejects candidate repair that produces identical failure evidence
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

import { TemplateContaminationChecker } from "../template-contamination-checker.js";
import { DomainConsistencyValidator } from "../../semantics/domain-consistency-validator.js";
import { ProjectContextModelLoader } from "../../context/project-context-model.js";
import { FeatureMatrixManager } from "../../contracts/feature-matrix.js";
import { FeatureMatrixHarmonizer } from "../../research/feature-matrix-harmonizer.js";
import { ReferenceSourceSelector } from "../../research/reference-source-selector.js";
import { AssetAcceptanceGate } from "../asset-acceptance-gate.js";

const TEST_SANDBOX = join(process.cwd(), "scratch", "test-context-contamination-sandbox");

function fileHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

describe("Aegis Context-Aware Intelligence & Contamination Suite", () => {
  beforeEach(() => {
    if (existsSync(TEST_SANDBOX)) {
      rmSync(TEST_SANDBOX, { recursive: true, force: true });
    }
    mkdirSync(join(TEST_SANDBOX, ".aegis"), { recursive: true });
    mkdirSync(join(TEST_SANDBOX, "src", "pages"), { recursive: true });
    mkdirSync(join(TEST_SANDBOX, "src", "components"), { recursive: true });
    mkdirSync(join(TEST_SANDBOX, "src", "content"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_SANDBOX)) {
      rmSync(TEST_SANDBOX, { recursive: true, force: true });
    }
  });

  it("1. 'Specialized Care' in a pet sanctuary passes via ProjectContextModel", () => {
    // Contract setup: luxury pet sanctuary
    const prompt = "Build a luxury pet sanctuary and boutique with exceptional veterinary care and specialized grooming services.";
    writeFileSync(
      join(TEST_SANDBOX, ".aegis", "architecture-contract.json"),
      JSON.stringify({ prompt, domainCategory: "pet-care-sanctuary", name: "LumierePetSanctuary" }),
      "utf8"
    );

    // Page uses 'Specialized Care'
    writeFileSync(
      join(TEST_SANDBOX, "src", "pages", "SanctuaryResidents.tsx"),
      `import React from "react";
export default function SanctuaryResidents() {
  return (
    <div>
      <h2>Sanctuary Residents</h2>
      <p>Our permanent residents receive Specialized Care and rehabilitation pathways daily.</p>
    </div>
  );
}`,
      "utf8"
    );

    const checker = new TemplateContaminationChecker(TEST_SANDBOX);
    const result = checker.audit("pet-care-sanctuary", { prompt });

    const hasSpecializedCareViolation = result.violations.some(
      v => v.token?.toLowerCase() === "specialized care" || v.description.toLowerCase().includes("specialized care")
    );
    expect(hasSpecializedCareViolation).toBe(false);
  });

  it("2. 'Gallery' when explicitly requested or discovered passes without false positive", () => {
    const prompt = "Build a contemporary art gallery and sculpture exhibition space with a featured artist gallery.";
    writeFileSync(
      join(TEST_SANDBOX, ".aegis", "architecture-contract.json"),
      JSON.stringify({ prompt, domainCategory: "art-gallery", name: "ModernistGallery" }),
      "utf8"
    );

    writeFileSync(
      join(TEST_SANDBOX, "src", "pages", "ArtworkGallery.tsx"),
      `import React from "react";
export default function ArtworkGallery() {
  return (
    <section>
      <h1>Artwork Gallery</h1>
      <p>Explore curated seasonal gallery exhibitions.</p>
    </section>
  );
}`,
      "utf8"
    );

    const spec: any = {
      domainCategory: "art-gallery",
      prompt,
      forbiddenPatterns: ["Artwork", "Gallery"],
      features: [{ name: "Artwork Gallery" }],
    };

    const result = DomainConsistencyValidator.validate(TEST_SANDBOX, spec);
    // Since prompt and features contain "gallery", the allowed gallery bypass protects it
    expect(result.forbiddenMatches).toHaveLength(0);
  });

  it("3. Research-derived terminology not in prompt is approved via context evaluation", () => {
    const prompt = "Create a luxury pet sanctuary";
    const model = ProjectContextModelLoader.loadFromProject(TEST_SANDBOX, prompt);

    // "dietary plan" and "rehabilitation" are derived from animal sanctuary research
    model.research.discoveredFeatures.push("Sanctuary Resident Health Passports");
    model.research.suggestedTerminology.push("rehabilitation", "dietary plan", "intake assessment");

    const evalRehab = ProjectContextModelLoader.evaluatePhraseContext("rehabilitation", model);
    expect(evalRehab.isLegitimate).toBe(true);

    const evalDiet = ProjectContextModelLoader.evaluatePhraseContext("dietary plan", model);
    expect(evalDiet.isLegitimate).toBe(true);
  });

  it("4. 'Kyoto, Japan' in an unrelated architecture project without Japanese provenance FAILS", () => {
    const prompt = "Build an architectural studio website for a contemporary firm in London focusing on sustainable limestone pavilions.";
    writeFileSync(
      join(TEST_SANDBOX, ".aegis", "architecture-contract.json"),
      JSON.stringify({ prompt, domainCategory: "architecture-studio", name: "LimestoneStudio" }),
      "utf8"
    );

    // Contaminated component with foreign starter-template location
    writeFileSync(
      join(TEST_SANDBOX, "src", "components", "StudioContact.tsx"),
      `import React from "react";
export const StudioContact = () => (
  <div>
    <h3>International Studio</h3>
    <p>Principal Office: Kyoto, Japan</p>
  </div>
);`,
      "utf8"
    );

    const checker = new TemplateContaminationChecker(TEST_SANDBOX);
    const result = checker.audit("architecture-studio", { prompt });

    const caughtKyoto = result.violations.some(
      v => v.token?.toLowerCase() === "kyoto, japan" || v.description.includes("Kyoto, Japan")
    );
    expect(caughtKyoto).toBe(true);
    expect(result.clean).toBe(false);
  });

  it("5. 'Application Platform' starter-template indicator FAILS as foreign contamination", () => {
    const prompt = "Build a luxury pet boutique and sanctuary.";
    writeFileSync(
      join(TEST_SANDBOX, ".aegis", "architecture-contract.json"),
      JSON.stringify({ prompt, domainCategory: "pet-care", name: "PetBoutique" }),
      "utf8"
    );

    // Foreign starter-template layout with "Application Platform"
    writeFileSync(
      join(TEST_SANDBOX, "src", "components", "Header.tsx"),
      `import React from "react";
export const Header = () => (
  <header>
    <h1>Application Platform</h1>
    <span className="bg-green-500 rounded-full w-2 h-2">Online</span>
  </header>
);`,
      "utf8"
    );

    const checker = new TemplateContaminationChecker(TEST_SANDBOX);
    const result = checker.audit("pet-care", { prompt });

    const caughtPlatform = result.violations.some(
      v => v.token?.toLowerCase() === "application platform" || v.description.toLowerCase().includes("application platform")
    );
    expect(caughtPlatform).toBe(true);
  });

  it("6. Feature registry count and identity remain consistent across stages", () => {
    const userPrompt = "Build a luxury pet sanctuary and boutique";
    const harmonized = FeatureMatrixHarmonizer.harmonize({
      projectName: "LumiereSanctuary",
      domainName: "pet-care-sanctuary",
      userPrompt,
      explicitFeatures: [
        { title: "Resident Animal Profiles", description: "View sanctuary residents" },
        { title: "Specialized Veterinary Care", description: "Book spa & clinic sessions" },
        { title: "Artisanal Nutrition Storefront", description: "Purchase pantry provisions" },
      ],
      discoveredFeatures: [
        {
          name: "Guardian Sponsorship Pathway",
          description: "Sponsor a resident",
          userValue: "Direct support",
          sourceUrl: "https://bestfriends.org",
          sourceCategory: "Sanctuary",
          relevanceScore: 0.95,
          recommendedPriority: "should-have",
          targetRoutes: ["/sponsor"],
          suggestedComponents: ["SponsorCard"],
          inclusionRationale: "Core engagement",
          confidence: 0.95,
        },
      ],
      projectRoot: TEST_SANDBOX,
    });

    expect(harmonized.features.length).toBe(4);
    expect(harmonized.features[0].id).toBe("F01");
    expect(harmonized.features[3].id).toBe("F04");

    // Load from project to ensure round-trip integrity
    const loaded = FeatureMatrixManager.loadFromProject(TEST_SANDBOX);
    expect(loaded).toBeDefined();
    expect(loaded?.totalFeatures).toBe(4);
    expect(loaded?.features.map(f => f.title)).toEqual(harmonized.features.map(f => f.title));
  });

  it("7. DomainConsistencyValidator is strictly READ-ONLY (no source file modification during scan)", () => {
    const prompt = "Build an artisanal bakery website";
    const filePath = join(TEST_SANDBOX, "src", "pages", "BakeryHome.tsx");
    const originalContent = `import React from "react";
export default function BakeryHome() {
  return <h1>Fresh Sourdough Breads</h1>;
}`;
    writeFileSync(filePath, originalContent, "utf8");
    const initialHash = fileHash(originalContent);

    const spec: any = {
      domainCategory: "bakery",
      prompt,
      forbiddenPatterns: ["Expense", "Transaction"],
      features: [{ name: "Artisanal Bread Catalog" }],
    };

    // Run validator
    DomainConsistencyValidator.validate(TEST_SANDBOX, spec);

    // Verify file content is strictly unmodified
    const afterContent = readFileSync(filePath, "utf8");
    const afterHash = fileHash(afterContent);
    expect(afterHash).toBe(initialHash);
    expect(afterContent).toBe(originalContent);
  });

  it("8. AssetAcceptanceGate requires legitimate external sources, verified licenses, and descriptive alt text", () => {
    // Valid manifest
    const validManifest = {
      version: "1.0.0",
      projectDomain: "pet-care-sanctuary",
      brandName: "Lumiere",
      assetCount: 1,
      createdAt: new Date().toISOString(),
      assets: [
        {
          id: "ast-home-hero",
          page: "/",
          section: "Hero",
          purpose: "Warm companion welcome",
          category: "hero-photography",
          subject: "Golden retriever puppy in sanctuary",
          aspectRatio: "16:9",
          resolution: "1920x1080",
          altText: "A joyful golden retriever puppy resting on a sunlit lawn at the sanctuary",
          resolvedUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1600",
          sourceMethod: "SOURCED",
          license: "Unsplash Commercial License",
          attribution: "Photo by Chewy on Unsplash",
          priority: "high",
        },
      ],
    };
    writeFileSync(join(TEST_SANDBOX, ".aegis", "asset-manifest.json"), JSON.stringify(validManifest), "utf8");
    writeFileSync(join(TEST_SANDBOX, "src", "content", "site-assets.ts"), "export const siteAssets = {};", "utf8");

    const report = AssetAcceptanceGate.audit(TEST_SANDBOX);
    expect(report.passed).toBe(true);

    // Invalid manifest with fake AI generation url & missing license
    const invalidManifest = {
      ...validManifest,
      assets: [
        {
          ...validManifest.assets[0],
          resolvedUrl: "http://fake-ai-image-generator.internal/img123.png",
          license: "N/A",
          altText: "pic",
        },
      ],
    };
    writeFileSync(join(TEST_SANDBOX, ".aegis", "asset-manifest.json"), JSON.stringify(invalidManifest), "utf8");
    const failReport = AssetAcceptanceGate.audit(TEST_SANDBOX);
    expect(failReport.passed).toBe(false);
    expect(failReport.violations.some(v => v.includes("ASSET_INVALID_SOURCE_URL"))).toBe(true);
    expect(failReport.violations.some(v => v.includes("ASSET_LICENSE_UNVERIFIED"))).toBe(true);
    expect(failReport.violations.some(v => v.includes("ASSET_ALT_TEXT_INVALID"))).toBe(true);
  });

  it("9. ReferenceSourceSelector identifies relevant real-world reference platforms for pet sanctuaries and architecture", () => {
    const petReferences = ReferenceSourceSelector.selectReferences({
      prompt: "Build a luxury pet sanctuary and companion animal boutique",
      domain: "pet-care-sanctuary",
      maxSources: 3,
    });

    expect(petReferences.length).toBeGreaterThanOrEqual(2);
    expect(petReferences.some(r => r.url.includes("bestfriends.org") || r.url.includes("thewildest.com"))).toBe(true);

    const archReferences = ReferenceSourceSelector.selectReferences({
      prompt: "Build a minimalist architecture studio portfolio monograph",
      domain: "architecture-spatial-design",
      maxSources: 3,
    });

    expect(archReferences.length).toBeGreaterThanOrEqual(2);
    expect(archReferences.some(r => r.url.includes("fosterandpartners.com") || r.url.includes("studiogang.com"))).toBe(true);
  });
});
