/**
 * Aegis AI — Phase 3 Automated Quality & Verification Suite
 *
 * Validates all 12 Phase 3 requirements:
 * 1. Different domains produce appropriately different design briefs.
 * 2. Distinct seeds produce distinct palettes, font pairings, heroes, and section structures.
 * 3. Components consistently follow theme tokens without visual clobbering.
 * 4. Required palette tokens (primary, secondary, accent, background, surface, text, border, semantic) are present.
 * 5. Text and control color combinations meet WCAG AA contrast requirements (>= 4.5:1 for text, >= 3.0:1 for UI).
 * 6. Typography fallbacks cascade gracefully to reliable system stacks when remote fonts fail.
 * 7. Cross-project similarity detection catches repeated layouts, not just repeated colors.
 * 8. Similarity regeneration terminates cleanly within the defined retry limit (max 3 retries).
 * 9. Unknown domains receive an appropriate original design without template phrase contamination.
 * 10. Existing valid Card, Tabs, Table, Button components are preserved non-destructively by sanitizers.
 * 11. Required application features and routes survive visual synthesis.
 * 12. Design brief (.aegis/design-brief.json) and theme (.aegis/theme.json) are persisted and consumable.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  TypographyManager,
  CURATED_FONT_PAIRINGS,
} from "../typography-catalog.js";
import {
  ThemeGenerator,
  getContrastRatio,
  ensureContrast,
} from "../theme-generator.js";
import {
  DesignBriefGenerator,
} from "../design-brief-generator.js";
import {
  CrossProjectSimilarityDetector,
  type ProjectDesignSignature,
} from "../similarity-detector.js";
import {
  CrossProjectSimilarityGate,
} from "../../validation/cross-project-similarity-gate.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";

describe("Phase 3: Original Design & Theme Generator Quality Suite", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-phase3-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  // 1. Different domains produce appropriately different design briefs
  it("Requirement 1 — Different domains produce appropriately different design briefs", () => {
    const marineBrief = DesignBriefGenerator.generateBrief({
      prompt: "Subsea habitat research station with environmental depth sensors",
      domain: "marine-engineering",
      seed: 101,
      routes: ["/", "/modules", "/telemetry"],
    });

    const aerospaceBrief = DesignBriefGenerator.generateBrief({
      prompt: "Satellite constellation operations hub tracking orbital downlink passes",
      domain: "aerospace-operations",
      seed: 202,
      routes: ["/", "/constellation", "/passes"],
    });

    const automotiveBrief = DesignBriefGenerator.generateBrief({
      prompt: "Handcrafted hypercar atelier with wind tunnel aerodynamics and private commissioning",
      domain: "luxury-automotive",
      seed: 303,
      routes: ["/", "/configurator", "/aerodynamics"],
    });

    expect(marineBrief.projectType).toContain("Subsea Habitat");
    expect(aerospaceBrief.projectType).toContain("Aerospace Operations Hub");
    expect(automotiveBrief.projectType).toContain("Hypercar Atelier");

    // Brand hues must be substantially different
    expect(marineBrief.brand.hue).not.toBe(aerospaceBrief.brand.hue);
    expect(marineBrief.brand.hue).not.toBe(automotiveBrief.brand.hue);

    // Font pairings must match domain characteristics
    expect(aerospaceBrief.typography.fontPairingId).toMatch(/space|barlow|archivo|spline/);
    expect(marineBrief.typography.fontPairingId).toMatch(/outfit|lexend/);
    expect(automotiveBrief.typography.fontPairingId).toMatch(/cinzel|clash|fraunces/);
  });

  // 2. Repeated generation does not produce the same palette, font pairing, hero, and section structure
  it("Requirement 2 — Distinct seeds produce distinct palettes, font pairings, heroes, and section structures", () => {
    const briefA = DesignBriefGenerator.generateBrief({
      prompt: "Interactive consumer digital audio experience",
      domain: "digital-audio",
      seed: 12345,
    });

    const briefB = DesignBriefGenerator.generateBrief({
      prompt: "Interactive consumer digital audio experience",
      domain: "digital-audio",
      seed: 98765,
    });

    // Color palettes must differ
    expect(briefA.brand.primaryColor).not.toBe(briefB.brand.primaryColor);
    expect(briefA.brand.hue).not.toBe(briefB.brand.hue);

    // Signatures must not be identical
    const sigA = CrossProjectSimilarityDetector.extractSignature(briefA);
    const sigB = CrossProjectSimilarityDetector.extractSignature(briefB);
    const comp = CrossProjectSimilarityDetector.compareSignatures(sigA, sigB);

    expect(comp.similarity).toBeLessThan(0.75);
  });

  // 3. Components consistently follow theme tokens without visual clobbering
  it("Requirement 3 — Component styling tokens consistently derive from theme palette", () => {
    const theme = ThemeGenerator.generateTheme({
      domain: "task-management",
      brandHue: 280,
      mode: "dark",
    });

    expect(theme.componentTokens.card.bg).toBe(theme.palette.surface);
    expect(theme.componentTokens.button.primaryBg).toBe(theme.palette.primary);
    expect(theme.componentTokens.button.primaryText).toBe(theme.palette.textOnPrimary);
    expect(theme.componentTokens.input.focusBorder).toBe(theme.palette.focusRing);
  });

  // 4. Required palette tokens are present
  it("Requirement 4 — All required color scales and semantic tokens are populated", () => {
    const theme = ThemeGenerator.generateTheme({
      domain: "inventory-mgmt",
      brandHue: 210,
    });

    expect(theme.palette.primaryScale[50]).toBeDefined();
    expect(theme.palette.primaryScale[500]).toBeDefined();
    expect(theme.palette.primaryScale[950]).toBeDefined();

    expect(theme.palette.background).toBeDefined();
    expect(theme.palette.surface).toBeDefined();
    expect(theme.palette.surfaceRaised).toBeDefined();
    expect(theme.palette.border).toBeDefined();
    expect(theme.palette.textPrimary).toBeDefined();
    expect(theme.palette.textSecondary).toBeDefined();
    expect(theme.palette.textMuted).toBeDefined();

    expect(theme.palette.semantic.success).toMatch(/^#[0-9a-f]{6}$/i);
    expect(theme.palette.semantic.warning).toMatch(/^#[0-9a-f]{6}$/i);
    expect(theme.palette.semantic.error).toMatch(/^#[0-9a-f]{6}$/i);
    expect(theme.palette.semantic.info).toMatch(/^#[0-9a-f]{6}$/i);
  });

  // 5. Actual text and control color combinations meet WCAG AA contrast requirements
  it("Requirement 5 — Text and control color combinations meet WCAG AA contrast (>= 4.5:1)", () => {
    const darkTheme = ThemeGenerator.generateTheme({
      domain: "dark-analytics",
      mode: "dark",
      brandHue: 160,
    });

    const lightTheme = ThemeGenerator.generateTheme({
      domain: "light-medical",
      mode: "light",
      brandHue: 195,
    });

    // Dark Mode Contrast checks
    const darkTextOnBg = getContrastRatio(darkTheme.palette.textPrimary, darkTheme.palette.background);
    const darkTextOnSurface = getContrastRatio(darkTheme.palette.textPrimary, darkTheme.palette.surface);
    const darkBtnTextOnBg = getContrastRatio(darkTheme.palette.textOnPrimary, darkTheme.palette.primary);

    expect(darkTextOnBg).toBeGreaterThanOrEqual(4.5);
    expect(darkTextOnSurface).toBeGreaterThanOrEqual(4.5);
    expect(darkBtnTextOnBg).toBeGreaterThanOrEqual(4.5);
    expect(darkTheme.contrastAudit.overallValid).toBe(true);

    // Light Mode Contrast checks
    const lightTextOnBg = getContrastRatio(lightTheme.palette.textPrimary, lightTheme.palette.background);
    const lightTextOnSurface = getContrastRatio(lightTheme.palette.textPrimary, lightTheme.palette.surface);
    const lightBtnTextOnBg = getContrastRatio(lightTheme.palette.textOnPrimary, lightTheme.palette.primary);

    expect(lightTextOnBg).toBeGreaterThanOrEqual(4.5);
    expect(lightTextOnSurface).toBeGreaterThanOrEqual(4.5);
    expect(lightBtnTextOnBg).toBeGreaterThanOrEqual(4.5);
    expect(lightTheme.contrastAudit.overallValid).toBe(true);
  });

  // 6. Typography fallbacks cascade gracefully to reliable system stacks
  it("Requirement 6 — All typography pairings contain complete system fallbacks", () => {
    const allPairings = TypographyManager.getAllPairings();
    expect(allPairings.length).toBeGreaterThanOrEqual(30);

    for (const pairing of allPairings) {
      expect(pairing.displayStack.includes("sans-serif") || pairing.displayStack.includes("serif")).toBe(true);
      expect(pairing.bodyStack.includes("sans-serif") || pairing.bodyStack.includes("serif")).toBe(true);
      expect(pairing.monoStack).toContain("monospace");
      expect(pairing.googleFontsUrl).toContain("fonts.googleapis.com");
      expect(pairing.scale.h1).toBeDefined();
      expect(pairing.scale.body).toBeDefined();
    }
  });

  // 7. Cross-project similarity detection catches repeated layouts, not just repeated colors
  it("Requirement 7 — Similarity detector catches identical layouts even with different colors", () => {
    const baseBrief = DesignBriefGenerator.generateBrief({
      prompt: "Operational monitoring console",
      domain: "operations",
      seed: 111,
      routes: ["/", "/metrics", "/alerts"],
    });

    const sigA = CrossProjectSimilarityDetector.extractSignature(baseBrief);

    // Clone signature but give it a totally different hue (e.g. 45deg -> 240deg)
    const sigB: ProjectDesignSignature = {
      ...sigA,
      projectId: "proj_clone_different_color",
      brandHue: (sigA.brandHue + 180) % 360,
      primaryColor: "#3b82f6",
    };

    const comp = CrossProjectSimilarityDetector.compareSignatures(sigB, sigA);

    // Color similarity is low (0), but structural similarity (hero, typo, sections, nav, density) is 100%
    const hueAxis = comp.breakdown.find((b) => b.axis === "hue");
    const heroAxis = comp.breakdown.find((b) => b.axis === "hero");
    const sectionAxis = comp.breakdown.find((b) => b.axis === "sectionSequence");

    expect(hueAxis?.score).toBe(0);
    expect(heroAxis?.score).toBe(1.0);
    expect(sectionAxis?.score).toBe(1.0);

    // Overall similarity must still trigger high-similarity warning (>= 0.70)
    expect(comp.similarity).toBeGreaterThanOrEqual(0.70);
    expect(comp.recommendations.length).toBeGreaterThan(0);
  });

  // 8. Similarity regeneration terminates within a defined retry limit
  it("Requirement 8 — Similarity gate terminates boundedly within max retry limit", () => {
    const candidate = DesignBriefGenerator.generateBrief({
      prompt: "Satellite telemetry passes",
      domain: "aerospace",
      seed: 555,
    });

    const identicalHistory: ProjectDesignSignature[] = [
      CrossProjectSimilarityDetector.extractSignature(candidate),
    ];

    const result = CrossProjectSimilarityGate.execute({
      candidateBrief: candidate,
      historySignatures: identicalHistory,
      prompt: "Satellite telemetry passes",
      domain: "aerospace",
    });

    // Must not exceed max retries
    expect(result.report.attempts).toBeLessThanOrEqual(4);
    expect(result.report.regenerationHistory.length).toBeGreaterThanOrEqual(1);
  });

  // 9. Unknown domains receive an appropriate original design without template phrase contamination
  it("Requirement 9 — Unknown novel domains receive tailored, original designs without template leakage", () => {
    const novelBrief = DesignBriefGenerator.generateBrief({
      prompt: "Geothermal bore hole pressure sensor visualizer and seismic acoustic warning system",
      domain: "geothermal-geophysics",
      seed: 777,
      routes: ["/", "/boreholes", "/seismic-hud"],
    });

    const validation = DesignBriefGenerator.validateBrief(novelBrief);
    expect(validation.valid).toBe(true);

    // Must not contain leaked template phrases
    const jsonStr = JSON.stringify(novelBrief).toLowerCase();
    expect(jsonStr).not.toContain("monograph");
    expect(jsonStr).not.toContain("itinerary");
    expect(jsonStr).not.toContain("exhibition schedule");
    expect(jsonStr).not.toContain("resumedashboard");

    expect(novelBrief.signatureInteraction.name).toBeDefined();
  });

  // 10. Existing valid Card, Tabs, Table, Button components are preserved non-destructively
  it("Requirement 10 — Sanitizer preserves custom LLM Card and Table styling non-destructively", () => {
    const sharedDir = join(testDir, "src", "shared", "components");
    mkdirSync(sharedDir, { recursive: true });

    const customCard = `import React from "react";
export const Card: React.FC<any> = ({ children, className = '' }) => (
  <div className={"custom-bespoke-atelier-card border-amber-500 bg-stone-900 " + className}>
    {children}
  </div>
);
export default Card;
`;
    const cardPath = join(sharedDir, "Card.tsx");
    writeFileSync(cardPath, customCard, "utf8");

    // Run sanitizer on project
    FastDeterministicSanitizer.sanitizeProject(testDir);

    const updatedCard = readFileSync(cardPath, "utf8");

    // Bespoke custom classes MUST NOT have been overwritten
    expect(updatedCard).toContain("custom-bespoke-atelier-card");
    expect(updatedCard).toContain("border-amber-500");
    // Missing subcomponents must have been appended cleanly
    expect(updatedCard).toContain("CardHeader");
    expect(updatedCard).toContain("CardTitle");
    expect(updatedCard).toContain("CardContent");
  });

  // 11. Required application features and routes survive visual synthesis
  it("Requirement 11 — All specified routes have dedicated page section plans in the design brief", () => {
    const routes = ["/", "/catalog", "/cart", "/checkout", "/order-status"];
    const brief = DesignBriefGenerator.generateBrief({
      prompt: "Artisanal bakery storefront",
      domain: "restaurant-ordering",
      routes,
    });

    expect(brief.pageSectionPlan.length).toBe(routes.length);
    for (const r of routes) {
      const match = brief.pageSectionPlan.find((p) => p.pageRoute === r);
      expect(match).toBeDefined();
      expect(match?.sections.length).toBeGreaterThanOrEqual(1);
    }
  });

  // 12. Design brief and theme artifacts are persisted and readable
  it("Requirement 12 — Design brief and theme artifacts persist in .aegis/ and are validated", () => {
    const theme = ThemeGenerator.generateTheme({
      domain: "student-portfolio",
      brandHue: 220,
      mode: "light",
      prompt: "Student honors academic research portfolio",
    });

    const themePath = ThemeGenerator.save(testDir, theme);
    expect(existsSync(themePath)).toBe(true);

    const brief = DesignBriefGenerator.generateBrief({
      prompt: "Student honors academic research portfolio",
      domain: "student-portfolio",
      theme,
      routes: ["/", "/courses", "/capstone"],
    });

    const briefPath = DesignBriefGenerator.save(testDir, brief);
    expect(existsSync(briefPath)).toBe(true);

    const loadedBrief = DesignBriefGenerator.read(testDir);
    expect(loadedBrief.briefId).toBe(brief.briefId);
    expect(loadedBrief.brand.primaryColor).toBe(theme.palette.primary);
  });
});
