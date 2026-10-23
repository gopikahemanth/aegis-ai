import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DesignBriefGenerator,
  type AegisDesignBriefV2,
} from "../../design/design-brief-generator.js";
import {
  ThemeGenerator,
  type ThemeSpecification,
} from "../../design/theme-generator.js";
import {
  CrossProjectSimilarityDetector,
  type ProjectDesignSignature,
} from "../../design/similarity-detector.js";
import { CrossProjectSimilarityGate } from "../../validation/cross-project-similarity-gate.js";
import { GOLDEN_GENERATION_SCENARIOS } from "../golden-scenarios.js";

describe("Phase 3: Real Golden Scenarios Design Evaluation", () => {
  let workDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), "aegis-golden-p3-"));
  });

  afterEach(() => {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {}
  });

  it("evaluates Golden Scenario 1: Thalassa Habitat (Marine Engineering)", () => {
    const scenario = GOLDEN_GENERATION_SCENARIOS[0]; // thalassa-habitat
    const projectDir = join(workDir, "thalassa-habitat");

    // 1. Generate Theme tailored to marine engineering
    const theme = ThemeGenerator.generateTheme({
      domain: scenario.domain,
      prompt: scenario.prompt,
      seed: 1001,
      mode: "obsidian",
    });

    // Marine theme expectations: cyan/teal/ocean hue (160-220 deg), obsidian dark bg
    expect(theme.brandHue).toBeGreaterThanOrEqual(160);
    expect(theme.brandHue).toBeLessThanOrEqual(220);
    expect(theme.mode).toBe("obsidian");
    expect(theme.contrastAudit.overallValid).toBe(true);
    expect(theme.contrastAudit.textOnSurface.ratio).toBeGreaterThanOrEqual(4.5);
    expect(theme.contrastAudit.focusOnBackground.ratio).toBeGreaterThanOrEqual(3.0);

    // Save theme
    const themePath = ThemeGenerator.save(projectDir, theme);
    expect(existsSync(themePath)).toBe(true);

    // 2. Generate Structured Design Brief
    const brief = DesignBriefGenerator.generateBrief({
      prompt: scenario.prompt,
      domain: scenario.domain,
      theme,
      seed: 1001,
      routes: scenario.expectedRoutes,
    });

    // Validate 16 pillars
    const validation = DesignBriefGenerator.validateBrief(brief);
    expect(validation.valid).toBe(true);
    expect(brief.projectType).toBe("Subsea Habitat & Marine Research Console");
    expect(brief.heroComposition.type).toBe("interactive-canvas");
    expect(brief.signatureInteraction.name).toContain("Hydrostatic");
    expect(brief.choicesToAvoid.length).toBeGreaterThanOrEqual(3);
    expect(brief.pageSectionPlan.length).toBe(scenario.expectedRoutes.length);

    // Save design brief
    const briefPath = DesignBriefGenerator.save(projectDir, brief);
    expect(existsSync(briefPath)).toBe(true);

    // Verify typography
    expect(brief.typography.displayFont).toBeDefined();
    expect(brief.typography.displayStack.includes("sans-serif") || brief.typography.displayStack.includes("serif")).toBe(true);
  });

  it("evaluates Golden Scenario 2: OrbitalSync (Aerospace Operations)", () => {
    const scenario = GOLDEN_GENERATION_SCENARIOS[1]; // orbitalsync-operations
    const projectDir = join(workDir, "orbitalsync-operations");

    // 1. Generate Theme tailored to aerospace telemetry operations
    const theme = ThemeGenerator.generateTheme({
      domain: scenario.domain,
      prompt: scenario.prompt,
      seed: 2002,
      mode: "dark",
    });

    // Aerospace operations: technical blue/indigo hue (190-260 deg)
    expect(theme.brandHue).toBeGreaterThanOrEqual(190);
    expect(theme.brandHue).toBeLessThanOrEqual(260);
    expect(theme.contrastAudit.overallValid).toBe(true);

    // 2. Generate Structured Design Brief
    const brief = DesignBriefGenerator.generateBrief({
      prompt: scenario.prompt,
      domain: scenario.domain,
      theme,
      seed: 2002,
      routes: scenario.expectedRoutes,
    });

    const validation = DesignBriefGenerator.validateBrief(brief);
    expect(validation.valid).toBe(true);
    expect(brief.projectType).toBe("Autonomous Aerospace Operations Hub");
    expect(brief.geometry.density).toBe("compact");
    expect(brief.navigation.strategy).toBe("sidebar-rail");
    expect(brief.signatureInteraction.name).toContain("Pass Downlink");
    expect(["JetBrains Mono", "Space Mono"]).toContain(brief.typography.monoFont);

    // Persist artifacts
    ThemeGenerator.save(projectDir, theme);
    DesignBriefGenerator.save(projectDir, brief);
  });

  it("evaluates Golden Scenario 3: Veloce Atelier (Luxury Automotive)", () => {
    const scenario = GOLDEN_GENERATION_SCENARIOS[2]; // veloce-atelier
    const projectDir = join(workDir, "veloce-atelier");

    // 1. Generate Theme tailored to luxury automotive atelier
    const theme = ThemeGenerator.generateTheme({
      domain: scenario.domain,
      prompt: scenario.prompt,
      seed: 3003,
      mode: "obsidian",
    });

    // Luxury automotive: gold/amber or bold crimson hue (20-60 or 340-360 deg)
    const isAmberGoldOrCrimson =
      (theme.brandHue >= 20 && theme.brandHue <= 60) ||
      theme.brandHue >= 340 ||
      theme.brandHue <= 15;
    expect(isAmberGoldOrCrimson).toBe(true);
    expect(theme.contrastAudit.overallValid).toBe(true);

    // 2. Generate Structured Design Brief
    const brief = DesignBriefGenerator.generateBrief({
      prompt: scenario.prompt,
      domain: scenario.domain,
      theme,
      seed: 3003,
      routes: scenario.expectedRoutes,
    });

    const validation = DesignBriefGenerator.validateBrief(brief);
    expect(validation.valid).toBe(true);
    expect(brief.projectType).toBe("Bespoke Hypercar Atelier & Commissioning Experience");
    expect(brief.geometry.density).toBe("spacious");
    expect(brief.navigation.strategy).toBe("minimal-header");
    expect(brief.heroComposition.type).toBe("centered-cinematic");
    expect(brief.signatureInteraction.name).toContain("Aerodynamics");

    // Persist artifacts
    ThemeGenerator.save(projectDir, theme);
    DesignBriefGenerator.save(projectDir, brief);
  });

  it("evaluates Contrasting Conventional Domain: CodeCraft Academy (Education)", () => {
    const projectDir = join(workDir, "codecraft-academy");
    const domain = "education";
    const prompt =
      "Create an interactive learning and mentoring portal for computer science students called CodeCraft Academy with course tracking, coding challenges, and mentor office hours.";
    const routes = ["/", "/courses", "/challenges", "/mentors", "/dashboard"];

    // 1. Generate Theme tailored to education
    const theme = ThemeGenerator.generateTheme({
      domain,
      prompt,
      seed: 4004,
      mode: "light", // Education benefits from accessible, readable light mode
    });

    // Educational palette: light mode with WCAG AA passing contrast
    expect(theme.mode).toBe("light");
    expect(theme.contrastAudit.overallValid).toBe(true);
    expect(theme.contrastAudit.textOnSurface.ratio).toBeGreaterThanOrEqual(4.5);

    // 2. Generate Structured Design Brief
    const brief = DesignBriefGenerator.generateBrief({
      prompt,
      domain,
      theme,
      seed: 4004,
      routes,
    });

    const validation = DesignBriefGenerator.validateBrief(brief);
    expect(validation.valid).toBe(true);
    expect(brief.projectType).toBe("Student Academic Portfolio & Learning Console");
    expect(brief.geometry.density).toBe("comfortable");
    expect(brief.navigation.strategy).toBe("bottom-tab");
    expect(brief.heroComposition.type).toBe("editorial-headline");
    expect(brief.signatureInteraction.name).toContain("Curriculum");

    // Persist artifacts
    ThemeGenerator.save(projectDir, theme);
    DesignBriefGenerator.save(projectDir, brief);
  });

  it("evaluates cross-project differentiation across all 4 generated websites", () => {
    const scenarios = [
      {
        domain: "marine-engineering",
        prompt: GOLDEN_GENERATION_SCENARIOS[0].prompt,
        routes: GOLDEN_GENERATION_SCENARIOS[0].expectedRoutes,
        seed: 1001,
        mode: "obsidian" as const,
      },
      {
        domain: "aerospace-operations",
        prompt: GOLDEN_GENERATION_SCENARIOS[1].prompt,
        routes: GOLDEN_GENERATION_SCENARIOS[1].expectedRoutes,
        seed: 2002,
        mode: "dark" as const,
      },
      {
        domain: "luxury-automotive",
        prompt: GOLDEN_GENERATION_SCENARIOS[2].prompt,
        routes: GOLDEN_GENERATION_SCENARIOS[2].expectedRoutes,
        seed: 3003,
        mode: "obsidian" as const,
      },
      {
        domain: "education",
        prompt: "Create an interactive learning portal called CodeCraft Academy",
        routes: ["/", "/courses", "/challenges"],
        seed: 4004,
        mode: "light" as const,
      },
    ];

    const briefs: AegisDesignBriefV2[] = scenarios.map((s) => {
      const theme = ThemeGenerator.generateTheme({
        domain: s.domain,
        prompt: s.prompt,
        seed: s.seed,
        mode: s.mode,
      });
      return DesignBriefGenerator.generateBrief({
        prompt: s.prompt,
        domain: s.domain,
        theme,
        seed: s.seed,
        routes: s.routes,
      });
    });

    // Extract signatures
    const signatures = briefs.map((b) => CrossProjectSimilarityDetector.extractSignature(b));

    // Compare all pairs: NO two projects should have similarity >= 0.70
    for (let i = 0; i < signatures.length; i++) {
      for (let j = i + 1; j < signatures.length; j++) {
        const sim = CrossProjectSimilarityDetector.compareSignatures(signatures[i], signatures[j]);
        expect(sim.similarity).toBeLessThan(0.70);
      }
    }

    // Verify bounded similarity gate: When an identical duplicate is presented, gate recommends distinct parameters
    const duplicateCandidate = DesignBriefGenerator.generateBrief({
      prompt: scenarios[0].prompt,
      domain: scenarios[0].domain,
      theme: ThemeGenerator.generateTheme({
        domain: scenarios[0].domain,
        prompt: scenarios[0].prompt,
        seed: scenarios[0].seed,
      }),
      seed: scenarios[0].seed,
      routes: scenarios[0].routes,
    });

    const gateResult = CrossProjectSimilarityGate.execute({
      candidateBrief: duplicateCandidate,
      historySignatures: [signatures[0]],
      prompt: scenarios[0].prompt,
      domain: scenarios[0].domain,
      routes: scenarios[0].routes,
      maxRetries: 3,
    });

    expect(gateResult.report.attempts).toBeGreaterThanOrEqual(1);
    expect(gateResult.resolvedBrief.briefId).toBeDefined();
  });
});
